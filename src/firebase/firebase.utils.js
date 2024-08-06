import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: 'AIzaSyCgaCOl03vf4plSdXfs_mU1gmLPwNpjot4',
  authDomain: 'mail-leads.firebaseapp.com',
  projectId: 'mail-leads',
  storageBucket: 'mail-leads.appspot.com',
  messagingSenderId: '765027549290',
  appId: '1:765027549290:web:ada721e668d6e9ce468a13',
  measurementId: 'G-Z45NJC62VK'
}

export const app = initializeApp(config)
export const database = getFirestore(app)
