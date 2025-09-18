import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Button, Spin, message, Modal, Progress } from 'antd'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md'
import { BiEditAlt } from 'react-icons/bi'
import dayjs from 'dayjs'
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
import '../components/historyDetail.css'
import { useAuth } from '../../../firebase/AuthContext'
import { db } from '../../../firebase/firebase'

const { Title, Text } = Typography
const { confirm } = Modal

function DayDetail() {
  const { date } = useParams()
  const { currentUser } = useAuth()
  const userId = currentUser?.uid
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTaskId, setLoadingTaskId] = useState(null)

  const selectedDay = dayjs(date)

  const fetchTasks = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const challengesRef = collection(db, 'users', userId, 'challenges')
      const challengesSnap = await getDocs(challengesRef)

      const allTasks = []

      for (const chDoc of challengesSnap.docs) {
        const chId = chDoc.id
        const chTitle = chDoc.data().title || 'No name'
        const tasksRef = collection(
          db,
          'users',
          userId,
          'challenges',
          chId,
          'tasks'
        )
        const q = query(
          tasksRef,
          where('date', '>=', selectedDay.startOf('day').toDate()),
          where('date', '<=', selectedDay.endOf('day').toDate()),
          orderBy('date', 'asc')
        )
        const snap = await getDocs(q)
        snap.forEach((t) => {
          allTasks.push({
            id: t.id,
            challengeId: chId,
            challengeTitle: chTitle,
            ...t.data(),
          })
        })
      }
      setTasks(allTasks)
    } catch (err) {
      console.error(err)
      message.error('Tasklarni yuklashda xatolik!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [userId, date])

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
      // 2. Xato bo‘lsa rollback
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !newStatus } : t
        )
      )
      message.error('Yangilashda xatolik!')
    } finally {
      setLoadingTaskId(null)
    }
  }

  const handleDelete = (task) => {
    confirm({
      title: 'O‘chirmoqchimisiz?',
      content: `"${task.taskName}" o‘chiriladi!`,
      okType: 'danger',
      onOk: async () => {
        await deleteDoc(
          doc(
            db,
            `users/${userId}/challenges/${task.challengeId}/tasks/${task.id}`
          )
        )
        fetchTasks()
        message.success('O‘chirildi!')
      },
    })
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount ? (completedCount / totalCount) * 100 : 0

  return (
    <div className='min-h-screen bg-gray-50 custom-scrollbar'>
      <div className='max-w-4xl mx-auto px-6 py-8'>
        <Title level={3} className='text-center mb-2'>
          {selectedDay.format('DD MMMM YYYY')}
        </Title>

        {!loading && totalCount > 0 && (
          <div className='flex justify-center mb-6'>
            <Progress
              type='dashboard'
              steps={8}
              percent={Math.round(progress)}
              trailColor='rgba(0,0,0,0.06)'
              strokeWidth={30}
            />
          </div>
        )}

        {loading ? (
          <div className='text-center py-12'>
            <Spin size='large' />
          </div>
        ) : tasks.length ? (
          <div className='space-y-4'>
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`task-card ${t.completed ? 'completed' : ''}`}
              >
                <div className='flex items-center space-x-4'>
                  <button
                    onClick={() => toggleCompleted(t)}
                    disabled={loadingTaskId === t.id}
                    className='completion-button'
                  >
                    {loadingTaskId === t.id ? (
                      <Spin size='small' />
                    ) : t.completed ? (
                      <MdCheckCircle size={18} />
                    ) : (
                      <MdRadioButtonUnchecked size={18} />
                    )}
                  </button>
                  <div className='flex-1 min-w-0'>
                    <Text className='task-name'>{t.taskName}</Text>
                    <Text className='text-xs text-gray-500'>
                      {t.challengeTitle}
                    </Text>
                  </div>
                  <div className='action-buttons'>
                    <Button
                      type='text'
                      size='small'
                      icon={<BiEditAlt size={18} />}
                      onClick={() =>
                        navigate(`/edit-task/${t.challengeId}/${t.id}`)
                      }
                    />
                    <Button
                      type='text'
                      danger
                      size='small'
                      icon={<RiDeleteBin5Line size={18} />}
                      onClick={() => handleDelete(t)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <Text className='text-gray-500'>Ushbu kunda vazifalar yo‘q</Text>
          </div>
        )}
      </div>
    </div>
  )
}

export default DayDetail
