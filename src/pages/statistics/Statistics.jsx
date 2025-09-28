import React, { useEffect, useState, useMemo } from "react"
import { Tabs, Card, Select, Typography, Spin, Progress, Tag } from "antd"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { collection, onSnapshot } from "firebase/firestore"
import { db, auth } from "../../firebase/firebase"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"

dayjs.extend(isBetween)

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function Statistics() {
  const uid = auth.currentUser?.uid
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState([]) // pomodorolar
  const [tasks, setTasks] = useState([]) // tasklar
  const [range, setRange] = useState("week") // week | month | day | all

  /* ----------------------- Firestore listener ----------------------- */
  useEffect(() => {
    if (!uid) return

    const unsubPomodoro = onSnapshot(
      collection(db, "users", uid, "pomodoro"),
      (snap) => {
        const arr = []
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
        setRaw(arr)
        setLoading(false)
      }
    )

    const unsubTasks = onSnapshot(
      collection(db, "users", uid, "pomodorTasks"),
      (snap) => {
        const t = []
        snap.forEach((d) => t.push({ id: d.id, ...d.data() }))
        setTasks(t)
      }
    )

    return () => {
      unsubPomodoro()
      unsubTasks()
    }
  }, [uid])

  /* ----------------------- Filtering ----------------------- */
  const now = dayjs()
  const filtered = useMemo(() => {
    return raw.filter((p) => {
      const start = p.startTime?.toDate ? dayjs(p.startTime.toDate()) : dayjs()
      if (range === "day") return start.isAfter(now.startOf("day"))
      if (range === "week") return start.isAfter(now.subtract(7, "day"))
      if (range === "month") return start.isAfter(now.subtract(1, "month"))
      return true
    })
  }, [raw, range])

  // oldingi davrni hisoblash (taqqoslash uchun)
  const prevData = useMemo(() => {
    return raw.filter((p) => {
      const start = p.startTime?.toDate ? dayjs(p.startTime.toDate()) : dayjs()
      if (range === "day")
        return start.isBetween(
          now.subtract(1, "day").startOf("day"),
          now.subtract(1, "day").endOf("day")
        )
      if (range === "week")
        return start.isBetween(now.subtract(14, "day"), now.subtract(7, "day"))
      if (range === "month")
        return start.isBetween(
          now.subtract(2, "month"),
          now.subtract(1, "month")
        )
      return []
    })
  }, [raw, range])

  /* ----------------------- Aggregations ----------------------- */
  const totalCur = useMemo(() => {
    return filtered.reduce((s, p) => s + (p.actualFocusMinutes || 0), 0)
  }, [filtered])

  const totalPrev = useMemo(() => {
    return prevData.reduce((s, p) => s + (p.actualFocusMinutes || 0), 0)
  }, [prevData])

  const diff = totalCur - totalPrev
  const percentChange =
    totalPrev === 0 ? 100 : Math.round((diff / totalPrev) * 100)

  /* ----------------------- Daily Chart ----------------------- */
  const dailyMap = filtered.reduce((acc, p) => {
    const d = dayjs(p.startTime?.toDate()).format("DD/MM")
    if (!acc[d]) acc[d] = 0
    acc[d] += p.actualFocusMinutes || 0
    return acc
  }, {})

  const dailyChart = Object.entries(dailyMap).map(([date, minutes]) => ({
    date,
    minutes,
  }))

  /* ----------------------- Task Chart ----------------------- */
  const taskStat = tasks
    .map((t) => ({
      name: t.taskName,
      value: filtered
        .filter((p) => p.taskId === t.id)
        .reduce((s, p) => s + (p.actualFocusMinutes || 0), 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  /* ----------------------- Counts ----------------------- */
  const completed = filtered.filter((p) => p.status === "completed").length
  const skipped = filtered.filter((p) => p.status === "skipped").length

  if (loading)
    return (
      <Spin
        size="large"
        style={{ display: "block", textAlign: "center", marginTop: 60 }}
      />
    )

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <Title level={2}>📊 Pomodoro Statistika</Title>

      {/* Oraliq tanlash */}
      <div style={{ marginBottom: 24, textAlign: "right" }}>
        <Select value={range} onChange={setRange} style={{ width: 140 }}>
          <Option value="day">Kun</Option>
          <Option value="week">Hafta</Option>
          <Option value="month">Oy</Option>
          <Option value="all">Hammasi</Option>
        </Select>
      </div>

      {/* Kartalar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Card>
          <Text type="secondary">Umumiy fokus</Text>
          <Title level={3} style={{ margin: 0 }}>
            {Math.round(totalCur)} min
          </Title>
          {range !== "all" && (
            <Tag color={diff >= 0 ? "green" : "red"} style={{ marginTop: 8 }}>
              {diff >= 0 ? "+" : ""}
              {percentChange}%{" "}
              {diff >= 0 ? "ko‘proq" : "kamroq"} {range}ga nisbatan
            </Tag>
          )}
        </Card>
        <Card>
          <Text type="secondary">Tugallangan</Text>
          <Title level={3} style={{ margin: 0, color: "#10b981" }}>
            {completed}
          </Title>
        </Card>
        <Card>
          <Text type="secondary">O‘tkazib yuborilgan</Text>
          <Title level={3} style={{ margin: 0, color: "#f59e0b" }}>
            {skipped}
          </Title>
        </Card>
      </div>

      {/* Grafiklar */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="Kunlik minutlar" key="1">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyChart}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => `${v} min`} />
              <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                label={(entry) => `${entry.name}: ${entry.value}m`}
              >
                {taskStat.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} min`} />
            </PieChart>
          </ResponsiveContainer>
        </TabPane>
      </Tabs>
    </div>
  )
}
