import { Spin } from 'antd'

const Loading = () => {
  return (
    <div
      className='w-full h-[100vh] flex items-center justify-center'
      style={{ textAlign: 'center', padding: '50px' }}
    >
      <Spin size='large' />
    </div>
  )
}

export default Loading
