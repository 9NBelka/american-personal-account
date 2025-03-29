import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [products, setProducts] = useState([]); // Новое состояние для продуктов
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Подписка на пользователей в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      },
      (error) => {
        setError('Ошибка при загрузке пользователей: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Получение всех курсов
  const fetchAllCourses = useCallback(async () => {
    try {
      const courseDocs = await getDocs(collection(db, 'courses'));
      const courseList = courseDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(courseList);
    } catch (error) {
      setError('Ошибка при загрузке курсов: ' + error.message);
    }
  }, []);

  // Получение всех продуктов
  const fetchAllProducts = useCallback(async () => {
    try {
      const productDocs = await getDocs(collection(db, 'products'));
      const productList = productDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    } catch (error) {
      setError('Ошибка при загрузке продуктов: ' + error.message);
    }
  }, []);

  // Получение всех заказов
  const fetchAllOrders = useCallback(async () => {
    try {
      const orderDocs = await getDocs(collection(db, 'orders'));
      const orderList = orderDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(orderList);
    } catch (error) {
      setError('Ошибка при загрузке заказов: ' + error.message);
    }
  }, []);

  // Подписка на уведомления в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setNotifications([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const notificationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationList);
      },
      (error) => {
        setError('Ошибка при загрузке уведомлений: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Добавление нового пользователя через Cloud Function
  const addUser = useCallback(
    async (userData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять пользователей');
      }
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(
          'https://us-central1-k-syndicate.cloudfunctions.net/addNewUser',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(userData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка при добавлении пользователя');
        }

        const result = await response.json();

        const actionCodeSettings = {
          url: 'https://lms-jet-one.vercel.app/login',
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, userData.email, actionCodeSettings);

        return result;
      } catch (error) {
        throw new Error('Ошибка при добавлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Обновление пользователя
  const updateUser = useCallback(
    async (userId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять пользователей');
      }
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedData);
      } catch (error) {
        throw new Error('Ошибка при обновлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление пользователя через Cloud Function
  const deleteUser = useCallback(
    async (userId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять пользователей');
      }
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(
          'https://us-central1-k-syndicate.cloudfunctions.net/deleteUser',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ userId }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка при удалении пользователя');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new Error('Ошибка при удалении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового курса с кастомным ID
  const addCourse = useCallback(
    async (courseData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять курсы');
      }
      try {
        const courseRef = doc(db, 'courses', courseData.id);
        await setDoc(courseRef, courseData);
        setCourses((prev) => [...prev, courseData]);
      } catch (error) {
        throw new Error('Ошибка при добавлении курса: ' + error.message);
      }
    },
    [userRole],
  );

  // Обновление курса
  const updateCourse = useCallback(
    async (courseId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять курсы');
      }
      try {
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, updatedData);
        setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updatedData } : c)));
      } catch (error) {
        throw new Error('Ошибка при обновлении курса: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление курса
  const deleteCourse = useCallback(
    async (courseId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять курсы');
      }
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const purchasedCourses = userData.purchasedCourses || {};
          if (purchasedCourses[courseId]) {
            const updatedPurchasedCourses = { ...purchasedCourses };
            delete updatedPurchasedCourses[courseId];
            await updateDoc(doc(db, 'users', userDoc.id), {
              purchasedCourses: updatedPurchasedCourses,
            });
          }
        });
        await Promise.all(updatePromises);
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      } catch (error) {
        throw new Error('Ошибка при удалении курса: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового уведомления
  const addNotification = useCallback(
    async (notificationData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять уведомления');
      }
      try {
        await addDoc(collection(db, 'notifications'), notificationData);
      } catch (error) {
        throw new Error('Ошибка при добавлении уведомления: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление уведомления
  const deleteNotification = useCallback(
    async (notificationId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять уведомления');
      }
      try {
        await deleteDoc(doc(db, 'notifications', notificationId));
      } catch (error) {
        throw new Error('Ошибка при удалении уведомления: ' + error.message);
      }
    },
    [userRole],
  );

  const value = {
    users,
    courses,
    products, // Добавляем products в контекст
    orders,
    notifications,
    fetchAllCourses,
    fetchAllProducts, // Добавляем fetchAllProducts в контекст
    fetchAllOrders,
    addUser,
    updateUser,
    deleteUser,
    addCourse,
    updateCourse,
    deleteCourse,
    addNotification,
    deleteNotification,
    error,
    setError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
