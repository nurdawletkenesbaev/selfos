import { RiCloseFill } from 'react-icons/ri'
import { CgMathPlus } from 'react-icons/cg'
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
import Loading from '../Loading'

const TodaysTasks = () => {
  const dispatch = useDispatch()
  const { items: tasks, status } = useSelector((state) => state.tasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    dispatch(getTasks())
  }, [dispatch])

  const handleAddClick = () => {
    setSelectedTask(null) 
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
      {'status' === 'loading' ? (
        <div className='w-full h-full flex items-center justify-center'>
          <Loading />
        </div>
      ) : (
        <div>
          <h2 className='text-center text-[32px]'>Today's tasks</h2>
          <div className='absolute bottom-4 right-4 animate-bounce'>
            <Button
              style={{ backgroundColor: '#1677ff' }}
              onClick={handleAddClick}
            >
              <CgMathPlus color='white' size={20} />
            </Button>
          </div>
          <ul className='flex flex-col gap-[5px] p-[20px]'>
            {tasks.map((task, index) => (
              <li
                key={task.id}
                className='border-[1px] border-[#1677ff] rounded-sm p-[3px] bg-[#001529] text-gray-300 font-semibold'
              >
                {console.log(task)}
                <span
                  style={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {index + 1}.{task.title}
                </span>
                <Button
                  onClick={() => handleEditClick(task)}
                  style={{ margin: '0 5px' }}
                >
                  ✏️
                </Button>
                <Button danger onClick={() => dispatch(removeTask(task.id))}>
                  <RiCloseFill />
                </Button>
              </li>
            ))}
          </ul>
        </div>
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
