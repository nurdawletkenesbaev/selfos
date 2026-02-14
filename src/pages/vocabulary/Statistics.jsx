import React, { useState, useEffect } from 'react'
import { Card, Progress, Row, Col, Typography, Grid, Statistic } from 'antd'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import {
  CheckCircleOutlined,
  SyncOutlined,
  BookOutlined,
} from '@ant-design/icons'

const { Title } = Typography
const { useBreakpoint } = Grid

const Statistics = ({ userId }) => {
  const screens = useBreakpoint()
  const [data, setData] = useState([])
  const [masteredCount, setMasteredCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const INTERVALS = [1, 2, 3, 4, 7, 10, 14, 21, 30]

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const snap = await getDocs(collection(db, 'users', userId, 'words'))
      const map = {}
      let mastered = 0

      snap.docs.forEach((d) => {
        const wordData = d.data()
        const cd = wordData.currentDay || 0

        if (cd >= INTERVALS.length || wordData.mastered) {
          mastered++
        } else {
          map[cd] = (map[cd] || 0) + 1
        }
      })

      const chart = INTERVALS.map((interval, index) => ({
        day: `Day ${index}`,
        interval: interval,
        count: map[index] || 0,
      }))

      setData(chart)
      setMasteredCount(mastered)
      setLoading(false)
    }
    fetch()
  }, [userId])

  const max = Math.max(...data.map((d) => d.count), 1)
  const totalLearning = data.reduce((sum, d) => sum + d.count, 0)
  const totalWords = totalLearning + masteredCount

  const masteredPercent =
    totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0

  if (loading)
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>Yuklanmoqda...</div>
    )

  return (
    <div
      style={{
        padding: screens.xs ? 12 : 24,
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        📊 Statistika
      </Title>

      {/* Umumiy statistika */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8} md={8}>
          <Card>
            <Statistic
              title="Jami so'zlar"
              value={totalWords}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={8} md={8}>
          <Card>
            <Statistic
              title='Jarayonda'
              value={totalLearning}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={8} md={8}>
          <Card>
            <Statistic
              title='Ustagan'
              value={masteredCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`${masteredPercent}%`}
            />
          </Card>
        </Col>
      </Row>

      {/* Interval bo'yicha so'zlar */}
      <Title level={5} style={{ marginBottom: 16 }}>
        📚 Interval bo'yicha so'zlar
      </Title>

      <Row gutter={[8, 8]}>
        {data.map((d) => (
          <Col key={d.day} xs={8} sm={6} md={4} lg={3}>
            <Card
              size='small'
              hoverable
              style={{
                borderTop: '3px solid #4096ff',
                opacity: d.count > 0 ? 1 : 0.6,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <strong>{d.day}</strong>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#8c8c8c',
                  marginBottom: 8,
                }}
              >
                ({d.interval} kun)
              </div>
              <Progress
                percent={Math.round((d.count / max) * 100)}
                showInfo={false}
                strokeColor='#4096ff'
                size='small'
              />
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                <strong>{d.count}</strong> ta so'z
              </div>
            </Card>
          </Col>
        ))}

        {/* Ustalgan so'zlar */}
        <Col xs={8} sm={6} md={4} lg={3}>
          <Card
            size='small'
            hoverable
            style={{
              borderTop: '3px solid #52c41a',
              backgroundColor: masteredCount > 0 ? '#f6ffed' : 'white',
              opacity: masteredCount > 0 ? 1 : 0.6,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <strong style={{ color: '#52c41a' }}>✅ Day 9+</strong>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#8c8c8c',
                marginBottom: 8,
              }}
            >
              (Ustagan)
            </div>
            <Progress
              percent={Math.round((masteredCount / max) * 100)}
              showInfo={false}
              strokeColor='#52c41a'
              size='small'
            />
            <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              <strong>{masteredCount}</strong> ta so'z
            </div>
          </Card>
        </Col>
      </Row>

      {/* Progress bar */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Umumiy progress:</strong>
        </div>
        <Progress
          percent={masteredPercent}
          status='active'
          strokeColor={{ from: '#108ee9', to: '#87d068' }}
          format={(percent) => `${percent}% ustalgan`}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          {masteredCount} ta so'z to'liq o'rganilgan, {totalLearning} ta so'z
          o'rganilmoqda
        </div>
      </Card>
    </div>
  )
}

export default Statistics
