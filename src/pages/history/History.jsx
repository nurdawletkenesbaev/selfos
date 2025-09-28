import { useEffect, useState } from 'react'
import { Calendar, Progress, Spin, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { useAuth } from '../../firebase/AuthContext'
import dayjs from 'dayjs'
import './components/history.css'

const { Title } = Typography

/* --------------  GLASS + GRADIENT HELPERS  -------------- */
const gradList = [
  ['#00ff00', '#00ff00'], // 100 %
  ['#e8fb93', '#57f557'], // 75-99 %
  ['#e7fe4f', '#befe00'], // 50-74 %
  ['#e98343', '#f9f238'], // 25-49 %
  ['#f55f57', '#fed540'], // 1-24 %
  ['#de1313', '#f62d2d'], // 0 %
]
const pickGrad = (p) =>
  gradList[
    p === 100 ? 0 : p >= 75 ? 1 : p >= 50 ? 2 : p >= 25 ? 3 : p >= 1 ? 4 : 5
  ]

function History() {
  const { currentUser } = useAuth()
  const userId = currentUser?.uid
  const navigate = useNavigate()
  const [data, setData] = useState({})

  /* ----------  FETCH DATA  ---------- */
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const temp = {}
      const chSnap = await getDocs(
        collection(db, 'users', userId, 'challenges')
      )
      for (const chDoc of chSnap.docs) {
        const tRef = collection(
          db,
          'users',
          userId,
          'challenges',
          chDoc.id,
          'tasks'
        )
        const tSnap = await getDocs(tRef)
        tSnap.forEach((t) => {
          const d = dayjs(t.data().date.toDate()).format('YYYY-MM-DD')
          if (!temp[d]) temp[d] = { completed: 0, total: 0 }
          temp[d].total += 1
          if (t.data().completed) temp[d].completed += 1
        })
      }
      setData(temp)
    })()
  }, [userId])

  /* ----------  CALENDAR CELL  ---------- */
  const dateCellRender = (value) => {
    const key = value.format('YYYY-MM-DD')
    const info = data[key]
    if (!info || info.total === 0) return null

    const percent = Math.round((info.completed / info.total) * 100)
    const [g1, g2] = pickGrad(percent)

    return (
      <div
        className='calendar-cell'
        style={{ background: `linear-gradient(135deg,${g1},${g2})` }}
      >
        <Progress
          percent={percent}
          size='small'
          showInfo={false}
          strokeColor='#fff'
          trailColor='rgba(255,255,255,.2)'
        />
        <span className='percent-text'>{percent}%</span>
      </div>
    )
  }

  /* ----------  NAVIGATE ---------- */
  const onSelect = (date) =>
    navigate(`/day-detail/${date.format('YYYY-MM-DD')}`)

  return (
    <div className='history-page'>
      <Title
        level={2}
        style={{
          textAlign: 'center',
          marginBottom: '1rem',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        }}
      >
        Tarix (History)
      </Title>

      <div className='calendar-wrapper'>
        <Calendar
          cellRender={dateCellRender}
          onSelect={onSelect}
          validRange={[dayjs().subtract(12, 'month'), dayjs()]}
          className='glass-calendar'
        />
      </div>
    </div>
  )
}

export default History
