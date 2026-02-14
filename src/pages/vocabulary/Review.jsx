import React, { useState, useEffect } from 'react'
import { Card, Button, Spin, Space, Typography, Grid, Tag } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
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

  // Spaced repetition interval kunlari (0-indexed)
  // Day 0 → 1 kun, Day 1 → 2 kun, ..., Day 8 → 30 kun
  const INTERVALS = [1, 2, 3, 4, 7, 10, 14, 21, 30]

  useEffect(() => {
    if (!words.length) nav('/vocabulary')
  }, [words, nav])

  if (!words.length) return <Spin style={{ display: 'block', marginTop: 64 }} />

  const w = words[index]
  const currentDay = w.currentDay || 0
  const isMastered = currentDay >= INTERVALS.length

  const handleAnswer = async (correct) => {
    let newDay
    let nextDays

    if (!correct) {
      // Bilmadim → Day 0 ga qaytish, ertaga ko'riladi
      newDay = 0
      nextDays = INTERVALS[0]
    } else {
      // Bilaman → keyingi intervalga o'tish
      newDay = currentDay + 1

      // Agar barcha intervaldan o'tsa → ustalgan
      if (newDay >= INTERVALS.length) {
        await updateDoc(doc(db, 'users', userId, 'words', w.id), {
          currentDay: newDay,
          nextReviewDate: null,
          mastered: true,
          masteredAt: serverTimestamp(),
        })

        await addDoc(collection(db, 'users', userId, 'words', w.id, 'history'), {
          reviewedAt: serverTimestamp(),
          correct: true,
          mastered: true,
          previousDay: currentDay,
          newDay: newDay,
        })

        nextCard()
        return
      }

      nextDays = INTERVALS[newDay]
    }

    // Oddiy yangilash
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + nextDays)
    nextDate.setHours(0, 0, 0, 0)

    await updateDoc(doc(db, 'users', userId, 'words', w.id), {
      currentDay: newDay,
      nextReviewDate: Timestamp.fromDate(nextDate),
      mastered: false,
    })

    await addDoc(collection(db, 'users', userId, 'words', w.id, 'history'), {
      reviewedAt: serverTimestamp(),
      correct,
      interval: nextDays,
      previousDay: currentDay,
      newDay: newDay,
    })

    nextCard()
  }

  const nextCard = () => {
    if (index < words.length - 1) {
      setIndex((i) => i + 1)
      setShowBack(false)
    } else {
      nav('/vocabulary')
    }
  }

  // Keyingi intervalni hisoblash
  const getNextInterval = () => {
    if (isMastered) return 'Ustagan'
    const nextDay = currentDay + 1
    if (nextDay >= INTERVALS.length) return 'Ustagan'
    return `${INTERVALS[nextDay]} kun`
  }

  return (
    <div
      style={{ padding: screens.xs ? 8 : 24, maxWidth: 480, margin: '0 auto' }}
    >
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => nav('/vocabulary')}
        style={{ marginBottom: 16 }}
      >
        Ortga
      </Button>

      <Title level={4} style={{ textAlign: 'center' }}>
        {index + 1} / {words.length}
      </Title>

      {/* Status tag */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        {isMastered ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Ustagan (30+ kun)
          </Tag>
        ) : (
          <Tag color="processing">
            Day {currentDay} → {INTERVALS[currentDay]} kun
          </Tag>
        )}
      </div>

      <Card
        hoverable
        style={{
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: screens.xs ? 16 : 20,
          cursor: 'pointer',
          border: isMastered ? '2px solid #52c41a' : undefined,
        }}
        onClick={() => setShowBack(!showBack)}
      >
        {!showBack ? (
          <>
            <div style={{ fontSize: screens.xs ? 24 : 28 }}>
              <strong>{w.word}</strong>
            </div>
            <div style={{ marginTop: 8, fontSize: 16, color: '#8c8c8c' }}>
              {w.pronunciation}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: '#595959',
                fontStyle: 'italic',
              }}
            >
              {w.partOfSpeech}
            </div>
            {isMastered && (
              <div style={{ marginTop: 16 }}>
                <Tag color="success">✅ Ustagan</Tag>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: screens.xs ? 16 : 18, color: '#262626' }}>
              {w.definitionUz}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 14,
                color: '#595959',
                fontStyle: 'italic',
              }}
            >
              "{w.example}"
            </div>
            {w.chunks && w.chunks.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <strong style={{ color: '#8c8c8c' }}>Chunks:</strong>{' '}
                <span style={{ color: '#595959' }}>{w.chunks.join(', ')}</span>
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: 20, fontSize: 12, color: '#bfbfbf' }}>
          {!showBack ? 'Kartani bosing →' : '← Oldingi taraf'}
        </div>
      </Card>

      <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
        <Button
          block
          size="large"
          danger
          onClick={() => handleAnswer(false)}
          style={{ height: 50 }}
          disabled={isMastered}
        >
          ❌ Bilmadim (Again) → 1 kun
        </Button>
        <Button
          block
          size="large"
          type="primary"
          onClick={() => handleAnswer(true)}
          style={{ height: 50 }}
        >
          {isMastered
            ? '✅ Ustagan (Saqlash)'
            : `✅ Bilaman (Good) → ${getNextInterval()}`}
        </Button>
      </Space>
    </div>
  )
}

export default Review