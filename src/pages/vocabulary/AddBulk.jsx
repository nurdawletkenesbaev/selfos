import React, { useState } from 'react'
import { Modal, Input, Button, message } from 'antd'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const AddBulk = ({ userId, onSuccess }) => {
  const [visible, setVisible] = useState(false)
  const [jsonText, setJsonText] = useState('') // ← bo‘sh

  const handleOk = async () => {
    try {
      const list = JSON.parse(jsonText)
      if (!Array.isArray(list)) throw new Error('Massiv emas')

      for (const w of list) {
        await addDoc(collection(db, 'users', userId, 'words'), {
          ...w,
          nextReviewDate: Timestamp.fromDate(new Date()),
          createdAt: serverTimestamp(),
        })
      }
      message.success(`${list.length} ta so‘z qo‘shildi!`)
      setJsonText('') // ← tozalash
      setVisible(false)
      onSuccess()
    } catch (e) {
      message.error('JSON xato: ' + e.message)
    }
  }

  return (
    <>
      <Button type='primary' onClick={() => setVisible(true)}>
        Yangi so‘zlar (JSON)
      </Button>

      <Modal
        title='JSON massiv kiritish'
        open={visible}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        okText='Qo‘shish'
        cancelText='Bekor qilish'
        width={720}
      >
        <Input.TextArea
          rows={20}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Masalan:
[
  {
    "word": "Apple",
    "pronunciation": "/ˈæpl/",
    "definition": "A fruit",
    "definitionUz": "Olma",
    "example": "I ate an apple.",
    "chunks": ["apple pie"],
    "currentDay": 0,
    "nextReviewDate": null,
    "history": []
  }
]'
        />
      </Modal>
    </>
  )
}

export default AddBulk