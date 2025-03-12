import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState({});
  const [error, setError] = useState(null);
  const [lastCourseId, setLastCourseId] = useState(() => {
    return localStorage.getItem('lastCourseId') || null;
  });

  const updateCourseData = useCallback(
    async (courseId) => {
      if (!user || !user.uid || !courseId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const purchasedCourses = userDoc.data().purchasedCourses || {};
          const courseData = purchasedCourses[courseId] || {
            completedLessons: {},
            progress: 0,
          };
          setCompletedLessons((prev) => ({
            ...prev,
            [courseId]: courseData.completedLessons || {},
          }));
          setProgress((prev) => ({
            ...prev,
            [courseId]: courseData.progress || 0,
          }));
          setLastCourseId(courseId);
          localStorage.setItem('lastCourseId', courseId);
        }
      } catch (error) {
        console.error('Ошибка при обновлении данных курса:', error);
        setError(error.message);
      }
    },
    [user],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userData);
            setUserRole(userDoc.data().role);
            const purchasedCourses = userDoc.data().purchasedCourses || {};

            // Инициализируем progress для всех курсов
            const initialProgress = {};
            const initialCompletedLessons = {};
            Object.keys(purchasedCourses).forEach((courseId) => {
              const courseData = purchasedCourses[courseId] || {
                completedLessons: {},
                progress: 0,
              };
              initialProgress[courseId] = courseData.progress || 0;
              initialCompletedLessons[courseId] = courseData.completedLessons || {};
            });
            setProgress(initialProgress);
            setCompletedLessons(initialCompletedLessons);

            const defaultCourseId =
              localStorage.getItem('lastCourseId') ||
              Object.keys(purchasedCourses)[0] ||
              'architecture';
            setLastCourseId(defaultCourseId);
            localStorage.setItem('lastCourseId', defaultCourseId);
          } else {
            setUser(userData);
            setUserRole('guest');
            setCompletedLessons({});
            setProgress({});
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setCompletedLessons({});
        setProgress({});
        setLastCourseId(null);
        localStorage.removeItem('lastCourseId');
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
    updateCourseData,
    error,
    lastCourseId,
    setLastCourseId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
