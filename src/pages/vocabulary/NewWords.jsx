import React, { useState, useEffect } from 'react'
import { Card, Button, Spin, Empty, Space, Tag, Typography, Grid } from 'antd'
import { SoundOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import EditWordModal from './EditWordModal'
import { Popconfirm, Tooltip, message } from 'antd'

const { Title } = Typography
const { useBreakpoint } = Grid

const NewWords = ({ userId }) => {
  const nav = useNavigate()
  const screens = useBreakpoint()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)

  // Audio
  const playAudio = (text) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    speechSynthesis.speak(utter)
  }

  const fetch = async () => {
    setLoading(true)
    const q = query(
      collection(db, 'users', userId, 'words'),
      where('currentDay', '==', 0)
    )
    const snap = await getDocs(q)
    setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [userId])

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'users', userId, 'words', id))
    message.success('O‘chirildi')
    fetch()
  }

  if (loading)
    return (
      <Spin style={{ display: 'block', textAlign: 'center', marginTop: 32 }} />
    )
  if (!words.length)
    return <Empty style={{ marginTop: 64 }} description='Yangi so‘z yo‘q' />
  console.log(new Date().toISOString())
  return (
    <div style={{ padding: screens.xs ? 8 : 16 }}>
      <Space direction='vertical' style={{ width: '100%' }}>
        {words.map((w) => (
          <Card
            key={w.id}
            size='small'
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            actions={[
              <Tooltip title='Tahrirlash'>
                <EditOutlined key='edit' onClick={() => setEditId(w.id)} />
              </Tooltip>,
              <Popconfirm
                title='O‘chirasizmi?'
                onConfirm={() => handleDelete(w.id)}
                okText='Ha'
                cancelText='Yo‘q'
              >
                <Tooltip title='O‘chirish'>
                  <DeleteOutlined key='delete' style={{ color: '#ff4d4f' }} />
                </Tooltip>
              </Popconfirm>,
            ]}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                {/* So‘z + audio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {w.word}
                  </Title>
                  <Button
                    type='text'
                    icon={<SoundOutlined />}
                    onClick={() => playAudio(w.word)}
                  />
                </div>

                {/* Talaffuz */}
                <div style={{ color: '#8c8c8c', fontSize: 14 }}>
                  {w.pronunciation}
                </div>

                {/* Speech part + Day */}
                <div style={{ marginTop: 4 }}>
                  <Tag color='blue'>{w.partOfSpeech}</Tag>
                  <Tag color='default'>Day {w.currentDay || 0}</Tag>
                </div>

                {/* Definition */}
                <div style={{ marginTop: 8 }}>
                  <strong>Definition:</strong> {w.definition}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Tarjima:</strong> {w.definitionUz}
                </div>

                {/* Example */}
                <div style={{ marginTop: 8 }}>
                  <strong>Example:</strong> {w.example}
                </div>

                {/* Chunks */}
                {w.chunks?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Chunks:</strong>{' '}
                    {w.chunks.map((c) => (
                      <Tag key={c} style={{ marginRight: 4 }}>
                        {c}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </Space>

      <Button
        type='primary'
        size='large'
        style={{ marginTop: 24, width: '100%' }}
        onClick={() => nav('/vocabulary/review', { state: { words } })}
      >
        Tayyorman (Flashcard)
      </Button>

      {editId && (
        <EditWordModal
          userId={userId}
          wordId={editId}
          onClose={() => {
            setEditId(null)
            fetch()
          }}
        />
      )}
    </div>
  )
}

export default NewWords
