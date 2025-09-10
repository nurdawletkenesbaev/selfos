import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import {
  Typography,
  List,
  Button,
  message,
  Modal,
  Spin,
  Form,
  Input,
  DatePicker,
  Select,
} from 'antd'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle } from 'react-icons/md'
import { BiEditAlt } from 'react-icons/bi'
import dayjs from 'dayjs'
import { useAuth } from '../../firebase/AuthContext'

const { Title, Text } = Typography
const { confirm } = Modal
const { Option } = Select

function TodaysTasks() {
  const { currentUser } = useAuth()
  const userId = currentUser?.uid

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState({})
  const [editTask, setEditTask] = useState(null) // 🔹 edit uchun
  const [openModal, setOpenModal] = useState(false)
  const [form] = Form.useForm()

  // 🔹 Bugungi tasklarni olish
  const fetchTodaysTasks = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const challengesRef = collection(db, 'users', userId, 'challenges')
      const challengesSnap = await getDocs(challengesRef)

      const allTasks = []
      const todayStart = dayjs().startOf('day').toDate()
      const todayEnd = dayjs().endOf('day').toDate()

      for (const challengeDoc of challengesSnap.docs) {
        const challengeData = challengeDoc.data()
        const challengeId = challengeDoc.id
        const challengeTitle =
          challengeData.title || challengeData.name || 'No name'

        const tasksRef = collection(
          db,
          'users',
          userId,
          'challenges',
          challengeId,
          'tasks'
        )

        const q = query(
          tasksRef,
          where('date', '>=', todayStart),
          where('date', '<=', todayEnd),
          orderBy('date', 'asc')
        )

        const tasksSnap = await getDocs(q)
        tasksSnap.forEach((taskDoc) => {
          allTasks.push({
            id: taskDoc.id,
            challengeId,
            challengeTitle,
            ...taskDoc.data(),
          })
        })
      }

      setTasks(allTasks)
    } catch (err) {
      console.error('🔥 Fetch error:', err)
      message.error('Bugungi tasklarni olishda xatolik!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysTasks()
  }, [userId])

  // 🔹 Taskni o‘chirish
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
              `users/${userId}/challenges/${task.challengeId}/tasks/${task.id}`
            )
          )
          setTasks((prev) => prev.filter((t) => t.id !== task.id))
          message.success('Task o‘chirildi!')
        } catch (err) {
          console.error(err)
          message.error('Xatolik yuz berdi!')
        }
      },
    })
  }

  // 🔹 Taskni completed qilish
  const toggleCompleted = async (task) => {
    setLoadingTasks((prev) => ({ ...prev, [task.id]: true }))

    try {
      await updateDoc(
        doc(
          db,
          `users/${userId}/challenges/${task.challengeId}/tasks/${task.id}`
        ),
        { completed: !task.completed }
      )
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !task.completed } : t
        )
      )
    } catch (err) {
      console.error(err)
      message.error('Completed holatini yangilashda xatolik!')
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [task.id]: false }))
    }
  }

  // 🔹 Taskni edit qilish
  const handleOpenEdit = (task) => {
    setEditTask(task)
    form.setFieldsValue({
      taskName: task.taskName,
      type: task.type,
      reminder: task.reminder ? dayjs(task.reminder.seconds * 1000) : null,
    })
    setOpenModal(true)
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await updateDoc(
        doc(
          db,
          `users/${userId}/challenges/${editTask.challengeId}/tasks/${editTask.id}`
        ),
        {
          taskName: values.taskName,
          type: values.type,
          reminder: values.reminder
            ? { seconds: values.reminder.unix() }
            : null,
        }
      )
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
      setOpenModal(false)
      setEditTask(null)
      form.resetFields()
    } catch (err) {
      console.error(err)
      message.error('Taskni yangilashda xatolik!')
    }
  }

  // 🔹 Guruhlash
  const groupedByChallenge = tasks.reduce((acc, task) => {
    if (!acc[task.challengeTitle]) acc[task.challengeTitle] = []
    acc[task.challengeTitle].push(task)
    return acc
  }, {})

  if (loading)
    return (
      <div
        className='w-full h-full flex items-center justify-center'
        style={{ textAlign: 'center', padding: '50px' }}
      >
        <Spin size='large' />
      </div>
    )

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} className='text-center'>
        Today's Tasks
      </Title>

      {Object.keys(groupedByChallenge).length === 0 ? (
        <Text>Bugungi kun uchun tasklar topilmadi.</Text>
      ) : (
        Object.keys(groupedByChallenge).map((challengeTitle) => (
          <div key={challengeTitle} style={{ marginBottom: 20 }}>
            <Text strong>{challengeTitle}</Text>
            <List
              bordered
              dataSource={groupedByChallenge[challengeTitle]}
              renderItem={(task) => (
                <List.Item
                  className={`${
                    task.completed ? 'bg-green-500' : 'bg-red-100'
                  } rounded-md`}
                  actions={[
                    <Button
                      type='link'
                      onClick={() => handleOpenEdit(task)}
                      icon={<BiEditAlt />}
                    />,
                    <Button
                      type='link'
                      danger
                      onClick={() => handleDelete(task)}
                      icon={<RiDeleteBin5Line />}
                    />,
                    <Button
                      type='link'
                      onClick={() =>
                        !loadingTasks[task.id] && toggleCompleted(task)
                      }
                      disabled={loadingTasks[task.id]}
                      icon={
                        loadingTasks[task.id] ? (
                          <Spin size='small' />
                        ) : (
                          <MdCheckCircle
                            color={task.completed ? 'green' : 'gray'}
                          />
                        )
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

      {/* 🔹 Edit Modal */}
      <Modal
        title='Edit Task'
        open={openModal}
        onOk={handleOk}
        onCancel={() => {
          setOpenModal(false)
          setEditTask(null)
          form.resetFields()
        }}
        okText='Save'
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

          <Form.Item name='reminder' label='Reminder'>
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TodaysTasks
