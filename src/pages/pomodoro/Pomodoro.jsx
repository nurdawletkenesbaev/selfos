import React, { useEffect, useState, useRef } from 'react'
import { Button, Select, Space, InputNumber, Typography, message } from 'antd'
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db, auth } from '../../firebase/firebase'

const { Title, Text } = Typography

export default function Pomodoro() {
  const user = auth.currentUser
  const uid = user?.uid
  const audioRef = useRef(null) // ovoz uchun

  // --- state ---
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [minutes, setMinutes] = useState(30) // default 30
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [breakLen, setBreakLen] = useState(5) // break daqiqa

  // --- realtime tasks ---
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'pomodoro'),
      (snap) => {
        const arr = []
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
        arr.sort((a, b) => b.usageNumber - a.usageNumber)
        setTasks(arr)
      }
    )
    return unsub
  }, [uid])

  // --- timer engine ---
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s === 0) {
          setMinutes((m) => {
            if (m === 0) {
              setRunning(false)
              playDing()
              if (mode === 'work') {
                message.success('Pomodoro yakunlandi! Tanaffus vaqti.')
                setMode('break')
                setMinutes(breakLen)
                setSeconds(0)
              } else {
                message.success('Tanaffus yakunlandi! Yangi pomodoro.')
                setMode('work')
                setMinutes(30)
                setSeconds(0)
              }
              return m
            }
            return m - 1
          })
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode, breakLen])

  // --- actions ---
  const handleStart = () => setRunning(true)
  const handlePause = () => setRunning(false)
  const handleReset = () => {
    setRunning(false)
    setMode('work')
    setMinutes(30)
    setSeconds(0)
  }
  const handleSkip = () => {
    setRunning(false)
    if (mode === 'work') {
      setMode('break')
      setMinutes(breakLen)
    } else {
      setMode('work')
      setMinutes(30)
    }
    setSeconds(0)
  }

  const handleFinish = async () => {
    if (!uid || mode !== 'work') return
    const data = {
      taskId: selected?.id || null,
      startTime: serverTimestamp(),
      endTime: serverTimestamp(),
      plannedDuration: minutes,
      actualFocusMinutes: minutes,
      status: 'completed',
    }
    await addDoc(collection(db, 'users', uid, 'pomodoros'), data)
    if (selected?.id) {
      await updateDoc(doc(db, 'users', uid, 'pomodoro', selected.id), {
        usageNumber: increment(1),
      })
    }
  }

  // ovoz
  const playDing = () => {
    try {
      const audio = new Audio('/ding.mp3') // public papkada bo‘lsin
      audio.play()
    } catch {}
  }

  // --- add new task ---
  const addNewTask = async () => {
    const name = prompt('Yangi task nomi:')
    if (!name || !uid) return
    await addDoc(collection(db, 'users', uid, 'pomodoro'), {
      taskName: name.trim(),
      usageNumber: 0,
    })
    message.success('Task qo‘shildi!')
  }

  // --- UI ---
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
      <audio ref={audioRef} src='/ding.mp3' preload='auto' />
      <Title level={2}>{mode === 'work' ? '🍅 Pomodoro' : '☕ Tanaffus'}</Title>

      {/* Task tanlash (faqat work rejimida) */}
      {mode === 'work' && (
        <Select
          style={{ width: '100%', marginBottom: 24 }}
          placeholder='Vazifani tanlang'
          value={selected?.id}
          onChange={(id) => setSelected(tasks.find((t) => t.id === id))}
          popupRender={(menu) => (
            <>
              {menu}
              <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                <Button
                  type='text'
                  icon={<PlusOutlined />}
                  onClick={addNewTask}
                >
                  Yangi task qo‘shish
                </Button>
              </div>
            </>
          )}
        >
          {tasks.map((t) => (
            <Select.Option key={t.id} value={t.id}>
              {t.taskName}
            </Select.Option>
          ))}
        </Select>
      )}

      {/* Vaqtni o‘zgartirish (faqat to‘xtagan holatda) */}
      {!running && seconds === 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text>{mode === 'work' ? 'Ish vaqti:' : 'Tanaffus:'}</Text>
          <InputNumber
            min={1}
            max={120}
            value={mode === 'work' ? minutes : breakLen}
            onChange={(v) => {
              if (mode === 'work') setMinutes(v || 30)
              else setBreakLen(v || 5)
            }}
            style={{ marginLeft: 8 }}
          />
          <span style={{ marginLeft: 4 }}>min</span>
        </div>
      )}

      {/* Timer */}
      <Title style={{ fontSize: 80, margin: '24px 0' }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Title>

      {/* Controls */}
      <Space size='large'>
        {!running ? (
          <Button
            type='primary'
            size='large'
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
          >
            Boshla
          </Button>
        ) : (
          <Button
            size='large'
            icon={<PauseCircleOutlined />}
            onClick={handlePause}
          >
            Pauza
          </Button>
        )}
        <Button size='large' icon={<RedoOutlined />} onClick={handleReset}>
          Qayta
        </Button>
        <Button size='large' icon={<ArrowRightOutlined />} onClick={handleSkip}>
          O‘tkazib yuborish
        </Button>
      </Space>

      {/* Tugaganida saqlash (avtomat) */}
      {seconds === 0 && !running && mode === 'work' && (
        <div style={{ marginTop: 16 }}>
          <Button type='dashed' onClick={handleFinish}>
            Yakunlandi (saqlash)
          </Button>
        </div>
      )}
    </div>
  )
}
