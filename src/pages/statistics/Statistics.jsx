/* Statistics.jsx – to‘liq yakuniy kod */
import React, { useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Card,
  Select,
  Typography,
  Spin,
  Progress,
  Tag,
} from "antd";
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
} from "recharts";
import { RiseOutlined, FallOutlined } from "@ant-design/icons";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

/* ---------- yordamchi ---------- */
const fmtMins = (m) => {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h ? `${h}h ${min}m` : `${min}m`;
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Statistics() {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState([]); // pomodorolar
  const [tasks, setTasks] = useState([]); // tasklar
  const [range, setRange] = useState("week"); // day | week | month | all

  /* ------------------- Firestore ------------------- */
  useEffect(() => {
    if (!uid) return;

    const unsubPom = onSnapshot(
      collection(db, "users", uid, "pomodoro"),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setRaw(arr);
        setLoading(false);
      }
    );

    const unsubTask = onSnapshot(
      collection(db, "users", uid, "pomodorTasks"),
      (snap) => {
        const t = [];
        snap.forEach((d) => t.push({ id: d.id, ...d.data() }));
        setTasks(t);
      }
    );

    return () => {
      unsubPom();
      unsubTask();
    };
  }, [uid]);

  /* ------------------- filtering ------------------- */
  const now = dayjs();
  const [current, previous] = useMemo(() => {
    const borders = (() => {
      switch (range) {
        case "day":
          return {
            curStart: now.startOf("day"),
            prevStart: now.subtract(1, "day").startOf("day"),
            prevEnd: now.subtract(1, "day").endOf("day"),
          };
        case "week":
          return {
            curStart: now.subtract(7, "day").startOf("day"),
            prevStart: now.subtract(14, "day").startOf("day"),
            prevEnd: now.subtract(7, "day").endOf("day"),
          };
        case "month":
          return {
            curStart: now.subtract(1, "month").startOf("day"),
            prevStart: now.subtract(2, "month").startOf("day"),
            prevEnd: now.subtract(1, "month").endOf("day"),
          };
        default:
          return { curStart: dayjs(0), prevStart: null, prevEnd: null }; // all
      }
    })();

    const cur = raw.filter((p) => {
      const d = p.startTime?.toDate ? dayjs(p.startTime.toDate()) : null;
      return d && d.isAfter(borders.curStart);
    });

    const prev = borders.prevStart
      ? raw.filter((p) => {
          const d = p.startTime?.toDate ? dayjs(p.startTime.toDate()) : null;
          return d && d.isBetween(borders.prevStart, borders.prevEnd, null, "[]");
        })
      : [];

    return [cur, prev];
  }, [raw, range]);

  /* ------------------- aggregations ------------------- */
  const totalCurMin = useMemo(() => current.reduce((s, p) => s + (p.actualFocusMinutes || 0), 0), [current]);
  const totalPrevMin = useMemo(() => previous.reduce((s, p) => s + (p.actualFocusMinutes || 0), 0), [previous]);
  const diffMin = totalCurMin - totalPrevMin;
  const percentChange = totalPrevMin === 0 ? (totalCurMin ? 100 : 0) : Math.round((diffMin / totalPrevMin) * 100);

  /* ------------------- daily bar (kartochkalar) ------------------- */
  const dailyMap = current.reduce((acc, p) => {
    const key = dayjs(p.startTime?.toDate).format("DD/MM");
    acc[key] = (acc[key] || 0) + (p.actualFocusMinutes || 0);
    return acc;
  }, {});
  const dailyChart = Object.entries(dailyMap).map(([date, minutes]) => ({ date, minutes }));

  /* ------------------- task heights (Progress) ------------------- */
  const taskHeights = useMemo(() => {
    const map = {};
    current.forEach((p) => {
      map[p.taskId] = (map[p.taskId] || 0) + (p.actualFocusMinutes || 0);
    });
    return tasks
      .map((t) => ({ taskId: t.id, name: t.taskName, mins: map[t.id] || 0 }))
      .filter((t) => t.mins > 0)
      .sort((a, b) => b.mins - a.mins);
  }, [current, tasks]);

  /* ------------------- counts ------------------- */
  const completed = current.filter((p) => p.status === "completed").length;
  const skipped = current.filter((p) => p.status === "skipped").length;

  /* ------------------- Daily Cards komponenti (ichida) ------------------- */
  const DailyCards = ({ list }) => {
    if (!list.length) return <p style={{ textAlign: "center" }}>Ma'lumot yo‘q</p>;
    const max = Math.max(...list.map((i) => i.minutes));
    const min = Math.min(...list.map((i) => i.minutes));
    const color = (val) => {
      if (val === max) return "#10b981";
      if (val === min) return "#ef4444";
      return COLORS[2];
    };
    return (
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {list.map((d) => (
          <Card
            key={d.date}
            size="small"
            style={{
              minWidth: 110,
              background: color(d.minutes),
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>{d.date}</div>
            <div style={{ fontSize: 20, marginTop: 4 }}>{fmtMins(d.minutes)}</div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", textAlign: "center", marginTop: 60 }} />
    );

  /* ------------------- UI ------------------- */
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <Title level={2} style={{ textAlign: "center" }}>📊 Pomodoro Statistikasi</Title>

      {/* oraliq tanlash */}
      <div style={{ marginBottom: 24, textAlign: "right" }}>
        <Select value={range} onChange={setRange} style={{ width: 140 }}>
          <Option value="day">Kun</Option>
          <Option value="week">Hafta</Option>
          <Option value="month">Oy</Option>
          <Option value="all">Hammasi</Option>
        </Select>
      </div>

      {/* --- kartalar --- */}
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
          <Title level={3} style={{ margin: "8px 0 4px" }}>{fmtMins(totalCurMin)}</Title>
          {range !== "all" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {diffMin >= 0 ? (
                <RiseOutlined style={{ color: "#10b981" }} />
              ) : (
                <FallOutlined style={{ color: "#ef4444" }} />
              )}
              <Text type={diffMin >= 0 ? "success" : "danger"}>
                {fmtMins(Math.abs(diffMin))} ({percentChange > 0 ? "+" : ""}
                {percentChange}%)
              </Text>
            </div>
          )}
        </Card>
        <Card>
          <Text type="secondary">Tugallangan</Text>
          <Title level={3} style={{ margin: "8px 0 4px", color: "#10b981" }}>{completed}</Title>
        </Card>
        <Card>
          <Text type="secondary">O‘tkazib yuborilgan</Text>
          <Title level={3} style={{ margin: "8px 0 4px", color: "#f59e0b" }}>{skipped}</Title>
        </Card>
      </div>

      {/* --- grafiklar & kartochkalar --- */}
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Kunlik daqiqalar" key="1">
          <DailyCards list={dailyChart} />
        </TabPane>

        <TabPane tab="Top tasklar" key="2">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {taskHeights.length === 0 && <Text type="secondary">Ma’lumot yo‘q</Text>}
            {taskHeights.map((t, i) => {
              const percent = Math.round((t.mins / totalCurMin) * 100) || 0;
              return (
                <div key={t.taskId}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text strong>{t.name}</Text>
                    <Text>{fmtMins(t.mins)}</Text>
                  </div>
                  <Progress percent={percent} showInfo={false} strokeColor={COLORS[i % COLORS.length]} />
                </div>
              );
            })}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}