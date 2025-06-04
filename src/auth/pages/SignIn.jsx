import React from 'react'
import { Form, Input, Button, message } from 'antd'
import { signInWithEmailAndPassword } from 'firebase/auth'
// import { auth } from '../firebase'
import { Link } from 'react-router-dom'
import { auth } from '../../firebase/firebase'

const SignIn = () => {
  const onFinish = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      message.success('Tizimga muvaffaqiyatli kirdingiz!')
    } catch (error) {
      message.error(error.message)
    }
  }

  return (
    <div className='h-[100vh] w-full flex items-center'>
      <Form
        name='signin'
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
            SignIn
          </Button>
        </Form.Item>
        <div className='flex justify-center gap-2'>
          <Link
            to={'/forgotpassword'}
            className='text-[#4096ff] font-semibold text-center'
          >
            Did you forget your password?
          </Link>
        </div>
      </Form>
    </div>
  )
}

export default SignIn
