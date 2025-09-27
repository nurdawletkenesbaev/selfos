import React, { useEffect, useState } from 'react'
import { Tabs, Card, Select, Typography, Spin, Progress } from 'antd'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { collection, onSnapshot, Timestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase/firebase'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Statistics() {
  const uid = auth.currentUser?.uid
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState([])          // bitta pomodorolar
  const [tasks, setTasks] = useState([])     // tasklar (id, taskName, counter)
  const [range, setRange] = useState('week') // week | month | all

  /* ----------------------- data ----------------------- */
  useEffect(() => {
    if (!uid) return
    // 1) pomodorolar
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'pomodoros'),
      (snap) => {
        const arr = []
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
        setRaw(arr)
        setLoading(false)
      }
    )
    // 2) tasklar
    const unsub2 = onSnapshot(
      collection(db, 'users', uid, 'pomodorTasks'),
      (snap) => {
        const t = []
        snap.forEach((d) => t.push({ id: d.id, ...d.data() }))
        setTasks(t)
      }
    )
    return () => { unsub(); unsub2() }
  }, [uid])

  /* ----------------------- helpers ----------------------- */
  const filterDate = (d) => {
    const r = dayjs(d.startTime?.toDate ? d.startTime.toDate() : d.startTime)
    const now = dayjs()
    if (range === 'week') return r.isAfter(now.subtract(7, 'day'))
    if (range === 'month') return r.isAfter(now.subtract(1, 'month'))
    return true // all
  }
  const filtered = raw.filter(filterDate)

  /* kunlik grafiga */
  const dailyMap = filtered.reduce((acc, p) => {
    const d = dayjs(p.startTime?.toDate()).format('DD/MM')
    if (!acc[d]) acc[d] = 0
    acc[d] += 1
    return acc
  }, {})
  const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  /* task bo‘yicha */
  const taskStat = tasks
    .map((t) => ({
      name: t.taskName,
      value: filtered.filter((p) => p.taskId === t.id).length
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  /* umumiy */
  const total = filtered.length
  const completed = filtered.filter((p) => p.status === 'completed').length
  const skipped = filtered.filter((p) => p.status === 'skipped').length
  const focusMinutes = filtered
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + (p.actualFocusMinutes || 0), 0)

  /* ----------------------- UI ----------------------- */
  if (loading) return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 60 }} />

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <Title level={2}>📊 Statistika</Title>

      {/* Oraliq tanlash */}
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <Select value={range} onChange={setRange} style={{ width: 120 }}>
          <Option value="week">Hafta</Option>
          <Option value="month">Oy</Option>
          <Option value="all">Hammasi</Option>
        </Select>
      </div>

      {/* Kartalar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Card>
          <Text type="secondary">Jami pomodoro</Text>
          <Title level={2} style={{ margin: 0 }}>{total}</Title>
        </Card>
        <Card>
          <Text type="secondary">Tugallangan</Text>
          <Title level={2} style={{ margin: 0, color: '#10b981' }}>{completed}</Title>
        </Card>
        <Card>
          <Text type="secondary">O‘tkazib yuborilgan</Text>
          <Title level={2} style={{ margin: 0, color: '#f59e0b' }}>{skipped}</Title>
        </Card>
        <Card>
          <Text type="secondary">Jami focus (min)</Text>
          <Title level={2} style={{ margin: 0 }}>{Math.round(focusMinutes)}</Title>
        </Card>
      </div>

      {/* Grafiklar */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="Kunlik" key="1">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyChart}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabPane>

        <TabPane tab="Top tasklar" key="2">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStat}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {taskStat.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </TabPane>
      </Tabs>
    </div>
  )
}