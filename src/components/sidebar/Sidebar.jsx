import {
  BarChartOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  MoreOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import React, { useState } from 'react'

import { Button, Drawer, Dropdown, Layout, Menu } from 'antd'
import { Link } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const list = [
    {
      id: '1',
      icon: <DashboardOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/goals'>
          Goals
        </Link>
      ),
    },
    {
      id: '2',
      icon: <CheckSquareOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/todays-tasks'>
          Today's tasks
        </Link>
      ),
    },
    {
      id: '3',
      icon: <CalendarOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/history'>
          History
        </Link>
      ),
    },
    {
      id: '4',
      icon: <BarChartOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/statistics'>
          Statistics
        </Link>
      ),
    },
    {
      id: '6',
      icon: <ClockCircleOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/pomodoro-timer'>
          Pomodoro timer
        </Link>
      ),
    },
    {
      id: '7',
      icon: <SettingOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/settings'>
          Settings
        </Link>
      ),
    },
    {
      id: '5',
      icon: <InfoCircleOutlined />,
      label: (
        <Link onClick={() => setVisible(false)} to='/about-app'>
          About app
        </Link>
      ),
    },
  ]
  const menu = <Menu items={list} />
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const isMobile = window.innerWidth
  return (
    <>
      {isMobile < 768 ? (
        <div className='bg-[#001529]'>
          <Button
            primary
            icon={<MenuOutlined />}
            onClick={() => setVisible(true)}
            style={{ position: 'fixed', top: 18, right: 90, zIndex: 1000 }}
          />
          <Dropdown overlay={menu} trigger={['click']}>
            {/* <Button icon={<MoreOutlined />} /> */}
          </Dropdown>
        </div>
      ) : (
        <Sider collapsible>
          <div
            className='text-center items-center flex justify-center text-white border-[1px] border-[#4096ff] tet-[#4096ff] rounded-sm'
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
