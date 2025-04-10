import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Проверка на наличие всех обязательных ключей
const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  throw new Error(`Отсутствуют обязательные переменные окружения: ${missingKeys.join(', ')}`);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions();
const setAdminClaim = httpsCallable(functions, 'setAdminClaim');

// Получаем UID из переменной окружения
const adminUid = import.meta.env.VITE_ADMIN_UID;
if (!adminUid) {
  throw new Error('Переменная окружения VITE_ADMIN_UID не установлена');
}

// Оборачиваем вызов в асинхронную функцию
(async () => {
  try {
    await setAdminClaim({ uid: adminUid });
    console.log('Custom claim установлен для UID:', adminUid);
  } catch (error) {
    console.error('Ошибка при установке custom claim:', error);
  }
})();

export { db, auth, storage };
