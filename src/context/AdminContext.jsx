// context/AdminContext.js
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db, auth } from '../firebase'; // Добавляем auth
import {
  collection,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    try {
      const userDocs = await getDocs(collection(db, 'users'));
      const userList = userDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (error) {
      setError('Ошибка при загрузке пользователей: ' + error.message);
    }
  }, []);

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

  useEffect(() => {
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
  }, []);

  // context/AdminContext.js
  // context/AdminContext.js
  // context/AdminContext.js
  // context/AdminContext.js
  const addUser = useCallback(
    async (userData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять пользователей');
      }
      try {
        console.log('Текущий пользователь:', auth.currentUser);
        if (!auth.currentUser) {
          throw new Error('Пользователь не авторизован');
        }

        const token = await auth.currentUser.getIdToken(true);
        console.log('Обновлённый токен:', token);

        const functions = getFunctions(undefined, 'us-central1');
        const createUserFunction = httpsCallable(functions, 'createUser');
        const result = await createUserFunction(userData);
        setUsers((prev) => [...prev, { ...userData, id: result.data.uid }]);
        return result.data;
      } catch (error) {
        console.error('Ошибка в addUser:', error);
        throw new Error('Ошибка при добавлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  const updateUser = useCallback(
    async (userId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять пользователей');
      }
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedData);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updatedData } : u)));
      } catch (error) {
        throw new Error('Ошибка при обновлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  const deleteUser = useCallback(
    async (userId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять пользователей');
      }
      try {
        const functions = getFunctions();
        const deleteUserFunction = httpsCallable(functions, 'deleteUser');
        await deleteUserFunction({ userId });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch (error) {
        throw new Error('Ошибка при удалении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

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

  const deleteCourse = useCallback(
    async (courseId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять курсы');
      }
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      } catch (error) {
        throw new Error('Ошибка при удалении курса: ' + error.message);
      }
    },
    [userRole],
  );

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
    orders,
    notifications,
    fetchAllUsers,
    fetchAllCourses,
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
