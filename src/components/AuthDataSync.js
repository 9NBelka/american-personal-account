import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  setUser,
  setUserRole,
  setNotifications,
  setAccessLevels,
  setTimers,
  setUserAccessLevels,
  setAuthInitialized, // Новое действие для isAuthInitialized
} from '../store/slices/authSlice';
import { fetchUserData, fetchCourses } from '../store/slices/authSlice';
import { setError } from '../store/slices/adminSlice';

const AuthDataSync = () => {
  const dispatch = useDispatch();
  const { user, userAccessLevels, isAuthInitialized } = useSelector((state) => state.auth);

  // Синхронизация состояния авторизации
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        dispatch(setUser(userData));
        const userDataResult = await dispatch(fetchUserData(firebaseUser.uid)).unwrap();
        dispatch(setUserRole(userDataResult.role));
        dispatch(fetchCourses(userDataResult.purchasedCourses));
      } else {
        dispatch(setUser(null));
        dispatch(setUserRole(null));
      }
      // Устанавливаем isAuthInitialized в true после определения состояния авторизации
      dispatch(setAuthInitialized(true));
    });

    return () => unsubscribeAuth();
  }, [dispatch]);

  // Синхронизация accessLevels
  useEffect(() => {
    if (!isAuthInitialized) return;

    const unsubscribeAccessLevels = onSnapshot(
      collection(db, 'accessLevels'),
      (snapshot) => {
        const accessLevelList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        dispatch(setAccessLevels(accessLevelList));
      },
      (error) => {
        dispatch(setError(`Ошибка при загрузке уровней доступа: ${error.message}`));
      },
    );

    return () => unsubscribeAccessLevels();
  }, [dispatch, isAuthInitialized]);

  // Синхронизация timers
  useEffect(() => {
    if (!isAuthInitialized || !user || !userAccessLevels.length) {
      dispatch(setTimers([]));
      return;
    }

    const unsubscribeTimers = onSnapshot(
      collection(db, 'timers'),
      (snapshot) => {
        const timerList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const filteredTimers = timerList.filter((timer) =>
          userAccessLevels.includes(timer.accessLevel),
        );
        dispatch(setTimers(filteredTimers));
      },
      (error) => {
        dispatch(setError(`Ошибка при загрузке таймеров: ${error.message}`));
      },
    );

    return () => unsubscribeTimers();
  }, [user, userAccessLevels, dispatch, isAuthInitialized]);

  // Синхронизация notifications
  useEffect(() => {
    if (!isAuthInitialized || !user) {
      dispatch(setNotifications([]));
      return;
    }

    const unsubscribeNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const notificationList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const filteredNotifications = notificationList.filter((notification) => {
          if (!notification.accessLevels || notification.accessLevels.length === 0) return true;
          return notification.accessLevels.some((level) => userAccessLevels.includes(level));
        });
        dispatch(setNotifications(filteredNotifications));
      },
      (error) => {
        dispatch(setError(`Ошибка при загрузке уведомлений: ${error.message}`));
      },
    );

    return () => unsubscribeNotifications();
  }, [user, userAccessLevels, dispatch, isAuthInitialized]);

  return null;
};

export default AuthDataSync;
