import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState({});
  const [error, setError] = useState(null);

  // Функция для обновления данных курса
  const updateCourseData = async (courseId) => {
    if (user && user.uid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const courses = userDoc.data().courses || {};
          const courseData = courses[courseId] || { completedLessons: {}, progress: 0 };
          setCompletedLessons(courseData.completedLessons || {});
          setProgress(courseData.progress || 0);
          console.log(`Updated course data for ${courseId}:`, {
            completedLessons: courseData.completedLessons,
            progress: courseData.progress,
          });
        }
      } catch (error) {
        console.error('Ошибка при обновлении данных курса:', error);
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed, firebaseUser:', firebaseUser);
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('User document data:', userDoc.data());
          if (userDoc.exists()) {
            setUser(userData);
            setUserRole(userDoc.data().role);
            // Изначально загружаем данные для первого доступного курса (например, architecture)
            const courses = userDoc.data().courses || {};
            const defaultCourseId = Object.keys(courses)[0] || 'architecture';
            const courseData = courses[defaultCourseId] || { completedLessons: {}, progress: 0 };
            setCompletedLessons(courseData.completedLessons || {});
            setProgress(courseData.progress || 0);
          } else {
            setUser(userData);
            setUserRole('guest');
            setCompletedLessons({});
            setProgress(0);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setCompletedLessons({});
        setProgress(0);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userRole,
    isLoading,
    progress,
    completedLessons,
    setProgress,
    setCompletedLessons,
    updateCourseData, // Добавляем функцию для обновления данных курса
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
