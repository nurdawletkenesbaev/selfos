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
import React, { useState, useEffect } from 'react'
import { Button, Drawer, Layout, Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const [visible, setVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const location = useLocation()

  // Ekran o'lchami o'zgarganda qayta render bo'lishi
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const list = [
    {
      key: '/goals',
      icon: <DashboardOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/goals'>
          Goals
        </Link>
      ),
    },
    {
      key: '/todays-tasks',
      icon: <CheckSquareOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/todays-tasks'>
          Today's tasks
        </Link>
      ),
    },
    {
      key: '/challenges',
      icon: <BiTask />,
      label: (
        <Link onClick={() => setVisible(false)} to='/challenges'>
          Challenges
        </Link>
      ),
    },
    {
      key: '/history',
      icon: <CalendarOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/history'>
          History
        </Link>
      ),
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/statistics'>
          Statistics
        </Link>
      ),
    },
    {
      key: '/pomodoro-timer',
      icon: <ClockCircleOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/pomodoro-timer'>
          Pomodoro timer
        </Link>
      ),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/settings'>
          Settings
        </Link>
      ),
    },
    {
      key: '/about-app',
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
            type='text'
            icon={<MenuOutlined />}
            onClick={() => setVisible(true)}
            style={{
              position: 'fixed',
              top: 18,
              right: 86,
              zIndex: 1000,
              color: '#fff',
              backgroundColor: 'transparent',
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
            <Menu
              mode='inline'
              selectedKeys={[location.pathname]} // active bo'lgan sahifa highlight bo'ladi
              items={list}
            />
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
            Just do it!
          </div>
          <Menu
            theme='dark'
            mode='inline'
            selectedKeys={[location.pathname]}
            items={list}
          />
        </Sider>
      )}
    </>
  )
}

export default Sidebar
