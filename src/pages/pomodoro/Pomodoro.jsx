import React, { useEffect, useState } from 'react'
import {
  Button,
  Select,
  Space,
  InputNumber,
  Typography,
  message,
  Modal,
  Form,
  Input,
} from 'antd'
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

const DEFAULT = { work: 25, short: 5, long: 15, longAfter: 4 }

export default function Pomodoro() {
  const user = auth.currentUser
  const uid = user?.uid

  /* ----------------------- state ----------------------- */
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [minutes, setMinutes] = useState(DEFAULT.work)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [breakLen, setBreakLen] = useState(DEFAULT.short)

  /* Ant modal & form */
  const [openModal, setOpenModal] = useState(false)
  const [form] = Form.useForm()

  /* ----------------------- realtime tasks ----------------------- */
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'pomodorTasks'),
      (snap) => {
        const arr = []
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
        setTasks(arr)
      }
    )
    return unsub
  }, [uid])

  /* ----------------------- timer engine ----------------------- */
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s === 0) {
          setMinutes((m) => {
            if (m === 0) {
              setRunning(false)
              playDing()
              /* avtomatik almashish */
              if (mode === 'work') {
                message.success('Pomodoro yakunlandi! Tanaffus vaqti.')
                setMode('break')
                setMinutes(breakLen)
              } else {
                message.success('Tanaffus yakunlandi! Yangi pomodoro.')
                setMode('work')
                setMinutes(DEFAULT.work)
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

  /* ----------------------- actions ----------------------- */
  const handleStart = () => setRunning(true)
  const handlePause = () => setRunning(false)
  const handleReset = () => {
    setRunning(false)
    setMode('work')
    setMinutes(DEFAULT.work)
    setSeconds(0)
  }

  const playDing = () => {
    try {
      new Audio('/ding.mp3').play()
    } catch {
      console.log('.')
    }
  }

  /* Yangi task qo‘shish – Ant Modal + Form */
  const addNewTask = () => {
    setOpenModal(true)
  }
  const handleAddOk = async () => {
    try {
      const values = await form.validateFields()
      if (!uid) return
      await addDoc(collection(db, 'users', uid, 'pomodorTasks'), {
        taskName: values.taskName.trim(),
        counter: 0,
      })
      message.success('Task qo‘shildi!')
      form.resetFields()
      setOpenModal(false)
    } catch (e) {
      console.log(e)
      message.error('Xatolik yuz berdi')
    }
  }
  const handleAddCancel = () => {
    form.resetFields()
    setOpenModal(false)
  }

  /* skip & finish – statistikaga yozadi + counter ++ */
  const handleSkip = async () => {
    setRunning(false)
    if (mode === 'work' && selected?.id) {
      try {
        await addDoc(collection(db, 'users', uid, 'pomodoros'), {
          taskId: selected.id,
          startTime: serverTimestamp(),
          endTime: serverTimestamp(),
          plannedDuration: minutes,
          actualFocusMinutes: 0,
          status: 'skipped',
        })
        await updateDoc(doc(db, 'users', uid, 'pomodorTasks', selected.id), {
          counter: increment(1),
        })
        message.info('Pomodoro skipped – statistikaga yozildi')
      } catch (e) {
        console.log(e)
        message.error('Skip yozishda xatolik')
      }
    }
    if (mode === 'work') {
      setMode('break')
      setMinutes(breakLen)
    } else {
      setMode('work')
      setMinutes(DEFAULT.work)
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
      await updateDoc(doc(db, 'users', uid, 'pomodorTasks', selected.id), {
        counter: increment(1),
      })
    }
    message.success('Pomodoro yakunlandi va saqlandi!')
  }

  /* ----------------------- UI ----------------------- */
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
      <Title level={2}>{mode === 'work' ? '🍅 Pomodoro' : '☕ Tanaffus'}</Title>

      {/* Task tanlash (faqat work) */}
      {mode === 'work' && (
        <Select
          style={{ width: '100%', marginBottom: 24 }}
          placeholder='Vazifani tanlang'
          value={selected?.id}
          onChange={(id) => setSelected(tasks.find((t) => t.id === id))}
          dropdownRender={(menu) => (
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

      {/* Vaqtni sozlash (to‘xtagan holatda) */}
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

      {/* Tugaganida saqlash */}
      {seconds === 0 && !running && mode === 'work' && (
        <div style={{ marginTop: 16 }}>
          <Button type='dashed' onClick={handleFinish}>
            Yakunlandi (saqlash)
          </Button>
        </div>
      )}

      {/* Ant Modal – yangi task qo‘shish */}
      <Modal
        title='Yangi task qo‘shish'
        open={openModal}
        onOk={handleAddOk}
        onCancel={handleAddCancel}
        okText='Saqlash'
        cancelText='Bekor qilish'
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='taskName'
            label='Task nomi'
            rules={[{ required: true, message: 'Iltimos nom kiriting' }]}
          >
            <Input placeholder='Masalan: IELTS writing' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
