// ChallengeDetail.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  collection, query, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, getDoc, Timestamp,
} from 'firebase/firestore'
import { db } from '../../../firebase/firebase'
import {
  Typography, Button, Modal, Form, Input, DatePicker,
  Select, Checkbox, message, Spin, Progress,
} from 'antd'
import { CgMathPlus } from 'react-icons/cg'
import { BiEditAlt } from 'react-icons/bi'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md'
import { HiOutlineFire } from 'react-icons/hi'
import { BsLightning } from 'react-icons/bs'
import dayjs from 'dayjs'
import './challengeDetailCss.css'

const { Title, Text } = Typography
const { confirm } = Modal
const { Option } = Select

const weekDaysOptions = [
  { label: 'Yakshanba', value: 0 }, { label: 'Dushanba', value: 1 },
  { label: 'Seshanba', value: 2 },  { label: 'Chorshanba', value: 3 },
  { label: 'Payshanba', value: 4 }, { label: 'Juma', value: 5 },
  { label: 'Shanba', value: 6 },
]

export default function ChallengeDetail({ userId }) {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTaskId, setLoadingTaskId] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form] = Form.useForm()
  const [modalLoading, setModalLoading] = useState(false)
  const todayRef = useRef(null)

  /* ---------- DATA ---------- */
  const fetchChallenge = async () => {
    if (!userId || !challengeId) return
    try {
      const snap = await getDoc(doc(db, `users/${userId}/challenges/${challengeId}`))
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() })
      else { message.error('Topilmadi!'); navigate(-1) }
    } catch { message.error('Xatolik!') }
  }
  const fetchTasks = async (withLoading = true) => {
    if (!userId || !challengeId) return
    if (withLoading) setLoading(true)
    try {
      const q = query(collection(db, `users/${userId}/challenges/${challengeId}/tasks`), orderBy('date', 'asc'))
      const snap = await getDocs(q)
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch { message.error('Task yuklanmadi!') }
    if (withLoading) setLoading(false)
  }
  useEffect(() => { fetchChallenge(); fetchTasks() }, [userId, challengeId])
  useEffect(() => {
    if (!loading && todayRef.current)
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading])
  useEffect(() => {
    if (!openModal) return
    if (editTask) {
      form.setFieldsValue({
        taskName: editTask.taskName || '',
        type: editTask.type || 'quicktask',
        reminder: editTask.reminder ? dayjs.unix(editTask.reminder.seconds) : null,
      })
    } else form.resetFields()
  }, [openModal, editTask, form])

  /* ---------- HELPERS ---------- */
  const dailyProgressPercentage = useMemo(() => {
    const todays = tasks.filter(t => {
      if (!t.date) return false
      const d = t.date.seconds ? dayjs.unix(t.date.seconds) : dayjs(t.date)
      return d.isSame(dayjs(), 'day')
    })
    const done = todays.filter(t => t.completed).length
    return todays.length ? Math.round((done / todays.length) * 100) : 0
  }, [tasks])
  const getFormattedDate = d =>
    new Date(d.seconds * 1000).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  const groupedTasks = useMemo(() =>
    tasks.reduce((acc, t) => {
      if (!t.date) return acc
      const str = getFormattedDate(t.date)
      if (!acc[str]) acc[str] = []
      acc[str].push(t)
      return acc
    }, {}), [tasks])
  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  /* ---------- CRUD ---------- */
  const handleOk = async () => {
    try {
      setModalLoading(true)
      const v = await form.validateFields()
      if (editTask) {
        await updateDoc(doc(db, `users/${userId}/challenges/${challengeId}/tasks/${editTask.id}`), {
          taskName: v.taskName, type: v.type,
          reminder: v.reminder ? Timestamp.fromDate(v.reminder.toDate()) : null,
          updatedAt: Timestamp.now(),
        })
        message.success('Yangilandi!')
      } else {
        const start = v.startDay.toDate()
        const end = v.endDay.toDate()
        const active = v.activeDays || []
        let cur = new Date(start)
        while (cur <= end) {
          if (active.includes(cur.getDay()))
            await addDoc(collection(db, `users/${userId}/challenges/${challengeId}/tasks`), {
              challengeId, taskName: v.taskName, type: v.type,
              date: Timestamp.fromDate(new Date(cur)),
              reminder: v.reminder ? Timestamp.fromDate(v.reminder.toDate()) : null,
              completed: false, createdAt: Timestamp.now(),
            })
          cur.setDate(cur.getDate() + 1)
        }
        message.success('Yaratildi!')
      }
      await fetchTasks(false)
      setOpenModal(false)
      setEditTask(null)
      form.resetFields()
    } catch { message.error('Xatolik!') } finally { setModalLoading(false) }
  }
  const handleOpenCreate = () => { setEditTask(null); form.resetFields(); setOpenModal(true) }
  const handleOpenEdit = t => { setEditTask(t); setOpenModal(true) }
  const handleCancelModal = () => { setOpenModal(false); setEditTask(null); form.resetFields() }
  const handleDelete = t =>
    confirm({
      title: "O'chirmoqchimisiz?",
      content: `"${t.taskName}" o'chiriladi!`,
      okText: "Ha, o'chir", okType: 'danger', cancelText: 'Bekor qilish',
      onOk: async () => {
        try {
          await deleteDoc(doc(db, `users/${userId}/challenges/${challengeId}/tasks/${t.id}`))
          fetchTasks(false)
          message.success("O'chirildi!")
        } catch { message.error('Xatolik!') }
      },
    })
    const toggleCompleted = async (task) => {
      /* 1. Darhol lokal holatni almashtiramiz */
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      );
    
      /* 2. Tugma loading holatini yoqamiz */
      setLoadingTaskId(task.id);
    
      try {
        await updateDoc(
          doc(db, `users/${userId}/challenges/${challengeId}/tasks/${task.id}`),
          { completed: !task.completed }
        );
      } catch (err) {
        console.error(err);
        message.error("Completed holatini yangilashda xatolik!");
        /* 3. Xatolik bo‘lsa ortga qaytarib qo‘yamiz */
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id ? { ...t, completed: task.completed } : t
          )
        );
      } finally {
        setLoadingTaskId(null);
      }
    };

  if (loading && !challenge)
    return <div className='h-screen grid place-content-center'><Spin size='large' /></div>

  /* ---------- RENDER ---------- */
  return (
    <div className='min-h-screen bg-[#f4f7fa]'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 h-16 flex items-center justify-between'>
          <Text
            onClick={() => navigate(-1)}
            className='text-sm font-semibold text-gray-600 hover:text-blue-600 cursor-pointer'
          >
            ← Orqaga
          </Text>
          <Title level={5} className='m-0 truncate font-bold text-gray-800'>
            {challenge?.title}
          </Title>
          <Text className='text-sm font-bold text-blue-600'>
            {dailyProgressPercentage}% (Bugun)
          </Text>
        </div>
        <Progress
          percent={dailyProgressPercentage}
          strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
          status='active' showInfo={false}
        />
      </header>

      {/* Body */}
      <main className='max-w-4xl mx-auto px-4 py-6'>
        {loading ? (
          <div className='grid place-content-center h-64'><Spin size='large' /></div>
        ) : Object.keys(groupedTasks).length ? (
          <div className='space-y-6'>
            {Object.keys(groupedTasks).map(date => (
              <section
                key={date}
                ref={date === todayStr ? todayRef : null}
                className='bg-white rounded-2xl shadow-sm border border-gray-100 p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <Text className='text-sm font-semibold text-gray-500'>
                    {date === todayStr ? `Bugun, ${date}` : date}
                  </Text>
                  <Text className='text-xs text-gray-400'>
                    {groupedTasks[date].filter(t => t.completed).length}/{groupedTasks[date].length}
                  </Text>
                </div>
                <div className='space-y-3'>
                  {groupedTasks[date].map(t => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${t.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <button
  onClick={() => toggleCompleted(t)}
  disabled={loadingTaskId === t.id}
  className="shrink-0 grid place-content-center w-7 h-7 rounded-full bg-white shadow-sm"
>
  {loadingTaskId === t.id ? (
    <Spin size="small" />
  ) : t.completed ? (
    <MdCheckCircle className="text-green-500" size={20} />
  ) : (
    <MdRadioButtonUnchecked className="text-gray-400" size={20} />
  )}
</button>

                      <div className='flex-1 min-w-0'>
                        <p className={`font-medium ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {t.taskName}
                        </p>
                        <div className='flex items-center gap-3 mt-1 text-xs text-gray-500'>
                          <span className='flex items-center gap-1'>
                            <BsLightning className='text-orange-400' />+10 XP
                          </span>
                          <span className='flex items-center gap-1'>
                            <HiOutlineFire className='text-red-400' />Streak
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button
                          type='text'
                          icon={<BiEditAlt size={18} />}
                          onClick={() => handleOpenEdit(t)}
                          className='text-gray-500 hover:text-blue-600'
                        />
                        <Button
                          type='text'
                          danger
                          icon={<RiDeleteBin5Line size={18} />}
                          onClick={() => handleDelete(t)}
                          className='hover:text-red-600'
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className='text-center py-20'>
            <div className='w-20 h-20 bg-gray-100 rounded-full grid place-content-center mx-auto mb-4'>
              <CgMathPlus size={28} className='text-gray-400' />
            </div>
            <Title level={4} className='text-gray-700'>Hali vazifalar yo‘q</Title>
            <Text className='text-gray-500 mb-6 block'>Birinchi vazifangizni yaratib, challengeni boshlang!</Text>
            <Button type='primary' size='large' onClick={handleOpenCreate}>
              Birinchi vazifani yaratish
            </Button>
          </div>
        )}
      </main>

      {/* FAB */}
      {Object.keys(groupedTasks).length > 0 && (
        <button
          onClick={handleOpenCreate}
          className='fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#001529] text-white shadow-lg grid place-content-center animate-bounce'
        >
          <CgMathPlus size={24} />
        </button>
      )}

      {/* Modal */}
      <Modal
        title={editTask ? 'Taskni tahrirlash' : 'Yangi task yaratish'}
        open={openModal}
        onOk={handleOk}
        onCancel={handleCancelModal}
        okText={editTask ? 'Saqlash' : 'Yaratish'}
        cancelText='Bekor qilish'
        confirmLoading={modalLoading}
        destroyOnClose={false}
        maskClosable={false}
      >
        <Form form={form} layout='vertical' className='mt-4'>
          <Form.Item
            name='taskName'
            label='Task nomi'
            rules={[{ required: true, message: 'Nom kiriting!' }]}
          >
            <Input size='large' placeholder='Masalan: 30 daqiqa yugurish' />
          </Form.Item>

          <Form.Item
            name='type'
            label='Turi'
            rules={[{ required: true, message: 'Type tanlang!' }]}
            initialValue='quicktask'
          >
            <Select size='large'>
              <Option value='quicktask'>Quick Task</Option>
              <Option value='main'>Main Task</Option>
            </Select>
          </Form.Item>

          {!editTask && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <Form.Item
                  name='startDay'
                  label='Boshlanish kuni'
                  rules={[{ required: true, message: 'Sanani tanlang!' }]}
                >
                  <DatePicker size='large' className='w-full' />
                </Form.Item>
                <Form.Item
                  name='endDay'
                  label='Tugash kuni'
                  rules={[{ required: true, message: 'Sanani tanlang!' }]}
                >
                  <DatePicker size='large' className='w-full' />
                </Form.Item>
              </div>
              <Form.Item
                name='activeDays'
                label='Faol kunlar'
                rules={[{ required: true, message: 'Kunlarni tanlang!' }]}
              >
                <Checkbox.Group options={weekDaysOptions} />
              </Form.Item>
            </>
          )}

          <Form.Item name='reminder' label='Eslatma'>
            <DatePicker size='large' className='w-full' showTime placeholder='Eslatma vaqtini tanlang' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}