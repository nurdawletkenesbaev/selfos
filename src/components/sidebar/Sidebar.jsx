import { BiTask } from 'react-icons/bi'
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import React, { useState } from 'react'
import { Button, Drawer, Layout, Menu } from 'antd'
import { Link } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const [visible, setVisible] = useState(false)
  const isMobile = window.innerWidth < 768

  // Menu elementlari (har bir Link bosilganda Drawer yopiladi)
  const list = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/goals'>
          Goals
        </Link>
      ),
    },
    {
      key: '2',
      icon: <CheckSquareOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/todays-tasks'>
          Today's tasks
        </Link>
      ),
    },
    {
      key: '3',
      icon: <BiTask />,
      label: (
        <Link onClick={() => setVisible(false)} to='/challenges'>
          Challenges
        </Link>
      ),
    },
    {
      key: '4',
      icon: <CalendarOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/history'>
          History
        </Link>
      ),
    },
    {
      key: '5',
      icon: <BarChartOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/statistics'>
          Statistics
        </Link>
      ),
    },
    {
      key: '6',
      icon: <ClockCircleOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/pomodoro-timer'>
          Pomodoro timer
        </Link>
      ),
    },
    {
      key: '7',
      icon: <SettingOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/settings'>
          Settings
        </Link>
      ),
    },
    {
      key: '8',
      icon: <InfoCircleOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/about-app'>
          About app
        </Link>
      ),
    },
  ]

  return (
    <>
      {isMobile ? (
        <div className='bg-[#001529]'>
          {/* Mobil versiya button */}
          <Button
            type='outlined'
            icon={<MenuOutlined />}
            onClick={() => setVisible(true)}
            style={{
              position: 'fixed',
              top: 18,
              right: 90,
              zIndex: 1000,
              color: '#4096ff',
            }}
          />
          {/* Drawer ochiladi */}
          <Drawer
            title='Menu'
            placement='left'
            onClose={() => setVisible(false)}
            open={visible}
            bodyStyle={{ padding: 0 }}
          >
            <Menu mode='inline' items={list} />
          </Drawer>
        </div>
      ) : (
        <Sider collapsible>
          <div
            className='text-center items-center flex justify-center text-white border-[1px] border-[#4096ff] rounded-sm'
            style={{
              height: 32,
              margin: 16,
              background: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Logo yoki ilova nomi */}
            {/* Just do it! */}
          </div>
          <Menu
            theme='dark'
            mode='inline'
            defaultSelectedKeys={['1']}
            items={list}
          />
        </Sider>
      )}
    </>
  )
}

export default Sidebar
