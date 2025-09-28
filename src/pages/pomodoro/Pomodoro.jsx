import React, { useEffect, useState } from "react"
import {
  Button,
  Select,
  Space,
  InputNumber,
  Typography,
  message,
  Modal,
  Form,
  Input,
} from "antd"
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons"
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db, auth } from "../../firebase/firebase"

const { Title, Text } = Typography

const DEFAULT = { work: 25, short: 5, long: 15, longAfter: 4 }

export default function Pomodoro() {
  const user = auth.currentUser
  const uid = user?.uid

  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [minutes, setMinutes] = useState(DEFAULT.work)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState("work")
  const [breakLen, setBreakLen] = useState(DEFAULT.short)

  const [openModal, setOpenModal] = useState(false)
  const [form] = Form.useForm()

  // NEW: current active pomodoro doc id (so we update the same doc on finish/skip)
  const [currentPomodoroId, setCurrentPomodoroId] = useState(null)
  // Freeze planned duration for session (so even if minutes state changes afterwards, we keep original planned)
  const [sessionPlannedDuration, setSessionPlannedDuration] = useState(null)

  /* === FIREBASE TASKS LISTENER === */
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      collection(db, "users", uid, "pomodorTasks"), // path to'g'ri
      (snap) => {
        const arr = []
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
        setTasks(arr)
      }
    )
    return unsub
  }, [uid])

  /* === TIMER === */
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s === 0) {
          setMinutes((m) => {
            if (m === 0) {
              // timer finished
              setRunning(false)
              playDing()
              if (mode === "work") {
                message.success("Pomodoro yakunlandi! Tanaffus vaqti.")
                // finish the current pomodoro (UPDATE existing doc, do NOT create a new one)
                finishPomodoroSafely()
                setMode("break")
                setMinutes(breakLen)
              } else {
                message.success("Tanaffus yakunlandi! Yangi pomodoro.")
                setMode("work")
                setMinutes(DEFAULT.work)
              }
              return m
            }
            return m - 1
          })
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode, breakLen])

  /* === FUNCTIONS === */
  const handleStart = async () => {
    if (!selected?.id) {
      message.warning("Iltimos, task tanlang!")
      return
    }
    if (!uid) {
      message.error("Tizimga kirilmagan yoki foydalanuvchi yo'q")
      return
    }
    if (running) return

    // Freeze the planned duration for this session
    const planned = minutes
    try {
      // Create a single pomodoro document at start and keep its id
      const docRef = await addDoc(collection(db, "users", uid, "pomodoro"), {
        taskId: selected.id,
        plannedDuration: planned,
        startTime: serverTimestamp(),
        status: "running",
      })
      setCurrentPomodoroId(docRef.id)
      setSessionPlannedDuration(planned)
      // ensure timer uses the frozen planned value
      setMinutes(planned)
      setSeconds(0)
      setRunning(true)
    } catch (e) {
      console.error("Pomodoro start error:", e)
      message.error("Pomodoro boshlashda xatolik yuz berdi")
    }
  }

  const handlePause = () => setRunning(false)

  const handleReset = () => {
    // Reset local timer and clear current session (do not modify server data here)
    setRunning(false)
    setMode("work")
    setMinutes(DEFAULT.work)
    setSeconds(0)
    // Do not auto-update or delete server record here to avoid accidental double writes.
    // If you want to cancel a running pomodoro session and mark it skipped, use handleSkip.
  }

  const playDing = () => {
    try {
      new Audio("/ding.mp3").play()
    } catch {}
  }

  const addNewTask = () => setOpenModal(true)

  const handleAddOk = async () => {
    try {
      const values = await form.validateFields()
      if (!uid) return
      await addDoc(collection(db, "users", uid, "pomodorTasks"), {
        taskName: values.taskName.trim(),
        counter: 0,
        createdAt: serverTimestamp(),
      })
      message.success("Task qo‘shildi!")
      form.resetFields()
      setOpenModal(false)
    } catch (e) {
      console.log(e)
      message.error("Xatolik yuz berdi")
    }
  }
  const handleAddCancel = () => {
    form.resetFields()
    setOpenModal(false)
  }

  // When user clicks skip: update the existing pomodoro doc (if exists) as skipped
  const handleSkip = async () => {
    if (!running) {
      // If not running, nothing to skip
      setSeconds(0)
      setMode("work")
      setMinutes(DEFAULT.work)
      return
    }
    setRunning(false)
    try {
      if (currentPomodoroId) {
        // update existing doc
        await updateDoc(doc(db, "users", uid, "pomodoro", currentPomodoroId), {
          endTime: serverTimestamp(),
          plannedDuration: sessionPlannedDuration ?? minutes,
          actualFocusMinutes: 0,
          status: "skipped",
        })
        // increment task counter (optional)
        await updateDoc(doc(db, "users", uid, "pomodorTasks", selected.id), {
          counter: increment(1),
        })
        message.info("Pomodoro skipped – statistikaga yozildi")
        // clear current session id
        setCurrentPomodoroId(null)
        setSessionPlannedDuration(null)
      } else {
        // No start record — do nothing to avoid duplicate entries
        console.warn("Skip: hech qanday start yozuvi topilmadi, serverda yangi yozuv yaratilmaydi.")
        message.warning("Start yozuvi topilmadi — skip serverga yozilmadi.")
      }
    } catch (e) {
      console.error("Skip error:", e)
      message.error("Skip yozishda xatolik")
    } finally {
      setSeconds(0)
      setMode("break")
      setMinutes(breakLen)
    }
  }

  // finishPomodoroSafely updates the single doc created at start. It will NOT create a new doc.
  const finishPomodoroSafely = async () => {
    if (!uid) {
      console.warn("No uid")
      return
    }
    if (!currentPomodoroId) {
      // No start doc — avoid creating a duplicate; just warn.
      console.warn("finish called but no currentPomodoroId (no start record). No server update to avoid duplicates.")
      return
    }
    try {
      const actualMinutes = sessionPlannedDuration ?? minutes
      await updateDoc(doc(db, "users", uid, "pomodoro", currentPomodoroId), {
        endTime: serverTimestamp(),
        plannedDuration: sessionPlannedDuration ?? minutes,
        actualFocusMinutes: actualMinutes,
        status: "completed",
      })
      // increment task counter
      await updateDoc(doc(db, "users", uid, "pomodorTasks", selected.id), {
        counter: increment(1),
      })
      message.success("Pomodoro yakunlandi va saqlandi!")
    } catch (e) {
      console.error("Finish error:", e)
      message.error("Pomodoro saqlashda xatolik")
    } finally {
      // clear session id so next start creates a fresh doc
      setCurrentPomodoroId(null)
      setSessionPlannedDuration(null)
    }
  }

  /* === UI === */
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <Title level={2} className="!mb-6 !text-2xl sm:!text-3xl">
        {mode === "work" ? "🍅 Pomodoro" : "☕ Tanaffus"}
      </Title>

      {mode === "work" && (
        <Select
          className="w-full mb-6"
          placeholder="Vazifani tanlang"
          value={selected?.id}
          onChange={(id) => setSelected(tasks.find((t) => t.id === id))}
          popupRender={(menu) => (
            <>
              {menu}
              <div className="p-2 border-t border-gray-200">
                <Button type="text" icon={<PlusOutlined />} onClick={addNewTask}>
                  Yangi task qo‘shish
                </Button>
              </div>
            </>
          )}
        >
          {tasks.map((t) => (
            <Select.Option key={t.id} value={t.id}>
              {t.taskName}
            </Select.Option>
          ))}
        </Select>
      )}

      {!running && seconds === 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
          <Text>{mode === "work" ? "Ish vaqti:" : "Tanaffus:"}</Text>
          <InputNumber
            min={1}
            max={120}
            value={mode === "work" ? minutes : breakLen}
            onChange={(v) => {
              if (mode === "work") setMinutes(v || DEFAULT.work)
              else setBreakLen(v || DEFAULT.short)
            }}
          />
          <span>min</span>
        </div>
      )}

      <Title className="!text-6xl sm:!text-7xl font-bold !mb-6">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </Title>

      <Space size="large" className="flex flex-wrap justify-center mb-4">
        {!running ? (
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
          >
            Boshla
          </Button>
        ) : (
          <Button
            size="large"
            icon={<PauseCircleOutlined />}
            onClick={handlePause}
          >
            Pauza
          </Button>
        )}
        <Button size="large" icon={<RedoOutlined />} onClick={handleReset}>
          Qayta
        </Button>
        <Button size="large" icon={<ArrowRightOutlined />} onClick={handleSkip}>
          O‘tkazib yuborish
        </Button>
      </Space>

      {seconds === 0 && !running && mode === "work" && (
        <Button type="dashed" onClick={finishPomodoroSafely} className="mt-2">
          Yakunlandi (saqlash)
        </Button>
      )}

      <Modal
        title="Yangi task qo‘shish"
        open={openModal}
        onOk={handleAddOk}
        onCancel={handleAddCancel}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="taskName"
            label="Task nomi"
            rules={[{ required: true, message: "Iltimos nom kiriting" }]}
          >
            <Input placeholder="Masalan: IELTS writing" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
