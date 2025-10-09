import React, { useState, useEffect } from 'react'
import { Card, Button, Spin, Empty, Space, Typography, Grid } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const { Title } = Typography
const { useBreakpoint } = Grid

const Review = ({ userId }) => {
  const location = useLocation()
  const nav = useNavigate()
  const screens = useBreakpoint()

  const [words, setWords] = useState(location.state?.words || [])
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    if (!words.length) nav('/vocabulary')
  }, [words, nav])

  if (!words.length) return <Spin style={{ display: 'block', marginTop: 64 }} />

  const w = words[index]

  // Interval massivi (0-index)
  const INTERVALS = [1, 2, 3, 4, 7, 14, 30]

  const handleAnswer = async (correct) => {
    const newDay = correct ? (w.currentDay || 0) + 1 : 1
    const nextDays = INTERVALS[Math.min(newDay, INTERVALS.length - 1)]
    const nextDate = new Date()
nextDate.setDate(nextDate.getDate() + 1) // ← ertaga
nextDate.setHours(0, 0, 0, 0)            // ← ertaga 00:00DF

    await updateDoc(doc(db, 'users', userId, 'words', w.id), {
      currentDay: newDay,
      nextReviewDate: Timestamp.fromDate(nextDate),
    })

    await addDoc(collection(db, 'users', userId, 'words', w.id, 'history'), {
      reviewedAt: serverTimestamp(),
      correct,
      interval: nextDays,
    })

    if (index < words.length - 1) {
      setIndex((i) => i + 1)
      setShowBack(false)
    } else {
      nav('/vocabulary')
    }
  }
  // console.log(new Date().toISOString())
  return (
    <div
      style={{ padding: screens.xs ? 8 : 24, maxWidth: 480, margin: '0 auto' }}
    >
      <Button
        type='text'
        icon={<ArrowLeftOutlined />}
        onClick={() => nav('/vocabulary')}
        style={{ marginBottom: 16 }}
      >
        Ortga
      </Button>

      <Title level={4} style={{ textAlign: 'center' }}>
        {index + 1} / {words.length}
      </Title>

      <Card
        hoverable
        style={{
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: screens.xs ? 16 : 20,
        }}
        onClick={() => setShowBack(!showBack)}
      >
        {!showBack ? (
          <>
            <div>
              <strong>{w.word}</strong>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>
              {w.pronunciation}
            </div>
            <div style={{ marginTop: 8 }}>{w.partOfSpeech}</div>
          </>
        ) : (
          <>
            <div>{w.definitionUz}</div>
            <div style={{ marginTop: 12 }}>{w.example}</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <strong>Chunks:</strong> {w.chunks?.join(', ')}
            </div>
          </>
        )}
        <div style={{ marginTop: 16, fontSize: 12, color: '#bfbfbf' }}>
          {!showBack ? 'Kartani bosing →' : '← Oldingi taraf'}
        </div>
      </Card>

      <Space direction='vertical' style={{ width: '100%', marginTop: 24 }}>
        <Button block size='large' danger onClick={() => handleAnswer(false)}>
          Bilmadim (Again)
        </Button>
        <Button
          block
          size='large'
          type='primary'
          onClick={() => handleAnswer(true)}
        >
          Bilaman (Good)
        </Button>
      </Space>
    </div>
  )
}

export default Review
