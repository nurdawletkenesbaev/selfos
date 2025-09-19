import { AiOutlineEdit } from 'react-icons/ai'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { Button, Modal, Form, Input, DatePicker, message } from 'antd'
import { CgMathPlus } from 'react-icons/cg'
import { RiDeleteBin5Line } from 'react-icons/ri'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../firebase/AuthContext'
import dayjs from 'dayjs'
import './components/challenges.css'

// const { Text } = Typography0
const { confirm } = Modal

/* gradientlar */
const gradientMap = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
]

/* 1 ta sortable kartochka */
function SortableChallenge({ ch, percent, g1, g2, onClick, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ch.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`challenge-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div className='glow' />
      <div
        className='cover'
        style={{ background: `linear-gradient(135deg,${g1},${g2})` }}
      >
        <span className='cover-title'>{ch.title}</span>
      </div>

      <div className='stats-row'>
        <span className='stat-val'>🔥 {ch.streak || 0} d</span>
        <span className='stat-val'>⚡ {percent}%</span>
      </div>

      <svg className='progress-ring' viewBox='0 0 48 48'>
        <circle
          cx='24'
          cy='24'
          r='20'
          stroke='rgba(255,255,255,.15)'
          strokeWidth='4'
          fill='none'
        />
        <circle
          cx='24'
          cy='24'
          r='20'
          stroke='url(#grad)'
          strokeWidth='4'
          fill='none'
          strokeDasharray={2 * Math.PI * 20}
          strokeDashoffset={2 * Math.PI * 20 * (1 - percent / 100)}
          strokeLinecap='round'
          className='bar'
        />
        <defs>
          <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#34d399' />
            <stop offset='100%' stopColor='#10b981' />
          </linearGradient>
        </defs>
      </svg>

      <div className='actions'>
        <AiOutlineEdit
          onClick={(e) => {
            e.stopPropagation()
            onEdit(ch)
          }}
        />
        <RiDeleteBin5Line
          onClick={(e) => {
            e.stopPropagation()
            onDelete(ch)
          }}
        />
      </div>
    </div>
  )
}

function Challenges({ userId }) {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [open, setOpen] = useState(false)
  const [editChallenge, setEditChallenge] = useState(null)
  const [form] = Form.useForm()

  /* load */
  useEffect(() => {
    if (!userId) return
    const q = query(
      collection(db, `users/${userId}/challenges`),
      orderBy('order', 'asc')
    )
    getDocs(q).then((snap) =>
      setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [userId])

  /* create / edit */
  const handleOpenCreate = () => {
    setEditChallenge(null)
    form.resetFields()
    setOpen(true)
  }
  const handleOpenEdit = (ch) => {
    setEditChallenge(ch)
    form.setFieldsValue({
      title: ch.title,
      startDate: ch.startDate ? dayjs(ch.startDate.toDate()) : null,
      endDate: ch.endDate ? dayjs(ch.endDate.toDate()) : null,
    })
    setOpen(true)
  }
  const handleOk = async () => {
    try {
      const v = await form.validateFields()
      if (editChallenge) {
        await updateDoc(
          doc(db, 'users', userId, 'challenges', editChallenge.id),
          {
            title: v.title,
            startDate: v.startDate ? v.startDate.toDate() : null,
            endDate: v.endDate ? v.endDate.toDate() : null,
          }
        )
        message.success('Yangilandi!')
      } else {
        await addDoc(collection(db, 'users', userId, 'challenges'), {
          title: v.title,
          startDate: v.startDate ? v.startDate.toDate() : null,
          endDate: v.endDate ? v.endDate.toDate() : null,
          createdAt: new Date(),
          order: challenges.length,
        })
        message.success('Yaratildi!')
      }
      setOpen(false)
      form.resetFields()
      // refresh
      const snap = await getDocs(
        query(
          collection(db, `users/${userId}/challenges`),
          orderBy('order', 'asc')
        )
      )
      setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
      message.error('Xatolik!')
    }
  }

  /* delete */
  const handleDelete = (ch) => {
    confirm({
      title: 'O‘chirmoqchimisiz?',
      content: `"${ch.title}" va barcha tasklari o‘chadi!`,
      okType: 'danger',
      onOk: async () => {
        const tasksSnap = await getDocs(
          collection(db, 'users', userId, 'challenges', ch.id, 'tasks')
        )
        await Promise.all(tasksSnap.docs.map((t) => deleteDoc(t.ref)))
        await deleteDoc(doc(db, 'users', userId, 'challenges', ch.id))
        message.success('O‘chirildi!')
        const snap = await getDocs(
          query(
            collection(db, `users/${userId}/challenges`),
            orderBy('order', 'asc')
          )
        )
        setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
    })
  }

  /* drag */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setChallenges((items) => {
        const oldIndex = items.findIndex((ch) => ch.id === active.id)
        const newIndex = items.findIndex((ch) => ch.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      const newOrder = arrayMove(
        challenges,
        challenges.findIndex((ch) => ch.id === active.id),
        challenges.findIndex((ch) => ch.id === over.id)
      )
      await Promise.all(
        newOrder.map((ch, idx) =>
          updateDoc(doc(db, 'users', userId, 'challenges', ch.id), {
            order: idx,
          })
        )
      )
    }
  }

  /* dummy progress */
  const calcPercent = (ch) => ch.dailyProgress || 0

  return (
    <div className='challenges-page'>
      <div className='top-bar'>
        <h1 className='page-title'>My Challenges</h1>
        <Button
          type='primary'
          shape='round'
          size='large'
          onClick={handleOpenCreate}
          icon={<CgMathPlus />}
          className='add-btn'
        >
          Yangi
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={challenges.map((ch) => ch.id)}
          strategy={rectSortingStrategy}
        >
          <div className='cards-grid'>
            {challenges.map((ch, idx) => {
              const [g1, g2] = gradientMap[idx % gradientMap.length]
              const percent = calcPercent(ch)
              return (
                <SortableChallenge
                  key={ch.id}
                  ch={ch}
                  percent={percent}
                  g1={g1}
                  g2={g2}
                  onClick={() => navigate(`/challenge-detail/${ch.id}`)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modal */}
      <Modal
        title={editChallenge ? 'Tahrirlash' : 'Yangi Challenge'}
        open={open}
        onOk={handleOk}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        okText={editChallenge ? 'Saqlash' : 'Yaratish'}
        cancelText='Bekor qilish'
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='title'
            label='Nom'
            rules={[{ required: true, message: 'Nom kiriting!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name='startDate' label='Boshlanish'>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name='endDate' label='Tugash'>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Challenges
