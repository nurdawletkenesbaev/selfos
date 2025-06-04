import React from 'react'
import { Form, Input, Button, message } from 'antd'
import { createUserWithEmailAndPassword } from 'firebase/auth'
// import { auth } from '../firebase'
import { Link } from 'react-router-dom'
import { auth } from '../../firebase/firebase'

const SignUp = () => {
  const onFinish = async ({ email, password }) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      message.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!")
    } catch (error) {
      message.error(error.message)
    }
  }

  return (
    <div className='h-[100vh] w-full flex items-center'>
      <Form
        name='signup'
        onFinish={onFinish}
        layout='vertical'
        style={{ maxWidth: 400, margin: 'auto auto', width: '90%' }}
      >
        <Form.Item
          name='email'
          label='Email'
          rules={[{ required: true, type: 'email', message: 'Email kiriting' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='password'
          label='Parol'
          rules={[{ required: true, message: 'Parol kiriting' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block>
            Registration
          </Button>
        </Form.Item>
        <div className='flex justify-center gap-2'>
          <span>Have you already registered?</span>
          <Link
            to={'/signin'}
            className='text-[#4096ff] font-semibold text-center'
          >
            SignIn
          </Link>
        </div>
      </Form>
    </div>
  )
}

export default SignUp
