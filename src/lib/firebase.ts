// YOUR REAL CONFIG from Firebase Console
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDO-znI5n1C_RzGCDGurF0yeQqX27kJM24",
  authDomain: "indiasfood-c89eb.firebaseapp.com",
  projectId: "indiasfood-c89eb",
  storageBucket: "indiasfood-c89eb.firebasestorage.app",
  messagingSenderId: "84463068924",
  appId: "1:84463068924:web:dd3e1881ab80068a31d979"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
