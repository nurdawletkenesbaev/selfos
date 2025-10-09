import { useEffect, useState } from 'react'
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

export const useWords = (userId) => {
  const [todayWords, setTodayWords] = useState([])
  const [loading, setLoading] = useState(true)

  const INTERVALS = [1, 2, 3, 4, 7, 14, 30]

  // bugungi reviewlar
  useEffect(() => {
    if (!userId) return
    const fetchToday = async () => {
      setLoading(true)
      const q = query(
        collection(db, 'users', userId, 'words'),
        where('nextReviewDate', '<=', Timestamp.fromDate(new Date()))
      )
      const snap = await getDocs(q)
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setTodayWords(list)
      setLoading(false)
    }
    fetchToday()
  }, [userId])

  // review tugaganda
  const updateWordAfterReview = async (wordId, correct) => {
    const ref = doc(db, 'users', userId, 'words', wordId)
    const snap = await getDocs(collection(db, 'users', userId, 'words'))
    const word = snap.docs.find((d) => d.id === wordId)?.data() || {}
    const currentDay = word.currentDay || 0
    const nextIndex = correct
      ? Math.min(currentDay + 1, INTERVALS.length - 1)
      : 0
    const nextDays = INTERVALS[nextIndex]
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + nextDays)

    await updateDoc(ref, {
      currentDay: nextIndex,
      nextReviewDate: Timestamp.fromDate(nextReview),
    })

    // history
    await addDoc(collection(db, 'users', userId, 'words', wordId, 'history'), {
      reviewedAt: serverTimestamp(),
      correct,
      interval: nextDays,
    })
  }

  return { todayWords, loading, updateWordAfterReview }
}