import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState({});
  const [error, setError] = useState(null);
  const [lastCourseId, setLastCourseId] = useState(() => {
    return localStorage.getItem('lastCourseId') || null;
  });
  const [courses, setCourses] = useState([]);

  const fetchUserData = useCallback(async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserName(data.name || '');
      setUserRole(data.role || 'guest');
      setRegistrationDate(data.registrationDate || '');
      const purchasedCourses = data.purchasedCourses || {};
      return { purchasedCourses, role: data.role };
    }
    return { purchasedCourses: {}, role: 'guest' };
  }, []);

  const fetchCourses = useCallback(async (purchasedCourses) => {
    const courseDocs = await getDocs(collection(db, 'courses'));
    if (courseDocs.empty) return [];

    const courseList = await Promise.all(
      courseDocs.docs.map(async (doc) => {
        const courseData = doc.data();
        const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
        const courseAccess = purchasedCourses[doc.id]?.access || 'denied';
        const isAccessible = courseAccess !== 'denied' && hasModules;

        const modulesData = courseData.modules || {};
        const sortedModuleKeys = Object.keys(modulesData).sort((a, b) => {
          const aNumber = parseInt(a.replace('module', ''), 10);
          const bNumber = parseInt(b.replace('module', ''), 10);
          return aNumber - bNumber;
        });
        const modulesArray = sortedModuleKeys.map((moduleId) => ({
          id: moduleId,
          moduleTitle: modulesData[moduleId].title,
          links: modulesData[moduleId].lessons || [],
        }));

        const totalLessons = modulesArray.reduce((sum, module) => sum + module.links.length, 0);
        const courseCompletedLessons = purchasedCourses[doc.id]?.completedLessons || {};
        const completedLessonsCount = Object.values(courseCompletedLessons).reduce(
          (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
          0,
        );

        const allLessons = modulesArray.flatMap((module) => module.links);
        const totalMinutes = allLessons.reduce((sum, lesson) => {
          const time = parseInt(lesson.videoTime, 10) || 0;
          return sum + (isNaN(time) ? 0 : time);
        }, 0);
        const totalDuration =
          totalMinutes >= 60
            ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
            : `${totalMinutes}m`;

        return {
          id: doc.id,
          title:
            courseData.title || doc.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          category: courseData.category || 'Uncategorized',
          gitHubRepLink: courseData.gitHubRepLink,
          description: courseData.description || ' ',
          available: isAccessible,
          access: courseAccess,
          modules: modulesArray,
          totalLessons,
          completedLessonsCount,
          totalDuration,
        };
      }),
    );
    return courseList;
  }, []);

  // Функция для входа
  const login = useCallback(
    async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth],
  );

  const signUp = useCallback(
    async (name, lastName, email, password) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const registrationDate = new Date().toISOString();
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        lastName: lastName || '',
        email,
        role: 'guest',
        registrationDate,
      });

      await updateProfile(user, {
        displayName: `${name} ${lastName || ''}`.trim(),
      });
    },
    [auth, db],
  );

  const updateCourseData = useCallback(
    async (courseId) => {
      if (!user || !user.uid || !courseId) return;

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
    },
    [user],
  );

  const updateUserName = useCallback(
    async (newName) => {
      if (!user || !user.uid) return;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: newName });
      setUserName(newName);
    },
    [user],
  );

  const updateUserPassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!user || !user.email) return;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    },
    [user],
  );

  const toggleLessonCompletion = useCallback(
    async (courseId, moduleId, lessonIndex, totalLessons) => {
      if (!user || !user.uid) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentCompletedLessons = completedLessons[courseId] || {};
        const currentModuleLessons = currentCompletedLessons[moduleId] || [];
        const newLessons = currentModuleLessons.includes(lessonIndex)
          ? currentModuleLessons.filter((index) => index !== lessonIndex)
          : [...currentModuleLessons, lessonIndex];

        const updatedCompletedLessons = {
          ...currentCompletedLessons,
          [moduleId]: newLessons,
        };

        const completedLessonsCount = Object.values(updatedCompletedLessons).reduce(
          (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
          0,
        );
        const newProgress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

        await updateDoc(userRef, {
          [`purchasedCourses.${courseId}.completedLessons`]: updatedCompletedLessons,
          [`purchasedCourses.${courseId}.progress`]: Math.round(newProgress),
        });

        setCompletedLessons((prev) => ({
          ...prev,
          [courseId]: updatedCompletedLessons,
        }));
        setProgress((prev) => ({
          ...prev,
          [courseId]: newProgress,
        }));
      }
    },
    [user, completedLessons],
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
          const { purchasedCourses, role } = await fetchUserData(firebaseUser.uid);
          setUser(userData);
          setUserRole(role);

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

          const courseList = await fetchCourses(purchasedCourses);
          setCourses(courseList);

          const defaultCourseId =
            localStorage.getItem('lastCourseId') ||
            Object.keys(purchasedCourses)[0] ||
            'architecture';
          setLastCourseId(defaultCourseId);
          localStorage.setItem('lastCourseId', defaultCourseId);
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserName('');
        setRegistrationDate('');
        setCompletedLessons({});
        setProgress({});
        setCourses([]);
        setLastCourseId(null);
        localStorage.removeItem('lastCourseId');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData, fetchCourses]);

  const value = {
    user,
    userRole,
    userName,
    registrationDate,
    isLoading,
    progress,
    completedLessons,
    courses,
    setProgress,
    setCompletedLessons,
    updateCourseData,
    updateUserName,
    updateUserPassword,
    toggleLessonCompletion,
    login, // Добавляем функцию login
    signUp, // Добавляем функцию signUp
    error,
    lastCourseId,
    setLastCourseId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
