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
import { Typography, List, Button, message, Modal, Spin } from 'antd'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle } from 'react-icons/md'
import dayjs from 'dayjs'
import { useAuth } from '../../firebase/AuthContext'
// import { useAuth } from "../../context/AuthContext" // ✅ AuthContext dan olish

const { Title, Text } = Typography
const { confirm } = Modal

function TodaysTasks() {
  const { currentUser } = useAuth() // 🔑 userni olish
  const userId = currentUser?.uid

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

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
    }
  }

  // 🔹 UI da tasklarni challenge nomi bo‘yicha guruhlash
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
                      danger
                      onClick={() => handleDelete(task)}
                      icon={<RiDeleteBin5Line />}
                    />,
                    <Button
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
    </div>
  )
}

export default TodaysTasks
