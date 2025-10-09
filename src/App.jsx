import React, { useEffect, useState } from 'react'
import {
  Navigate, Route, BrowserRouter as Router, Routes,
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
import ChallengeDetail from './pages/challenges/components/challengeDetail'
import CreateChallenge from './pages/challenges/components/createChallenge'
import Challenges from './pages/challenges/challenges'
import { useAuth } from './firebase/AuthContext'
import DayDetail from './pages/history/components/DayDetail'

// Yangi sahifalar
import Review from './pages/vocabulary/Review'
import Vocabulary from './pages/vocabulary/Vocabulary'

const App = () => {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
      else setUserId(null)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <Loading />

  return (
    <Router>
      <Routes>
        {/* Auth yo‘llari */}
        <Route path='/signup' element={!userId ? <SignUp /> : <Navigate to='/home' />} />
        <Route path='/signin' element={!userId ? <SignIn /> : <Navigate to='/home' />} />
        <Route path='/forgotpassword' element={!userId ? <ForgotPassword /> : <Navigate to='/home' />} />

        {/* Asosiy layout */}
        <Route path='/' element={userId ? <MainLayout /> : <Navigate to='/signin' />}>
          <Route index element={<Navigate to='/home' />} />
          <Route path='/home' element={<Home />} />
          <Route path='/todays-tasks' element={<TodaysTasks userId={currentUser?.uid} />} />
          <Route path='/pomodoro-timer' element={<Pomodoro />} />
          <Route path='/history' element={<History />} />
          <Route path='/day-detail/:date' element={<DayDetail />} />
          <Route path='/statistics' element={<Statistics />} />
          <Route path='/goals' element={<Goals />} />
          <Route path='/about-app' element={<AboutApp />} />
          <Route path='/settings' element={<Settings />} />

          {/* Challenges */}
          <Route path='/challenges' element={<Challenges userId={userId} />} />
          <Route path='/challenges/create' element={<CreateChallenge userId={userId} />} />
          <Route path='/challenges/:challengeId' element={<ChallengeDetail userId={userId} />} />

          {/* Vocabulary (spaced repetition) */}
          <Route path='/vocabulary' element={<Vocabulary userId={userId} />} />
          <Route path='/vocabulary/review' element={<Review userId={userId} />} />
        </Route>

        {/* 404 → home */}
        <Route path='*' element={<Navigate to='/home' />} />
      </Routes>
    </Router>
  )
}

export default App