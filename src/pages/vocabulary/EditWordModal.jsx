import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const EditWordModal = ({ userId, wordId, onClose }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', userId, 'words', wordId))
      if (snap.exists()) form.setFieldsValue(snap.data())
      setLoading(false)
    }
    load()
  }, [userId, wordId, form])

  const handleOk = async () => {
    try {
      const vals = await form.validateFields()
      await updateDoc(doc(db, 'users', userId, 'words', wordId), vals)
      message.success('Saqlaldi')
      onClose()
    } catch (e) {
      message.error('Xato')
    }
  }

  return (
    <Modal
      title='So‘zni tahrirlash'
      open
      onOk={handleOk}
      onCancel={onClose}
      okText='Saqlash'
      cancelText='Bekor qilish'
      confirmLoading={loading}
    >
      <Form form={form} layout='vertical'>
        <Form.Item label='So‘z' name='word' rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label='Talaffuz' name='pronunciation'>
          <Input />
        </Form.Item>
        <Form.Item label='Speech part' name='partOfSpeech'>
          <Input />
        </Form.Item>
        <Form.Item label='Definition' name='definition'>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label='Definition (UZ)' name='definitionUz'>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label='Example' name='example'>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label='Chunks (vergul bilan)' name='chunks'>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditWordModal