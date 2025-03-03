// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, getIdToken } from 'firebase/auth';

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

// Настраиваем персистентность сессии
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Персистентность сессии настроена на локальное хранилище');
  })
  .catch((error) => {
    console.error('Ошибка настройки персистентности:', error);
  });

// Экспортируем функцию для получения ID токена (для передачи между доменами)
export const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await getIdToken(user, true); // true для принудительного обновления токена
    return token;
  }
  return null;
};

export { auth, db };
