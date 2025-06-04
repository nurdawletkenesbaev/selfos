// services/taskService.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const tasksRef = collection(db, 'tasks')

export const fetchTasks = async () => {
  const snapshot = await getDocs(tasksRef)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const addTask = async (task) => {
  const docRef = await addDoc(tasksRef, task)
  return { id: docRef.id, ...task }
}

export const deleteTask = async (id) => {
  await deleteDoc(doc(db, 'tasks', id))
  return id
}

export const updateTask = async ({ id, data }) => {
  await updateDoc(doc(db, 'tasks', id), data)
  return { id, ...data }
}
