import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  setUsers,
  setProducts,
  setAccessLevels,
  setTimers,
  setDiscountPresets,
  setPromoCodes,
  setNotifications,
  setCourses,
  setOrders,
  setError,
} from '../store/slices/adminSlice';

const AdminDataSync = () => {
  const dispatch = useDispatch();
  const { user, userRole, isAuthInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthInitialized || !user || userRole !== 'admin') return;

    const unsubscribes = [];

    const collections = [
      { name: 'users', action: setUsers },
      { name: 'products', action: setProducts },
      { name: 'accessLevels', action: setAccessLevels },
      { name: 'timers', action: setTimers },
      { name: 'discountPresets', action: setDiscountPresets },
      { name: 'promoCodes', action: setPromoCodes },
      { name: 'notifications', action: setNotifications },
      { name: 'courses', action: setCourses },
      { name: 'orders', action: setOrders },
    ];

    collections.forEach(({ name, action }) => {
      const unsubscribe = onSnapshot(
        collection(db, name),
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          dispatch(action(data));
        },
        (error) => {
          dispatch(setError(`Ошибка при загрузке ${name}: ${error.message}`));
        },
      );
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [user, userRole, dispatch, isAuthInitialized]);

  return null;
};

export default AdminDataSync;
