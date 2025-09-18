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
import { db } from '../../../firebase/firebase'
import { List, Input, Button, Form, Space, Typography, message } from 'antd'


const { Text } = Typography

function CreateChallenge({ userId }) {
  const [title, setTitle] = useState('')
  const [challenges, setChallenges] = useState([])
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  // 🔹 Challenge’larni yuklash
  const fetchChallenges = async () => {
    if (!userId) return
    const q = query(
      collection(db, 'users', userId, 'challenges'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    setChallenges(data)
  }

  useEffect(() => {
    fetchChallenges()
  }, [userId])

  // 🔹 Yangi challenge yaratish
  const handleSubmit = async () => {
    if (!title.trim() || !userId) return
    try {
      await addDoc(collection(db, 'users', userId, 'challenges'), {
        title: title.trim(),
        createdAt: new Date(),
      })
      setTitle('')
      fetchChallenges()
      message.success('Challenge yaratildi!')
    } catch (err) {
      console.error(err)
      message.error('Challenge yaratishda xatolik yuz berdi!')
    }
  }

  // 🔹 Challenge o‘chirish
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'challenges', id))
      fetchChallenges()
      message.success('Challenge o‘chirildi!')
    } catch (err) {
      console.error(err)
      message.error('O‘chirishda xatolik yuz berdi!')
    }
  }

  // 🔹 Editga kirish
  const handleEdit = (challenge) => {
    setEditId(challenge.id)
    setEditTitle(challenge.title)
  }

  // 🔹 Editni saqlash
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    try {
      await updateDoc(doc(db, 'users', userId, 'challenges', editId), {
        title: editTitle.trim(),
      })
      setEditId(null)
      setEditTitle('')
      fetchChallenges()
      message.success('Challenge yangilandi!')
    } catch (err) {
      console.error(err)
      message.error('Yangilashda xatolik yuz berdi!')
    }
  }

  // 🔹 Editni bekor qilish
  const handleCancelEdit = () => {
    setEditId(null)
    setEditTitle('')
  }

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>Challenge Manager</h2>

      {/* Create Challenge Form */}
      <Form
        layout='inline'
        onFinish={handleSubmit}
        style={{ marginBottom: '20px' }}
      >
        <Form.Item style={{ flex: 1 }}>
          <Input
            placeholder='Challenge title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            Create
          </Button>
        </Form.Item>
      </Form>

      {/* Challenge List */}
      <List
        bordered
        dataSource={challenges}
        renderItem={(challenge) => (
          <List.Item
            actions={
              editId === challenge.id
                ? [
                    <Button type='link' key='save' onClick={handleSaveEdit}>
                      Save
                    </Button>,
                    <Button
                      type='link'
                      danger
                      key='cancel'
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>,
                  ]
                : [
                    <Button
                      type='link'
                      key='edit'
                      onClick={() => handleEdit(challenge)}
                    >
                      Edit
                    </Button>,
                    <Button
                      type='link'
                      danger
                      key='delete'
                      onClick={() => handleDelete(challenge.id)}
                    >
                      Delete
                    </Button>,
                  ]
            }
          >
            {editId === challenge.id ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <Text>{challenge.title}</Text>
            )}
          </List.Item>
        )}
      />
    </div>
  )
}

export default CreateChallenge
