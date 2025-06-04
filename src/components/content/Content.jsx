import React from 'react'

const Content = ({ children }) => {
  return (
    <div className='w-full  h-[calc(100vh-71px)] overflow-auto shadow-md border-l-[1px] border-[#4096ff]'>
      {children}
    </div>
  )
}

export default Content
