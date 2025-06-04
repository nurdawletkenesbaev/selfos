import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
// import { getTasks, createTask, editTask, removeTask } from '../features/tasks/taskSlice';
// import TaskModal from './TaskModal'
import {
  getTasks,
  createTask,
  editTask,
  removeTask,
} from '../../store/slices/taskSlice'
import TaskModal from './taskComponents/TaskModal'

const TodaysTasks = () => {
  const dispatch = useDispatch()
  const { items: tasks, status } = useSelector((state) => state.tasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    dispatch(getTasks())
  }, [dispatch])

  const handleAddClick = () => {
    setSelectedTask(null) // yangi task
    setIsModalOpen(true)
  }

  const handleEditClick = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleSubmit = (values) => {
    if (selectedTask) {
      dispatch(editTask({ id: selectedTask.id, data: values }))
    } else {
      dispatch(createTask(values))
    }
    setIsModalOpen(false)
  }

  return (
    <div>
      <h2>Vazifalar</h2>
      <Button type='primary' onClick={handleAddClick}>
        ➕ Yangi vazifa
      </Button>

      {status === 'loading' ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <span
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </span>
              <Button
                onClick={() => handleEditClick(task)}
                style={{ margin: '0 5px' }}
              >
                ✏️
              </Button>
              <Button danger onClick={() => dispatch(removeTask(task.id))}>
                ❌
              </Button>
            </li>
          ))}
        </ul>
      )}

      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedTask}
      />
    </div>
  )
}

export default TodaysTasks
