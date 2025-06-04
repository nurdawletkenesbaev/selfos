import React, { useEffect } from 'react'
import { Modal, Form, Input } from 'antd'

const TaskModal = ({ open, onClose, onSubmit, initialValues }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
    }
  }, [initialValues, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values)
        form.resetFields()
      })
      .catch((info) => {
        console.log('Validation Failed:', info)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={initialValues ? 'Tahrirlash' : 'Yangi vazifa'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={initialValues ? 'Saqlash' : 'Qo‘shish'}
    >
      <Form form={form} layout='vertical' name='taskForm'>
        <Form.Item
          name='title'
          label='Vazifa nomi'
          rules={[{ required: true, message: 'Iltimos, nom kiriting' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TaskModal
