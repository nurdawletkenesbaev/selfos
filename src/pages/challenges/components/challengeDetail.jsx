import { useState, useEffect, useRef, useMemo } from 'react'
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
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Checkbox,
  message,
  Spin,
  Progress,
} from 'antd'
import { CgMathPlus } from 'react-icons/cg'
import { BiEditAlt } from 'react-icons/bi'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md'
import { HiOutlineFire } from 'react-icons/hi'
import { BsLightning } from 'react-icons/bs'
import './challengeDetailCss.css'
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
  const [loadingTaskId, setLoadingTaskId] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form] = Form.useForm()
  const [modalLoading, setModalLoading] = useState(false)
  const todayRef = useRef(null)

  const getPopupContainer = (triggerNode) =>
    (triggerNode && triggerNode.closest && triggerNode.closest('.ant-modal')) ||
    document.body

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

  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [loading])

  useEffect(() => {
    if (!openModal) return
    if (editTask) {
      form.setFieldsValue({
        taskName: editTask.taskName || '',
        type: editTask.type || 'quicktask',
        reminder: editTask.reminder
          ? dayjs.unix(editTask.reminder.seconds)
          : null,
      })
    } else {
      form.resetFields()
    }
  }, [openModal, editTask, form])

  const dailyProgressPercentage = useMemo(() => {
    const todaysTasks = tasks.filter((task) => {
      if (!task.date) return false
      const taskDate = task.date.seconds
        ? dayjs.unix(task.date.seconds)
        : dayjs(task.date)
      return taskDate.isSame(dayjs(), 'day')
    })

    const completed = todaysTasks.filter((t) => t.completed).length
    const total = todaysTasks.length
    return total ? Math.round((completed / total) * 100) : 0
  }, [tasks])

  const getFormattedDate = (date) => {
    return new Date(date.seconds * 1000).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const groupedTasks = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        if (!task.date) return acc
        const dateStr = getFormattedDate(task.date)
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(task)
        return acc
      }, {}),
    [tasks]
  )

  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleOk = async () => {
    try {
      setModalLoading(true) // ✅ bosilganda loading yoqiladi
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
      }
      await fetchTasks(false)
      setOpenModal(false)
      setEditTask(null)
      form.resetFields()
    } catch (err) {
      console.error(err)
      message.error('Xatolik yuz berdi!')
    } finally {
      setModalLoading(false) // ✅ loading to'xtaydi
    }
  }

  const handleOpenCreate = () => {
    setEditTask(null)
    form.resetFields()
    setOpenModal(true)
  }

  const handleOpenEdit = (task) => {
    setEditTask(task)
    setOpenModal(true)
  }

  const handleCancelModal = () => {
    setOpenModal(false)
    setEditTask(null)
    form.resetFields()
  }

  const handleDelete = (task) => {
    confirm({
      title: "Taskni o'chirmoqchimisiz?",
      content: `"${task.taskName}" o'chiriladi!`,
      okText: "Ha, o'chir",
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
          fetchTasks(false)
          message.success("Task o'chirildi!")
        } catch (err) {
          console.error(err)
          message.error('Xatolik yuz berdi!')
        }
      },
    })
  }

  const toggleCompleted = async (task) => {
    try {
      setLoadingTaskId(task.id)
      await updateDoc(
        doc(db, `users/${userId}/challenges/${challengeId}/tasks/${task.id}`),
        { completed: !task.completed }
      )
      fetchTasks(false)
    } catch (err) {
      console.error(err)
      message.error('Completed holatini yangilashda xatolik!')
    } finally {
      setLoadingTaskId(null)
    }
  }

  if (loading && !challenge) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 custom-scrollbar'>
      {/* Sticky Header */}
      <div className='sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 challenge-header'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex-1'>
              <Text
                className='text-sm font-semibold text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-1'
                onClick={() => navigate(-1)}
              >
                ← Orqaga
              </Text>
            </div>
            <div className='flex-1 text-center'>
              <Title level={5} className='text-gray-800 m-0 truncate font-bold'>
                {challenge?.title}
              </Title>
            </div>
            <div className='flex-1 text-right'>
              <Text className='text-sm font-bold text-blue-600'>
                {dailyProgressPercentage}% (Bugun)
              </Text>
            </div>
          </div>
          {/* ✅ Ant Design Progress qo‘shildi */}
          <Progress
            percent={dailyProgressPercentage}
            strokeColor={{
              from: '#108ee9',
              to: '#87d068',
            }}
            status='active'
            showInfo={false}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-6 py-8'>
        {loading ? (
          <div className='text-center py-12'>
            <Spin size='large' />
          </div>
        ) : (
          <div className='space-y-8'>
            {Object.keys(groupedTasks).length > 0 ? (
              Object.keys(groupedTasks).map((date) => (
                <div
                  key={date}
                  className='space-y-4'
                  ref={date === todayStr ? todayRef : null}
                >
                  <div className='date-header'>
                    <Text className='date-text'>
                      {date === todayStr ? `Bugun, ${date}` : date}
                    </Text>
                  </div>
                  <div className='space-y-3'>
                    {groupedTasks[date].map((task) => (
                      <div
                        key={task.id}
                        className={`task-card ${
                          task.completed ? 'completed' : ''
                        }`}
                      >
                        <div className='flex items-center space-x-4'>
                          <button
                            onClick={() => toggleCompleted(task)}
                            disabled={loadingTaskId === task.id}
                            className='completion-button'
                          >
                            {loadingTaskId === task.id ? (
                              <Spin size='small' />
                            ) : task.completed ? (
                              <MdCheckCircle size={18} />
                            ) : (
                              <MdRadioButtonUnchecked size={18} />
                            )}
                          </button>
                          <div className=' flex-1 min-w-0'>
                            <Text className='task-name'>{task.taskName}</Text>
                            {/* <div className='gamification-elements'>
                              <div className='flex items-center space-x-1'>
                                <BsLightning className='text-orange-400' />
                                <Text className='text-xs text-gray-500 font-medium'>
                                  +10 XP
                                </Text>
                              </div>
                              <div className='flex items-center space-x-1'>
                                <HiOutlineFire className='text-red-400' />
                                <Text className='text-xs text-gray-500 font-medium'>
                                  Streak
                                </Text>
                              </div>
                            </div> */}
                          </div>
                          <div className='action-buttons'>
                            <Button
                              type='text'
                              size='small'
                              onClick={() => handleOpenEdit(task)}
                              icon={<BiEditAlt size={18} />}
                            />
                            <Button
                              type='text'
                              size='small'
                              danger
                              onClick={() => handleDelete(task)}
                              icon={<RiDeleteBin5Line size={18} />}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-16'>
                <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <CgMathPlus size={32} className='text-gray-400' />
                </div>
                <Text className='text-xl font-semibold text-gray-700 mb-2'>
                  Hali vazifalar yo'q
                </Text>
                <Text className='text-gray-500 mb-6'>
                  Birinchi vazifangizni yaratib, challengeni boshlang!
                </Text>
                <Button
                  type='primary'
                  size='large'
                  onClick={handleOpenCreate}
                  className='create-first-task-btn'
                >
                  Birinchi vazifani yaratish
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* "+" Button */}
      {Object.keys(groupedTasks).length > 0 && (
        <div className='fixed bottom-8 right-8 z-50'>
          <button
            onClick={handleOpenCreate}
            className='cursor-pointer flex items-center justify-center w-[40px] h-[40px] bg-[#001529] rounded md animate-bounce fab-modern'
          >
            <CgMathPlus size={24} color='#4096ff' />
          </button>
        </div>
      )}

      {/* ✅ MODAL TUZATILGAN */}
      <Modal
        title={editTask ? 'Taskni tahrirlash' : 'Yangi task yaratish'}
        open={openModal}
        onOk={handleOk}
        onCancel={handleCancelModal}
        okText={editTask ? 'Saqlash' : 'Yaratish'}
        cancelText='Bekor qilish'
        destroyOnHidden={false}
        maskClosable={false}
        confirmLoading={modalLoading} // ✅ modal OK tugmasi loading holati
      >
        <Form
          form={form}
          layout='vertical'
          style={{ marginTop: '24px' }}
          preserve={true}
        >
          <Form.Item
            name='taskName'
            label='Task nomi'
            rules={[{ required: true, message: 'Nom kiriting!' }]}
          >
            <Input size='large' placeholder='Masalan: 30 daqiqa yugurish' />
          </Form.Item>
          <Form.Item
            name='type'
            label='Turi'
            rules={[{ required: true, message: 'Type tanlang!' }]}
            initialValue='quicktask'
          >
            <Select size='large'>
              <Option value='quicktask'>Quick Task</Option>
              <Option value='main'>Main Task</Option>
            </Select>
          </Form.Item>

          {!editTask && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <Form.Item
                  name='startDay'
                  label='Boshlanish kuni'
                  rules={[{ required: true, message: 'Sanani tanlang!' }]}
                >
                  <DatePicker
                    size='large'
                    className='w-full'
                    getPopupContainer={getPopupContainer}
                  />
                </Form.Item>
                <Form.Item
                  name='endDay'
                  label='Tugash kuni'
                  rules={[{ required: true, message: 'Sanani tanlang!' }]}
                >
                  <DatePicker
                    size='large'
                    className='w-full'
                    getPopupContainer={getPopupContainer}
                  />
                </Form.Item>
              </div>
              <Form.Item
                name='activeDays'
                label='Faol kunlar'
                rules={[{ required: true, message: 'Kunlarni tanlang!' }]}
              >
                <Checkbox.Group options={weekDaysOptions} />
              </Form.Item>
            </>
          )}

          <Form.Item name='reminder' label='Eslatma'>
            <DatePicker
              size='large'
              className='w-full'
              showTime
              placeholder='Eslatma vaqtini tanlang'
              getPopupContainer={getPopupContainer}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ChallengeDetail
