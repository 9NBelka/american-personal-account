import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  setNotifications,
  setAccessLevels,
  setTimers,
  setUserAccessLevels,
} from '../store/slices/authSlice';
import { setError } from '../store/slices/adminSlice';

const AuthDataSync = () => {
  const dispatch = useDispatch();
  const { user, userAccessLevels, isAuthInitialized } = useSelector((state) => state.auth);

  // Ждем, пока авторизация инициализируется
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
