// TodaysTasks.jsx
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
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import {
  Typography,
  Button,
  message,
  Modal,
  Spin,
  Progress,
  Form,
  Input,
} from 'antd'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md'
import { BiEditAlt } from 'react-icons/bi'
import { CgMathPlus } from 'react-icons/cg'
import dayjs from 'dayjs'
import { useAuth } from '../../firebase/AuthContext'
import '../challenges/components/challengeDetailCss.css'

const { Title, Text } = Typography
const { confirm } = Modal

function TodaysTasks() {
  const { currentUser } = useAuth()
  const userId = currentUser?.uid

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTaskId, setLoadingTaskId] = useState(null)

  const [openModal, setOpenModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchTodaysTasks = async (showLoader = true) => {
    if (!userId) return
    try {
      if (showLoader) setLoading(true)
      const challengesRef = collection(db, 'users', userId, 'challenges')
      const challengesSnap = await getDocs(challengesRef)

      const allTasks = []
      const todayStart = dayjs().startOf('day').toDate()
      const todayEnd = dayjs().endOf('day').toDate()

      for (const challengeDoc of challengesSnap.docs) {
        const challengeData = challengeDoc.data()
        const challengeId = challengeDoc.id
        const challengeTitle = challengeData.title || 'No name'

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
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysTasks()
  }, [userId])

  const handleDelete = (task) => {
    confirm({
      title: 'Taskni o‘chirmoqchimisiz?',
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
          fetchTodaysTasks()
          message.success('Task o‘chirildi!')
        } catch (err) {
          console.error(err)
          message.error('Xatolik yuz berdi!')
        }
      },
    })
  }

  const toggleCompleted = async (task) => {
    const newStatus = !task.completed
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus } : t))
    )
    setLoadingTaskId(task.id)

    try {
      await updateDoc(
        doc(
          db,
          `users/${userId}/challenges/${task.challengeId}/tasks/${task.id}`
        ),
        { completed: newStatus }
      )
    } catch (err) {
      console.log(err)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !newStatus } : t))
      )
      message.error('Completed holatini yangilashda xatolik!')
    } finally {
      setLoadingTaskId(null)
    }
  }

  const handleOpenEdit = (task) => {
    setEditTask(task)
    setOpenModal(true)
  }

  useEffect(() => {
    if (!openModal) return
    if (editTask) {
      form.setFieldsValue({ taskName: editTask.taskName || '' })
    } else form.resetFields()
  }, [openModal, editTask, form])

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (!userId || !editTask) return
      setModalLoading(true)
      await updateDoc(
        doc(db, 'users', userId, 'challenges', editTask.challengeId, 'tasks', editTask.id),
        { taskName: values.taskName, updatedAt: Timestamp.now() }
      )
      message.success('Task yangilandi!')
      fetchTodaysTasks()
      setOpenModal(false)
      setEditTask(null)
      form.resetFields()
    } catch (err) {
      console.error(err)
      message.error('Taskni yangilashda xatolik!')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCancelModal = () => {
    setOpenModal(false)
    setEditTask(null)
    form.resetFields()
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className='min-h-screen bg-gray-50 px-4 sm:px-6 py-6'>
      <div className='max-w-2xl mx-auto'>
        <Title level={4} className='text-center mb-4 text-gray-800'>
          Bugungi vazifalar
        </Title>

        {!loading && totalCount > 0 && (
          <div className='flex justify-center mb-6'>
            <Progress
              type='dashboard'
              steps={8}
              percent={Math.round(progress)}
              trailColor='rgba(0, 0, 0, 0.06)'
              strokeWidth={28}
            />
          </div>
        )}

        {loading ? (
          <div className='flex justify-center py-12'>
            <Spin size='large' />
          </div>
        ) : tasks.length > 0 ? (
          <div className='space-y-3'>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm bg-white transition-all ${
                  task.completed ? 'bg-green-50 border-green-200' : 'border-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleCompleted(task)}
                  disabled={loadingTaskId === task.id}
                  className='shrink-0 grid place-content-center w-7 h-7 rounded-full bg-white shadow-sm'
                >
                  {loadingTaskId === task.id ? (
                    <Spin size='small' />
                  ) : task.completed ? (
                    <MdCheckCircle className='text-green-500' size={20} />
                  ) : (
                    <MdRadioButtonUnchecked className='text-gray-400' size={20} />
                  )}
                </button>

                <div className='flex-1 min-w-0'>
                  <p className={`font-medium text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.taskName}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>{task.challengeTitle}</p>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    type='text'
                    size='small'
                    icon={<BiEditAlt size={18} />}
                    onClick={() => handleOpenEdit(task)}
                    className='text-gray-500 hover:text-blue-600'
                  />
                  <Button
                    type='text'
                    size='small'
                    danger
                    icon={<RiDeleteBin5Line size={18} />}
                    onClick={() => handleDelete(task)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <div className='w-20 h-20 bg-gray-100 rounded-full grid place-content-center mx-auto mb-4'>
              <CgMathPlus size={28} className='text-gray-400' />
            </div>
            <Text className='text-lg font-semibold text-gray-700'>Bugungi vazifalar yo‘q</Text>
            <Text className='text-gray-500 block mt-1'>Challenge sahifasida vazifa qo‘shing!</Text>
          </div>
        )}

        <Modal
          title='Taskni tahrirlash'
          open={openModal}
          onOk={handleModalOk}
          onCancel={handleCancelModal}
          okText='Saqlash'
          cancelText='Bekor qilish'
          confirmLoading={modalLoading}
          destroyOnClose={false}
          maskClosable={false}
        >
          <Form form={form} layout='vertical' className='mt-2'>
            <Form.Item
              name='taskName'
              label='Task nomi'
              rules={[{ required: true, message: 'Nom kiriting!' }]}
            >
              <Input size='large' placeholder='Masalan: 30 daqiqa yugurish' />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default TodaysTasks
