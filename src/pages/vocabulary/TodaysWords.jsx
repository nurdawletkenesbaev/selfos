import React, { useState, useEffect } from 'react'
import { Card, Button, Spin, Empty, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const TodaysWords = ({ userId }) => {
  const nav = useNavigate()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    const q = query(
      collection(db, 'users', userId, 'words'),
      where('nextReviewDate', '<=', Timestamp.fromDate(new Date()))
    )
    const snap = await getDocs(q)
    setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [userId])

  if (loading)
    return (
      <Spin style={{ display: 'block', textAlign: 'center', marginTop: 32 }} />
    )
  if (!words.length)
    return (
      <Empty
        style={{ marginTop: 64 }}
        description='Bugun takrorlash so‘zi yo‘q'
      />
    )

  return (
    <div style={{ padding: '0 8px' }}>
      <Space direction='vertical' style={{ width: '100%' }}>
        {words.map((w) => (
          <Card key={w.id} size='small'>
            <strong>{w.word}</strong>
            <div>{w.definitionUz}</div>
          </Card>
        ))}
      </Space>

      <Button
        type='primary'
        size='large'
        style={{ marginTop: 24, width: '100%' }}
        onClick={() => nav('/vocabulary/review', { state: { words } })}
      >
        Flashcard (Bugun)
      </Button>
    </div>
  )
}

export default TodaysWords
