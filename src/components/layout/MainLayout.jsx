import React from 'react'
import Header from '../header/Header'
import Sidebar from '../sidebar/Sidebar'
import Content from '../content/Content'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className='relative'>
      <div className='p-[5px] bg-[#002140] border-b-[1px] border-[#4096ff]'>
        <Header />
      </div>
      <div className='flex'>
        <Sidebar />
        <Content>
          <Outlet />
        </Content>
      </div>
    </div>
  )
}

export default MainLayout
