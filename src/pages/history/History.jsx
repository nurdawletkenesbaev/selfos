import { useEffect, useState } from 'react'
import { Calendar, Progress, Spin, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

import { collection, getDocs, query, where } from 'firebase/firestore'
import dayjs from 'dayjs'
import './components/history.css'
import { db } from '../../firebase/firebase'
import { useAuth } from '../../firebase/AuthContext'

const { Title } = Typography

function History() {
  const { currentUser } = useAuth()
  const userId = currentUser?.uid
  const navigate = useNavigate()

  const [data, setData] = useState({}) // { "YYYY-MM-DD": { completed: 3, total: 5 } }

  useEffect(() => {
    if (!userId) return
    const fetchAllTasks = async () => {
      const challengesRef = collection(db, 'users', userId, 'challenges')
      const challengesSnap = await getDocs(challengesRef)

      const temp = {}

      for (const chDoc of challengesSnap.docs) {
        const chId = chDoc.id
        const tasksRef = collection(
          db,
          'users',
          userId,
          'challenges',
          chId,
          'tasks'
        )
        const snap = await getDocs(tasksRef)
        snap.forEach((t) => {
          const d = dayjs(t.data().date.toDate()).format('YYYY-MM-DD')
          if (!temp[d]) temp[d] = { completed: 0, total: 0 }
          temp[d].total += 1
          if (t.data().completed) temp[d].completed += 1
        })
      }
      setData(temp)
    }
    fetchAllTasks()
  }, [userId])

  const dateCellRender = (value) => {
    const key = value.format('YYYY-MM-DD')
    const info = data[key]
    if (!info || info.total === 0) return null
    const percent = Math.round((info.completed / info.total) * 100)
    return (
      <div className='calendar-cell'>
        <Progress
          percent={percent}
          size='small'
          showInfo={false}
          strokeColor='#52c41a'
        />
        <span className='percent-text'>{percent}%</span>
      </div>
    )
  }

  const onSelect = (date) => {
    const key = date.format('YYYY-MM-DD')
    navigate(`/day-detail/${key}`)
  }

  return (
    <div className='min-h-screen bg-gray-50 px-6 py-8'>
      <Title level={2} className='text-center mb-6'>
        Tarix (History)
      </Title>
      <div className='max-w-4xl mx-auto'>
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={onSelect}
          validRange={[dayjs().subtract(12, 'month'), dayjs()]}
        />
      </div>
    </div>
  )
}

export default History
