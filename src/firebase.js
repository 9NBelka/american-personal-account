// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDDNQg46t_eyi5vaaGf97kQPHI0qz2D8j4',
  authDomain: 'k-syndicate.firebaseapp.com',
  projectId: 'k-syndicate',
  storageBucket: 'k-syndicate.firebasestorage.app',
  messagingSenderId: '348161030150',
  appId: '1:348161030150:web:2d544e1a390004883bab87',
  measurementId: 'G-B1HF4BS8KP',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
