import { useEffect, useState } from 'react'
import { Calendar, Progress, Spin, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query } from 'firebase/firestore'
import dayjs from 'dayjs'
import { db } from '../../firebase/firebase'
import { useAuth } from '../../firebase/AuthContext'
import './components/history.css' // yangi stillar shu faylda

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
        const tasksRef = collection(db, 'users', userId, 'challenges', chId, 'tasks')
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

    // Rang klassini tanlab olamiz
    const cellBg =
      percent === 100
        ? 'bg-gradient-to-br from-emerald-500 to-green-400'
        : percent >= 50
        ? 'bg-gradient-to-br from-amber-500 to-orange-400'
        : 'bg-gradient-to-br from-rose-500 to-red-500'

    return (
      <div className={`calendar-cell ${cellBg}`}>
        {/* Neon Progress */}
        <Progress
          percent={percent}
          size='small'
          showInfo={false}
          strokeColor='#ffffff'
          trailColor='rgba(255,255,255,0.2)'
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
    <div className='min-h-screen history-page px-6 py-8'>
      <Title level={2} className='history-title'>
        Tarix (History)
      </Title>

      <div className='max-w-4xl mx-auto calendar-wrapper'>
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={onSelect}
          validRange={[dayjs().subtract(12, 'month'), dayjs()]}
          className='glass-calendar'
        />
      </div>
    </div>
  )
}

export default History