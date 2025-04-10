import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { auth, db, storage, setAdminClaim } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthContext = createContext();
const functions = getFunctions();
const getCourseUserCount = httpsCallable(functions, 'getCourseUserCount');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState({});
  const [lastModules, setLastModules] = useState({});
  const [error, setError] = useState(null);
  const [lastCourseId, setLastCourseId] = useState(() => {
    return localStorage.getItem('lastCourseId') || null;
  });
  const [courses, setCourses] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [readNotifications, setReadNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userAccessLevels, setUserAccessLevels] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [timers, setTimers] = useState([]);

  const fetchUserData = useCallback(async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserName(data.name || '');
      setUserRole(data.role || 'guest');
      setRegistrationDate(data.registrationDate || '');
      setAvatarUrl(data.avatarUrl || null);
      setReadNotifications(data.readNotifications || []);
      const purchasedCourses = data.purchasedCourses || {};

      const accessLevels = Object.values(purchasedCourses)
        .map((course) => course.access)
        .filter((access, index, self) => access && self.indexOf(access) === index);
      setUserAccessLevels(accessLevels);

      setLastModules({});

      return { purchasedCourses, role: data.role };
    }
    setAvatarUrl(null);
    setReadNotifications([]);
    setUserAccessLevels([]);
    setLastModules({});
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
        const sortedModuleKeys = Object.keys(modulesData).sort((a, b) => a.localeCompare(b));

        const modulesArray = sortedModuleKeys.map((moduleId) => ({
          id: moduleId,
          moduleTitle: modulesData[moduleId].title,
          links: modulesData[moduleId].lessons || [],
          unlockDate: modulesData[moduleId].unlockDate || null, // Добавляем unlockDate
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

  const fetchCourseUserCount = useCallback(
    async (courseId) => {
      try {
        const response = await fetch(
          `https://us-central1-k-syndicate.cloudfunctions.net/getCourseUserCount?courseId=${courseId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.count;
      } catch (error) {
        console.error('Error getting number of users:', error);
        return 0;
      }
    },
    [auth],
  );

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
        avatarUrl: null,
        readNotifications: [],
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

        const course = courses.find((c) => c.id === courseId);
        if (course) {
          const validCompletedLessons = {};
          course.modules.forEach((module) => {
            if (courseData.completedLessons[module.id]) {
              validCompletedLessons[module.id] = courseData.completedLessons[module.id].filter(
                (index) => index < module.links.length,
              );
            }
          });

          setCompletedLessons((prev) => ({
            ...prev,
            [courseId]: validCompletedLessons,
          }));
          setProgress((prev) => ({
            ...prev,
            [courseId]: courseData.progress || 0,
          }));
          setLastCourseId(courseId);
          localStorage.setItem('lastCourseId', courseId);
        }
      }
    },
    [user, courses],
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

  const updateUserAvatar = useCallback(
    async (file) => {
      if (!user || !user.uid || !file) return;

      try {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatarUrl: downloadURL });

        setAvatarUrl(downloadURL);
        return downloadURL;
      } catch (error) {
        console.error('Error updating avatar:', error);
        throw error;
      }
    },
    [user, storage],
  );

  const toggleLessonCompletion = useCallback(
    async (courseId, moduleId, lessonIndex, totalLessons) => {
      if (!user || !user.uid) return;

      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const module = course.modules.find((m) => m.id === moduleId);
      if (!module) return;

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
        setLastModules((prev) => ({
          ...prev,
          [courseId]: moduleId,
        }));
      }
    },
    [user, completedLessons, courses],
  );

  const updateLastModule = useCallback(
    async (courseId, moduleId) => {
      if (!user || !user.uid || !courseId) return;

      setLastModules((prev) => ({
        ...prev,
        [courseId]: moduleId,
      }));
    },
    [user],
  );

  const resetPassword = useCallback(
    async (email) => {
      try {
        setIsLoading(true);
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/login`,
        });
        return { success: true, message: 'Password reset email sent! Check your inbox.' };
      } catch (error) {
        let message;
        switch (error.code) {
          case 'auth/invalid-email':
            message = 'Invalid email format.';
            break;
          case 'auth/user-not-found':
            message = 'No user found with this email.';
            break;
          case 'auth/too-many-requests':
            message = 'Too many requests. Please try again later.';
            break;
          default:
            message = `Error: ${error.message}`;
        }
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [auth],
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      if (!user || !user.uid) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentReadNotifications = userDoc.data().readNotifications || [];
        if (!currentReadNotifications.includes(notificationId)) {
          const updatedReadNotifications = [...currentReadNotifications, notificationId];
          await updateDoc(userRef, {
            readNotifications: updatedReadNotifications,
          });
          setReadNotifications(updatedReadNotifications);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setAccessLevels([]); // Очищаем уровни доступа, если пользователь не аутентифицирован
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'accessLevels'),
      (snapshot) => {
        const accessLevelList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccessLevels(accessLevelList);
      },
      (error) => {
        console.error('Ошибка при загрузке уровней доступа:', error);
      },
    );

    return () => unsubscribe();
  }, [user]); // Зависимость от user

  useEffect(() => {
    if (!user || !userAccessLevels.length) {
      setTimers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'timers'),
      (snapshot) => {
        const timerList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredTimers = timerList.filter((timer) =>
          userAccessLevels.includes(timer.accessLevel),
        );
        setTimers(filteredTimers);
      },
      (error) => {
        console.error('Ошибка при загрузке таймеров:', error);
      },
    );

    return () => unsubscribe();
  }, [user, userAccessLevels]);

  useEffect(() => {
    if (!user) {
      setUserAccessLevels([]);
      return;
    }
    fetchUserData(user.uid).then(({ purchasedCourses }) => {
      const accessLevels = Object.values(purchasedCourses)
        .map((course) => course.access)
        .filter((access, index, self) => access && self.indexOf(access) === index);
      setUserAccessLevels(accessLevels);
    });
  }, [user, fetchUserData]);

  useEffect(() => {
    if (!user) {
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

        const filteredNotifications = notificationList.filter((notification) => {
          if (!notification.accessLevels || notification.accessLevels.length === 0) {
            return true;
          }
          return notification.accessLevels.some((level) => userAccessLevels.includes(level));
        });

        setNotifications((prev) =>
          JSON.stringify(prev) !== JSON.stringify(filteredNotifications)
            ? filteredNotifications
            : prev,
        );
      },
      (error) => {
        console.error('Ошибка при загрузке уведомлений:', error);
      },
    );

    return () => unsubscribe();
  }, [user, userAccessLevels]);

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
          setLastModules({});

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
        setLastModules({});
        setCourses([]);
        setLastCourseId(null);
        setAvatarUrl(null);
        setReadNotifications([]);
        setUserAccessLevels([]);
        setAccessLevels([]);
        setTimers([]);
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
    lastModules,
    courses,
    notifications,
    setProgress,
    setCompletedLessons,
    updateCourseData,
    updateUserName,
    updateUserPassword,
    toggleLessonCompletion,
    login,
    signUp,
    error,
    lastCourseId,
    setLastCourseId,
    fetchCourseUserCount,
    avatarUrl,
    updateUserAvatar,
    resetPassword,
    readNotifications,
    markNotificationAsRead,
    userAccessLevels,
    accessLevels,
    timers,
    updateLastModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
