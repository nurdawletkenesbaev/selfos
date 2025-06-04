import React, { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom'
import './App.css'
import Home from './pages/home/Home'
import MainLayout from './components/layout/MainLayout'
import TodaysTasks from './pages/tasks/TodaysTasks'
import Pomodoro from './pages/pomodoro/Pomodoro'
import History from './pages/history/History'
import Statistics from './pages/statistics/Statistics'
import Goals from './pages/goals/Goals'
import AboutApp from './pages/about-app/AboutApp'
import Settings from './pages/settings/Settings'
import SignUp from './auth/pages/SignUp'
import SignIn from './auth/pages/SignIn'
import { onAuthStateChanged } from 'firebase/auth'
import ForgotPassword from './auth/pages/ForgotPassword'
import Loading from './pages/Loading'
import { auth } from './firebase/firebase'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) return <Loading />

  return (
    <Router>
      <Routes>
        <Route
          path='/signup'
          element={!user ? <SignUp /> : <Navigate to='/' />}
        />
        <Route
          path='/signin'
          element={!user ? <SignIn /> : <Navigate to='/' />}
        />
        <Route
          path='/forgotpassword'
          element={!user ? <ForgotPassword /> : <Navigate to='/' />}
        />

        <Route
          path='/'
          element={user ? <MainLayout /> : <Navigate to='/signup' />}
        >
          <Route path='/home' element={<Home />} />
          <Route path='/todays-tasks' element={<TodaysTasks />} />
          <Route path='/pomodoro-timer' element={<Pomodoro />} />
          <Route path='/history' element={<History />} />
          <Route path='/statistics' element={<Statistics />} />
          <Route path='/goals' element={<Goals />} />
          <Route path='/about-app' element={<AboutApp />} />
          <Route path='/settings' element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
