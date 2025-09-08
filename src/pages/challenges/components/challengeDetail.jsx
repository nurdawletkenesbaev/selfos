import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../../firebase/firebase'
import {
  Typography,
  List,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Checkbox,
  message,
} from 'antd'
import { CgMathPlus } from 'react-icons/cg'
import { BiEditAlt } from 'react-icons/bi'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle } from 'react-icons/md'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { confirm } = Modal
const { Option } = Select

const weekDaysOptions = [
  { label: 'Yakshanba', value: 0 },
  { label: 'Dushanba', value: 1 },
  { label: 'Seshanba', value: 2 },
  { label: 'Chorshanba', value: 3 },
  { label: 'Payshanba', value: 4 },
  { label: 'Juma', value: 5 },
  { label: 'Shanba', value: 6 },
]

function ChallengeDetail({ userId }) {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form] = Form.useForm()

  // 🔹 Fetch challenge
  const fetchChallenge = async () => {
    if (!userId || !challengeId) return
    try {
      const docRef = doc(db, `users/${userId}/challenges/${challengeId}`)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setChallenge({ id: docSnap.id, ...docSnap.data() })
      } else {
        message.error('Challenge topilmadi!')
        navigate(-1)
      }
    } catch (err) {
      console.error(err)
      message.error('Xatolik yuz berdi!')
    }
  }

  // 🔹 Fetch tasks
  const fetchTasks = async (withLoading = true) => {
    if (!userId || !challengeId) return
    if (withLoading) setLoading(true)
    try {
      const q = query(
        collection(db, `users/${userId}/challenges/${challengeId}/tasks`),
        orderBy('date', 'asc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setTasks(data)
    } catch (err) {
      console.error(err)
      message.error('Tasklarni yuklashda xatolik!')
    }
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    fetchChallenge()
    fetchTasks()
  }, [userId, challengeId])

  // 🔹 Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!task.date) return acc
    const dateStr = new Date(task.date.seconds * 1000).toLocaleDateString()
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(task)
    return acc
  }, {})

  // 🔹 Create/Edit task
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
  
      if (editTask) {
        await updateDoc(
          doc(
            db,
            `users/${userId}/challenges/${challengeId}/tasks/${editTask.id}`
          ),
          {
            taskName: values.taskName,
            type: values.type,
            reminder: values.reminder
              ? Timestamp.fromDate(values.reminder.toDate())
              : null,
            updatedAt: Timestamp.now(),
          }
        )
        // Optimistik update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editTask.id
              ? {
                  ...t,
                  taskName: values.taskName,
                  type: values.type,
                  reminder: values.reminder
                    ? { seconds: values.reminder.unix() }
                    : null,
                }
              : t
          )
        )
        message.success('Task yangilandi!')
      } else {
        const startDay = values.startDay.toDate()
        const endDay = values.endDay.toDate()
        const activeDays = values.activeDays || []
  
        let current = new Date(startDay)
        while (current <= endDay) {
          if (activeDays.includes(current.getDay())) {
            await addDoc(
              collection(db, `users/${userId}/challenges/${challengeId}/tasks`),
              {
                challengeId,
                taskName: values.taskName,
                type: values.type,
                date: Timestamp.fromDate(new Date(current)),
                reminder: values.reminder
                  ? Timestamp.fromDate(values.reminder.toDate())
                  : null,
                completed: false,
                createdAt: Timestamp.now(),
              }
            )
          }
          current.setDate(current.getDate() + 1)
        }
        message.success('Task(lar) yaratildi!')
        fetchTasks(false) // 🔹 yangi tasklarni olish
      }
  
      setOpenModal(false)
      form.resetFields()
      setEditTask(null)
    } catch (err) {
      console.error(err)
      message.error('Xatolik yuz berdi!')
    }
  }

  const handleOpenCreate = () => {
    setEditTask(null)
    form.resetFields()
    setOpenModal(true)
  }

  const handleOpenEdit = (task) => {
    setEditTask(task)
    form.setFieldsValue({
      taskName: task.taskName,
      type: task.type,
      startDay: task.date ? dayjs(task.date.seconds * 1000) : null,
      endDay: task.date ? dayjs(task.date.seconds * 1000) : null,
      activeDays: [new Date(task.date.seconds * 1000).getDay()],
      reminder: task.reminder ? dayjs(task.reminder.seconds * 1000) : null,
    })
    setOpenModal(true)
  }

  const handleDelete = (task) => {
    confirm({
      title: 'Are you sure you want to delete this task?',
      content: `"${task.taskName}" o‘chiriladi!`,
      okText: 'Ha, o‘chir',
      okType: 'danger',
      cancelText: 'Bekor qilish',
      onOk: async () => {
        try {
          await deleteDoc(
            doc(
              db,
              `users/${userId}/challenges/${challengeId}/tasks/${task.id}`
            )
          )
          // Optimistik update
          setTasks((prev) => prev.filter((t) => t.id !== task.id))
          message.success('Task o‘chirildi!')
        } catch (err) {
          console.error(err)
          message.error('Xatolik yuz berdi!')
        }
      },
    })
  }

  const toggleCompleted = async (task) => {
    try {
      await updateDoc(
        doc(db, `users/${userId}/challenges/${challengeId}/tasks/${task.id}`),
        { completed: !task.completed }
      )
      // Optimistik update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !task.completed } : t
        )
      )
    } catch (err) {
      console.error(err)
      message.error('Completed holatini yangilashda xatolik!')
    }
  }

  if (!challenge) return <Text>Loading challenge...</Text>

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} className='text-center'>
        {challenge.title}
      </Title>

      <div className='absolute bottom-4 right-4 animate-bounce z-10'>
        <Button
          style={{ backgroundColor: '#1677ff' }}
          onClick={handleOpenCreate}
        >
          <CgMathPlus color='white' size={20} />
        </Button>
      </div>

      {loading ? (
        <Text>Loading tasks...</Text>
      ) : (
        Object.keys(groupedTasks).map((date) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <Text strong>{date}</Text>
            <List
              bordered
              dataSource={groupedTasks[date]}
              renderItem={(task) => (
                <List.Item
                  className={`${
                    task.completed ? 'bg-green-500' : 'bg-red-100'
                  } rounded-md`}
                  actions={[
                    <Button
                      className='gray-600'
                      type='link'
                      onClick={() => handleOpenEdit(task)}
                      icon={<BiEditAlt />}
                    />,
                    <Button
                      className='gray-600'
                      type='link'
                      danger
                      onClick={() => handleDelete(task)}
                      icon={<RiDeleteBin5Line />}
                    />,
                    <Button
                      // className='text-green-600'
                      type='link'
                      onClick={() => toggleCompleted(task)}
                      icon={
                        <MdCheckCircle
                          color={task.completed ? 'green' : 'gray'}
                        />
                      }
                    />,
                  ]}
                >
                  {task.taskName} {task.completed ? '- Completed' : ''}
                </List.Item>
              )}
            />
          </div>
        ))
      )}

      <Modal
        title={editTask ? 'Edit Task' : 'Yangi Task'}
        open={openModal}
        onOk={handleOk}
        onCancel={() => {
          setOpenModal(false)
          setEditTask(null)
          form.resetFields()
        }}
        okText={editTask ? 'Save' : 'Yaratish'}
        cancelText='Bekor qilish'
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='taskName'
            label='Task nomi'
            rules={[{ required: true, message: 'Nom kiriting!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name='type'
            label='Type'
            rules={[{ required: true, message: 'Type tanlang!' }]}
          >
            <Select>
              <Option value='quicktask'>Quick Task</Option>
              <Option value='main'>Main Task</Option>
            </Select>
          </Form.Item>

          {!editTask && (
            <>
              <Form.Item
                name='startDay'
                label='Start Day'
                rules={[
                  { required: true, message: 'Boshlanish kunini tanlang!' },
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name='endDay'
                label='End Day'
                rules={[{ required: true, message: 'Tugash kunini tanlang!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name='activeDays'
                label='Active Days'
                rules={[
                  { required: true, message: 'Hafta kunlarini tanlang!' },
                ]}
              >
                <Checkbox.Group options={weekDaysOptions} />
              </Form.Item>
            </>
          )}

          <Form.Item name='reminder' label='Reminder'>
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ChallengeDetail
