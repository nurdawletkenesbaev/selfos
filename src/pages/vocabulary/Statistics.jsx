import React, { useState, useEffect } from 'react'
import { Card, Progress, Row, Col, Typography, Grid } from 'antd'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'

const { Title } = Typography
const { useBreakpoint } = Grid

const Statistics = ({ userId }) => {
  const screens = useBreakpoint()
  const [data, setData] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'words'))
      const map = {}
      snap.docs.forEach((d) => {
        const cd = d.data().currentDay || 0
        map[cd] = (map[cd] || 0) + 1
      })
      // Day 0..6
      const chart = Array.from({ length: 7 }, (_, day) => ({
        day: `Day ${day}`,
        count: map[day] || 0,
      }))
      setData(chart)
    }
    fetch()
  }, [userId])

  // Max qiymat (proportional balandlik uchun)
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div style={{ padding: screens.xs ? 8 : 16 }}>
      <Title level={4} style={{ textAlign: 'center' }}>
        Interval bo‘yicha so‘zlar soni
      </Title>

      <Row gutter={[8, 8]}>
        {data.map((d) => (
          <Col key={d.day} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card size='small' hoverable>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <strong>{d.day}</strong>
              </div>
              <Progress
                percent={Math.round((d.count / max) * 100)}
                showInfo={false}
                strokeColor='#4096ff'
              />
              <div style={{ textAlign: 'center', fontSize: 12 }}>
                {d.count} ta so‘z
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Statistics