import React, { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Select,
  Spin,
  Empty,
  Space,
  Button,
  Typography,
  Grid,
  Tag,
} from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const { Search } = Input
const { Option } = Select
const { Title } = Typography
const { useBreakpoint } = Grid

const AllWords = ({ userId }) => {
  const screens = useBreakpoint()
  const [words, setWords] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDay, setFilterDay] = useState(null)

  // Audio
  const playAudio = (text) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    speechSynthesis.speak(utter)
  }

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'words'))
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setWords(list)
      setFiltered(list)
      setLoading(false)
    }
    fetch()
  }, [userId])

  useEffect(() => {
    let res = words
    if (search)
      res = res.filter(
        (w) =>
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          w.definitionUz.toLowerCase().includes(search.toLowerCase())
      )
    // Agar interval tanlanmagan bo‘lsa – filter o‘tmaydi
    if (filterDay !== null)
      res = res.filter((w) => (w.currentDay || 0) === filterDay)
    setFiltered(res)
  }, [search, filterDay, words])

  if (loading)
    return (
      <Spin style={{ display: 'block', textAlign: 'center', marginTop: 32 }} />
    )

  return (
    <div style={{ padding: screens.xs ? 8 : 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Search
          placeholder='So‘z yoki tarjima bo‘yicha qidirish'
          allowClear
          onSearch={setSearch}
          style={{ flex: 1 }}
        />
        <Select
          placeholder='Interval'
          allowClear
          style={{ width: 120 }}
          onChange={(val) => setFilterDay(val ?? null)} // ← undefined bo‘lsa null qilish
        >
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Option key={d} value={d}>
              Day {d}
            </Option>
          ))}
        </Select>
      </div>

      {/* Bo‘sh filter xabari */}
      {filtered.length === 0 && (
        <Empty
          style={{ marginTop: 64 }}
          description={
            filterDay !== null
              ? `Day ${filterDay} bo‘yicha so‘z yo‘q`
              : search
              ? 'Qidiruv natijasi topilmadi'
              : 'Hozircha so‘z qo‘shilmagan'
          }
        />
      )}

      {/* Chiroyli cardlar */}
      <Space direction='vertical' style={{ width: '100%' }}>
        {filtered.map((w) => (
          <Card
            key={w.id}
            size='small'
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
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

                {/* Speech part */}
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
    </div>
  )
}

export default AllWords
