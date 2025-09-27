import { BellOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Popover } from 'antd'
import React from 'react'
import logo from '../../images/logo/logoOS.png'
import LogOut from '../../auth/pages/LogOut'

const Header = () => {
  const content = <LogOut />
  return (
    <div className='h-[60px] bg-[#001529] flex justify-between px-[10px] itens-center shadow-md rounded-sm border-[1px] border-[#4096ff]'>
      <div>
        <img className='w-[60px] h-[60px]' src={logo} alt='' />
      </div>
      <div className='flex items-center gap-4'>
        {/* <Button onClick={toggleTheme}>{theme === 'dark' ? '🌙' : '☀️'}</Button> */}
        <Badge count={5} style={{ cursor: 'pointer', borderColor: '#4096ff' }}>
          <BellOutlined
            style={{ fontSize: '20px', cursor: 'pointer', color: '#4096ff' }}
          />
        </Badge>
        <Popover content={content} trigger='hover' placement='bottom'>
          <Avatar
            icon={<UserOutlined style={{ color: '#4096ff' }} />}
            style={{
              cursor: 'pointer',
              borderColor: '#4096ff',
              borderRadius: '50%',
            }}
          />
        </Popover>
      </div>
    </div>
  )
}

export default Header
