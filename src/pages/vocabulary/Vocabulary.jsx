import React, { useState } from 'react'
import { Tabs, Button, Grid } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AddBulk from './AddBulk'
import NewWords from './NewWords'
import TodaysWords from './TodaysWords'
import Statistics from './Statistics'
import AllWords from './AllWords'

const { useBreakpoint } = Grid
const { TabPane } = Tabs

const Vocabulary = ({ userId }) => {
  const nav = useNavigate()
  const screens = useBreakpoint()
  const [activeKey, setActiveKey] = useState('1')

  // Mobil uchun tabPosition
  const tabPosition = screens.xs ? 'top' : 'left'

  return (
    <div style={{ padding: screens.xs ? 8 : 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>Vocabulary</h2>
        <AddBulk userId={userId} onSuccess={() => window.location.reload()} />
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        tabPosition={tabPosition}
        size={screens.xs ? 'small' : 'middle'}
        items={[
          {
            label: 'New Words',
            key: '1',
            children: <NewWords userId={userId} />,
          },
          {
            label: "Today's Words",
            key: '2',
            children: <TodaysWords userId={userId} />,
          },
          {
            label: 'Statistics',
            key: '3',
            children: <Statistics userId={userId} />,
          },
          {
            label: 'All Words',
            key: '4',
            children: <AllWords userId={userId} />,
          },
        ]}
      />
    </div>
  )
}

export default Vocabulary