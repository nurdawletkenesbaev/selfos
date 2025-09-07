import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Typography,
} from 'antd'
import { CgMathPlus } from 'react-icons/cg'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { BiEditAlt } from 'react-icons/bi'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Text } = Typography
const { confirm } = Modal

function Challenges({ userId }) {
  const [challenges, setChallenges] = useState([])
  const [open, setOpen] = useState(false)
  const [editChallenge, setEditChallenge] = useState(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  // 🔹 Load challenges
  const fetchChallenges = async () => {
    if (!userId) return
    const q = query(
      collection(db, `users/${userId}/challenges`),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    setChallenges(data)
  }

  useEffect(() => {
    fetchChallenges()
  }, [userId])

  // 🔹 Open modal for create
  const handleOpenCreate = () => {
    setEditChallenge(null)
    form.resetFields()
    setOpen(true)
  }

  // 🔹 Open modal for edit
  const handleOpenEdit = (challenge) => {
    setEditChallenge(challenge)
    form.setFieldsValue({
      title: challenge.title,
      startDate: challenge.startDate
        ? dayjs(challenge.startDate.toDate())
        : null,
      endDate: challenge.endDate ? dayjs(challenge.endDate.toDate()) : null,
    })
    setOpen(true)
  }

  // 🔹 Handle create or edit
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (editChallenge) {
        await updateDoc(
          doc(db, 'users', userId, 'challenges', editChallenge.id),
          {
            title: values.title,
            startDate: values.startDate ? values.startDate.toDate() : null,
            endDate: values.endDate ? values.endDate.toDate() : null,
          }
        )
        message.success('Challenge yangilandi!')
      } else {
        await addDoc(collection(db, 'users', userId, 'challenges'), {
          title: values.title,
          startDate: values.startDate ? values.startDate.toDate() : null,
          endDate: values.endDate ? values.endDate.toDate() : null,
          createdAt: new Date(),
          order: challenges.length,
        })
        message.success('Challenge yaratildi!')
      }
      setOpen(false)
      form.resetFields()
      fetchChallenges()
    } catch (err) {
      console.error(err)
      message.error('Xatolik yuz berdi!')
    }
  }

  // 🔹 Confirm delete

  const handleDelete = (challenge) => {
    confirm({
      title: 'Are you sure you want to delete this challenge?',
      content: `"${challenge.title}" challenge va unga tegishli barcha tasks o‘chiriladi!`,
      okText: 'Ha, o‘chir',
      okType: 'danger',
      cancelText: 'Bekor qilish',
      onOk: async () => {
        try {
          // 1. Shu challenge ichidagi taskslarni olish
          const tasksSnapshot = await getDocs(
            collection(db, 'users', userId, 'challenges', challenge.id, 'tasks')
          )

          // 2. Har bir taskni o‘chirish
          const deleteTasks = tasksSnapshot.docs.map((taskDoc) =>
            deleteDoc(taskDoc.ref)
          )
          await Promise.all(deleteTasks)

          // 3. Challenge'ni o‘chirish
          await deleteDoc(doc(db, 'users', userId, 'challenges', challenge.id))

          message.success('Challenge va unga tegishli barcha tasks o‘chirildi!')
          fetchChallenges()
        } catch (err) {
          console.error(err)
          message.error('Xatolik yuz berdi!')
        }
      },
    })
  }

  // 🔹 Drag and Drop handler
  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const items = Array.from(challenges)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setChallenges(items)
    try {
      await Promise.all(
        items.map((challenge, index) =>
          updateDoc(doc(db, 'users', userId, 'challenges', challenge.id), {
            order: index,
          })
        )
      )
    } catch (err) {
      console.error(err)
      message.error('Tartibni saqlashda xatolik!')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 className='text-center text-[30px] mb-4'>My Challenges</h1>

      <div className='absolute bottom-4 right-4 animate-bounce'>
        <Button
          style={{ backgroundColor: '#1677ff' }}
          onClick={handleOpenCreate}
        >
          <CgMathPlus color='white' size={20} />
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId='challenges'>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {challenges.map((challenge, index) => (
                <Draggable
                  key={challenge.id}
                  draggableId={challenge.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        marginBottom: '8px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        style={{ marginRight: 10, cursor: 'grab' }}
                      >
                        ☰
                      </div>

                      {/* Challenge title */}
                      <div
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                      >
                        {challenge.title}
                      </div>

                      {/* Edit/Delete */}
                      <Button
                        type='link'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEdit(challenge)
                        }}
                      >
                        <BiEditAlt />
                      </Button>
                      <Button
                        type='link'
                        danger
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(challenge)
                        }}
                      >
                        <RiDeleteBin5Line />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal
        title={
          editChallenge ? 'Challenge tahrirlash' : 'Yangi Challenge yaratish'
        }
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText={editChallenge ? 'Saqlash' : 'Yaratish'}
        cancelText='Bekor qilish'
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='title'
            label='Challenge nomi'
            rules={[{ required: true, message: 'Nom kiriting!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name='startDate' label='Start date'>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name='endDate' label='End date'>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Challenges
