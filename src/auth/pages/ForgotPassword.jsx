import React, { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Input, Button, Form, message } from 'antd' // Ant Design komponentlari
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase/firebase'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    const { email } = values

    try {
      await sendPasswordResetEmail(auth, email)
      message.success('Tiklash havolasi emailingizga yuborildi.')
      setEmail('')
    } catch (err) {
      message.error('Xatolik: ' + err.message)
    }
  }

  const handleBackToLogin = () => {
    navigate('/signin')
  }

  return (
    <div className='w-full h-[100vh] flex items-center justify-center bg-white rounded-xl '>
      <div className='w-[90%] max-w-[400px]'>
        <h2 className='text-2xl font-semibold mb-4 text-center'>
          Parolni tiklash
        </h2>
        <Form onFinish={handleSubmit} className='space-y-4'>
          <Form.Item
            name='email'
            rules={[
              {
                required: true,
                message: 'Iltimos, email manzilingizni kiriting!',
              },
              { type: 'email', message: "Email noto'g'ri formatda" },
            ]}
          >
            <Input
              type='email'
              placeholder='Email manzilingiz'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' className='w-full'>
              Tiklash havolasini yuborish
            </Button>
          </Form.Item>
        </Form>

        <div className='mt-4'>
          <Button type='default' className='w-full' onClick={handleBackToLogin}>
            Ortga qaytish (Login sahifasiga)
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
