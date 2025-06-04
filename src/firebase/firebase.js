import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBmO-vgGaCpoNUH3Adqnc4IBWx9-MoDgXo',
  authDomain: 'selfos-auth.firebaseapp.com',
  projectId: 'selfos-auth',
  storageBucket: 'selfos-auth.firebasestorage.app',
  messagingSenderId: '320303550707',
  appId: '1:320303550707:web:dc2a757a057d6eb5ea6786',
  measurementId: 'G-PWHEXNXKFF',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

export const db = getFirestore(app)
