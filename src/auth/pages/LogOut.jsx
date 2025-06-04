import React from 'react'
import { Button, message } from 'antd'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/firebase'
// import { auth } from '../firebase'

const LogOut = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth)
      message.success('Tizimdan chiqdingiz.')
    } catch (error) {
      message.error(error.message)
    }
  }

  return (
    <Button type='default' onClick={handleLogout}>
      Chiqish
    </Button>
  )
}

export default LogOut
