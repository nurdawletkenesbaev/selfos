import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Spin,
  Empty,
  Space,
  Tag,
  Typography,
  Grid,
  Checkbox,
  Popconfirm,
  Tooltip,
  message,
} from 'antd'
import {
  SoundOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import EditWordModal from './EditWordModal'

const { Title } = Typography
const { useBreakpoint } = Grid

const TodaysWords = ({ userId }) => {
  const nav = useNavigate()
  const screens = useBreakpoint()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

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
      where('nextReviewDate', '<=', Timestamp.fromDate(new Date()))
    )
    const snap = await getDocs(q)
    const wordsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    setWords(wordsData)
    setSelectedIds([]) // Reset selection on refresh
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

  // Bulk delete functions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(words.map((w) => w.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleBulkDelete = async () => {
    const batch = writeBatch(db)
    selectedIds.forEach((id) => {
      const ref = doc(db, 'users', userId, 'words', id)
      batch.delete(ref)
    })
    await batch.commit()
    message.success(`${selectedIds.length} ta so'z o'chirildi`)
    setSelectedIds([])
    fetch()
  }

  const allSelected = words.length > 0 && selectedIds.length === words.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < words.length

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
    <div style={{ padding: screens.xs ? 8 : 16 }}>
      {/* Bulk actions header */}
      {words.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            padding: '8px 12px',
            background: '#f6ffed',
            borderRadius: 8,
            border: '1px solid #b7eb8f',
          }}
        >
          <Checkbox
            indeterminate={someSelected}
            checked={allSelected}
            onChange={handleSelectAll}
          >
            <strong>Barchasini tanlash</strong>
          </Checkbox>
          
          {selectedIds.length > 0 && (
            <Popconfirm
              title={`${selectedIds.length} ta so'zni o'chirasizmi?`}
              onConfirm={handleBulkDelete}
              okText='Ha'
              cancelText='Yo‘q'
            >
              <Button danger size='small' icon={<DeleteOutlined />}>
                Tanlanganlarni o'chirish ({selectedIds.length})
              </Button>
            </Popconfirm>
          )}
        </div>
      )}

      <Space direction='vertical' style={{ width: '100%' }}>
        {words.map((w) => (
          <Card
            key={w.id}
            size='small'
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderColor: selectedIds.includes(w.id) ? '#1890ff' : undefined,
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
                {/* Checkbox + So'z + audio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Checkbox
                    checked={selectedIds.includes(w.id)}
                    onChange={(e) => handleSelectOne(w.id, e.target.checked)}
                  />
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
                <div style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 32 }}>
                  {w.pronunciation}
                </div>

                {/* Speech part + Day */}
                <div style={{ marginTop: 4, marginLeft: 32 }}>
                  <Tag color='blue'>{w.partOfSpeech}</Tag>
                  <Tag color='default'>Day {w.currentDay || 0}</Tag>
                </div>

                {/* Definition */}
                <div style={{ marginTop: 8, marginLeft: 32 }}>
                  <strong>Definition:</strong> {w.definition}
                </div>
                <div style={{ marginTop: 4, marginLeft: 32 }}>
                  <strong>Tarjima:</strong> {w.definitionUz}
                </div>

                {/* Example */}
                <div style={{ marginTop: 8, marginLeft: 32 }}>
                  <strong>Example:</strong> {w.example}
                </div>

                {/* Chunks */}
                {w.chunks?.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 32 }}>
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
        Flashcard (Bugun)
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

export default TodaysWords