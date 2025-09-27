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
  Timestamp, // qo'shdik
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import {
  Typography,
  Button,
  message,
  Modal,
  Spin,
  Progress,
  Form,    // qo'shdik
  Input,   // qo'shdik
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

  // ===== Qo'shilgan state va form =====
  const [openModal, setOpenModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [form] = Form.useForm()
  // ====================================

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
    // 1. Optimistik yangilash
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

  // Edit modal handlers
  const handleOpenEdit = (task) => {
    setEditTask(task)
    setOpenModal(true)
  }

  useEffect(() => {
    if (!openModal) return
    // agar editTask mavjud bo'lsa formga qiymat qo'yamiz
    if (editTask) {
      form.setFieldsValue({
        taskName: editTask.taskName || '',
      })
    } else {
      form.resetFields()
    }
  }, [openModal, editTask, form])

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (!userId || !editTask) return
      setModalLoading(true)
      await updateDoc(
        doc(db, 'users', userId, 'challenges', editTask.challengeId, 'tasks', editTask.id),
        {
          taskName: values.taskName,
          updatedAt: Timestamp.now(),
        }
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

  // 🔥 PROGRESS hisoblash
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className='min-h-screen bg-gray-50 custom-scrollbar'>
      <div className='max-w-4xl mx-auto px-6 py-8'>
        <Title level={3} className='text-center mb-4'>
          Bugungi vazifalar
        </Title>

        {/* 🔥 Dashboard Progress Bar */}
        {!loading && totalCount > 0 && (
          <div className='flex justify-center mb-6'>
            <Progress
              type='dashboard'
              steps={8}
              percent={Math.round(progress)}
              trailColor='rgba(0, 0, 0, 0.06)'
              strokeWidth={30}
            />
          </div>
        )}

        {loading ? (
          <div className='text-center py-12'>
            <Spin size='large' />
          </div>
        ) : tasks.length > 0 ? (
          <div className='space-y-4'>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? 'completed' : ''}`}
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
                  <div className='flex-1 min-w-0'>
                    <Text className='task-name'>{task.taskName}</Text>
                    <Text className='text-xs text-gray-500'>
                      {task.challengeTitle}
                    </Text>
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
        ) : (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CgMathPlus size={32} className='text-gray-400' />
            </div>
            <Text className='text-xl font-semibold text-gray-700 mb-2'>
              Bugungi vazifalar yo‘q
            </Text>
            <Text className='text-gray-500'>
              Challenge sahifasida vazifa qo‘shing!
            </Text>
          </div>
        )}

        {/* Edit Modal */}
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
