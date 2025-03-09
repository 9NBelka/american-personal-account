import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [lastCourseId, setLastCourseId] = useState(null);

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
          console.log(`Updated course data for ${courseId}:`, {
            completedLessons: courseData.completedLessons,
            progress: courseData.progress,
          });
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
            const purchasedCourses = userDoc.data().purchasedCourses || {};
            const defaultCourseId = Object.keys(purchasedCourses)[0] || 'architecture';
            const courseData = purchasedCourses[defaultCourseId] || {
              completedLessons: {},
              progress: 0,
            };
            setCompletedLessons({ [defaultCourseId]: courseData.completedLessons || {} });
            setProgress({ [defaultCourseId]: courseData.progress || 0 });
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
