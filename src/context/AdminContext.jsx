// context/AdminContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext'; // Импортируем AuthContext для доступа к user и userRole

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user, userRole } = useAuth(); // Используем AuthContext для авторизации
  const [users, setUsers] = useState([]); // Список всех пользователей
  const [courses, setCourses] = useState([]); // Список всех курсов
  const [orders, setOrders] = useState([]); // Список всех заказов
  const [error, setError] = useState(null);

  // Получение всех пользователей
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

  // Получение всех заказов (предполагается, что у вас есть коллекция orders)
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

  // Добавление нового пользователя
  const addUser = useCallback(
    async (userData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять пользователей');
      }
      try {
        const docRef = await addDoc(collection(db, 'users'), userData);
        setUsers((prev) => [...prev, { id: docRef.id, ...userData }]);
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
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updatedData } : u)));
      } catch (error) {
        throw new Error('Ошибка при обновлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление пользователя
  const deleteUser = useCallback(
    async (userId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять пользователей');
      }
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch (error) {
        throw new Error('Ошибка при удалении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового курса
  const addCourse = useCallback(
    async (courseData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять курсы');
      }
      try {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        setCourses((prev) => [...prev, { id: docRef.id, ...courseData }]);
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
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      } catch (error) {
        throw new Error('Ошибка при удалении курса: ' + error.message);
      }
    },
    [userRole],
  );

  const value = {
    users,
    courses,
    orders,
    fetchAllUsers,
    fetchAllCourses,
    fetchAllOrders,
    addUser,
    updateUser,
    deleteUser,
    addCourse,
    updateCourse,
    deleteCourse,
    error,
    setError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
