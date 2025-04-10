import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [timers, setTimers] = useState([]);
  const [discountPresets, setDiscountPresets] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]); // Новое состояние для промокодов
  const [error, setError] = useState(null);

  // Подписка на пользователей в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      },
      (error) => {
        setError('Ошибка при загрузке пользователей: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Подписка на продукты в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setProducts([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      },
      (error) => {
        setError('Ошибка при загрузке продуктов: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Подписка на уровни доступа в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setAccessLevels([]);
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
        setError('Ошибка при загрузке уровней доступа: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Подписка на таймеры в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
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
        setTimers(timerList);
      },
      (error) => {
        setError('Ошибка при загрузке таймеров: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Подписка на пресеты скидок в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setDiscountPresets([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'discountPresets'),
      (snapshot) => {
        const presetList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDiscountPresets(presetList);
      },
      (error) => {
        setError('Ошибка при загрузке пресетов скидок: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Подписка на промокоды в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
      setPromoCodes([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'promoCodes'),
      (snapshot) => {
        const promoCodeList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPromoCodes(promoCodeList);

        // Проверяем промокоды на истечение срока действия
        promoCodeList.forEach((promo) => {
          if (promo.expiryDate && promo.available) {
            const expiry = new Date(promo.expiryDate);
            const now = new Date();
            if (now >= expiry) {
              // Отключаем промокод, если срок действия истек
              const promoRef = doc(db, 'promoCodes', promo.id);
              updateDoc(promoRef, { available: false }).catch((error) => {
                console.error('Ошибка при отключении промокода:', error);
              });
            }
          }
        });
      },
      (error) => {
        setError('Ошибка при загрузке промокодов: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

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

  // Получение всех продуктов
  const fetchAllProducts = useCallback(async () => {
    try {
      const productDocs = await getDocs(collection(db, 'products'));
      const productList = productDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    } catch (error) {
      setError('Ошибка при загрузке продуктов: ' + error.message);
    }
  }, []);

  // Получение всех заказов
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

  // Подписка на уведомления в реальном времени
  useEffect(() => {
    if (!user || userRole !== 'admin') {
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
        setNotifications(notificationList);
      },
      (error) => {
        setError('Ошибка при загрузке уведомлений: ' + error.message);
      },
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // Добавление нового пользователя через Cloud Function
  const addUser = useCallback(
    async (userData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять пользователей');
      }
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(
          'https://us-central1-k-syndicate.cloudfunctions.net/addNewUser',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(userData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка при добавлении пользователя');
        }

        const result = await response.json();

        const actionCodeSettings = {
          url: 'https://lms-jet-one.vercel.app/login',
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, userData.email, actionCodeSettings);

        return result;
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
      } catch (error) {
        throw new Error('Ошибка при обновлении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление пользователя через Cloud Function
  const deleteUser = useCallback(
    async (userId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять пользователей');
      }
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(
          'https://us-central1-k-syndicate.cloudfunctions.net/deleteUser',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ userId }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка при удалении пользователя');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new Error('Ошибка при удалении пользователя: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового уровня доступа
  const addAccessLevel = useCallback(
    async (accessLevelData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять уровни доступа');
      }
      try {
        const accessLevelRef = doc(db, 'accessLevels', accessLevelData.id);
        await setDoc(accessLevelRef, accessLevelData);
      } catch (error) {
        throw new Error('Ошибка при добавлении уровня доступа: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового курса с кастомным ID
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

  // Добавление нового продукта с кастомным ID
  const addProduct = useCallback(
    async (productData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять продукты');
      }
      try {
        const productRef = doc(db, 'products', productData.id);
        await setDoc(productRef, productData);
      } catch (error) {
        throw new Error('Ошибка при добавлении продукта: ' + error.message);
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

        const oldCourse = courses.find((c) => c.id === courseId);
        const oldModules = oldCourse?.modules || {};
        const newModules = updatedData.modules || {};

        const deletedModuleIds = Object.keys(oldModules).filter(
          (moduleId) => !newModules[moduleId],
        );
        const updatedModuleIds = Object.keys(newModules);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const purchasedCourses = userData.purchasedCourses || {};
          if (!purchasedCourses[courseId]) return;

          let updatedCompletedLessons = { ...purchasedCourses[courseId].completedLessons };

          deletedModuleIds.forEach((moduleId) => {
            if (updatedCompletedLessons[moduleId]) {
              delete updatedCompletedLessons[moduleId];
            }
          });

          updatedModuleIds.forEach((moduleId) => {
            const oldLessons = oldModules[moduleId]?.lessons || [];
            const newLessons = newModules[moduleId]?.lessons || [];
            const newLessonCount = newLessons.length;

            if (updatedCompletedLessons[moduleId]) {
              updatedCompletedLessons[moduleId] = updatedCompletedLessons[moduleId].filter(
                (lessonIndex) => lessonIndex < newLessonCount,
              );
              if (updatedCompletedLessons[moduleId].length === 0) {
                delete updatedCompletedLessons[moduleId];
              }
            }
          });

          const totalLessons = Object.values(newModules).reduce(
            (sum, module) => sum + (module.lessons?.length || 0),
            0,
          );

          const completedLessonsCount = Object.values(updatedCompletedLessons).reduce(
            (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
            0,
          );

          const newProgress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

          await updateDoc(doc(db, 'users', userDoc.id), {
            [`purchasedCourses.${courseId}.completedLessons`]: updatedCompletedLessons,
            [`purchasedCourses.${courseId}.progress`]: Math.round(newProgress),
            ...(oldCourse.access !== updatedData.access && {
              [`purchasedCourses.${courseId}.access`]: updatedData.access,
            }),
          });
        });

        await Promise.all(updatePromises);

        setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updatedData } : c)));
      } catch (error) {
        throw new Error('Ошибка при обновлении курса: ' + error.message);
      }
    },
    [userRole, courses],
  );

  // Обновление продукта
  const updateProduct = useCallback(
    async (productId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять продукты');
      }
      try {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, updatedData);
      } catch (error) {
        throw new Error('Ошибка при обновлении продукта: ' + error.message);
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
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const purchasedCourses = userData.purchasedCourses || {};
          if (purchasedCourses[courseId]) {
            const updatedPurchasedCourses = { ...purchasedCourses };
            delete updatedPurchasedCourses[courseId];
            await updateDoc(doc(db, 'users', userDoc.id), {
              purchasedCourses: updatedPurchasedCourses,
            });
          }
        });
        await Promise.all(updatePromises);
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      } catch (error) {
        throw new Error('Ошибка при удалении курса: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление продукта
  const deleteProduct = useCallback(
    async (productId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять продукты');
      }
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (error) {
        throw new Error('Ошибка при удалении продукта: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового уведомления
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

  // Удаление уведомления
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

  // Добавление нового таймера
  const addTimer = useCallback(
    async (timerData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять таймеры');
      }
      try {
        await addDoc(collection(db, 'timers'), timerData);
      } catch (error) {
        throw new Error('Ошибка при добавлении таймера: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление таймера
  const deleteTimer = useCallback(
    async (timerId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять таймеры');
      }
      try {
        await deleteDoc(doc(db, 'timers', timerId));
      } catch (error) {
        throw new Error('Ошибка при удалении таймера: ' + error.message);
      }
    },
    [userRole],
  );

  // Добавление нового пресета скидок
  const addDiscountPreset = useCallback(
    async (presetData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять пресеты скидок');
      }
      try {
        const presetRef = doc(db, 'discountPresets', presetData.id);
        await setDoc(presetRef, { ...presetData, isActive: false });
      } catch (error) {
        throw new Error('Ошибка при добавлении пресета скидок: ' + error.message);
      }
    },
    [userRole],
  );

  // Обновление пресета скидок
  const updateDiscountPreset = useCallback(
    async (presetId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять пресеты скидок');
      }
      try {
        const presetToUpdate = discountPresets.find((p) => p.id === presetId);
        if (!presetToUpdate) {
          throw new Error('Пресет не найден');
        }

        const presetRef = doc(db, 'discountPresets', presetId);
        await updateDoc(presetRef, updatedData);

        // Если пресет активен, обновляем discountedPrice и discountPercent у товаров
        if (presetToUpdate.isActive) {
          // Сначала сбрасываем discountedPrice и discountPercent у всех товаров из старого пресета
          const resetPromises = presetToUpdate.discountItems.map((item) => {
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, {
              discountedPrice: null,
              discountPercent: null,
            });
          });
          await Promise.all(resetPromises);

          // Затем применяем новые скидки
          const updatePromises = updatedData.discountItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return Promise.resolve();

            const originalPrice = product.priceProduct;
            const discountedPrice = originalPrice - (originalPrice * item.discountPercent) / 100;
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, {
              discountedPrice: discountedPrice.toFixed(2),
              discountPercent: item.discountPercent,
            });
          });
          await Promise.all(updatePromises);
        }
      } catch (error) {
        throw new Error('Ошибка при обновлении пресета: ' + error.message);
      }
    },
    [userRole, discountPresets, products],
  );

  // Удаление пресета скидок
  const deleteDiscountPreset = useCallback(
    async (presetId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять пресеты скидок');
      }
      try {
        const presetToDelete = discountPresets.find((p) => p.id === presetId);
        if (presetToDelete?.isActive) {
          const productUpdates = presetToDelete.discountItems.map((item) => {
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, {
              discountedPrice: null,
              discountPercent: null,
            });
          });
          await Promise.all(productUpdates);
        }

        await deleteDoc(doc(db, 'discountPresets', presetId));
      } catch (error) {
        throw new Error('Ошибка при удалении пресета скидок: ' + error.message);
      }
    },
    [userRole, discountPresets],
  );

  // Включение/выключение пресета
  const toggleDiscountPreset = useCallback(
    async (presetId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут управлять пресетами скидок');
      }
      try {
        const presetToToggle = discountPresets.find((p) => p.id === presetId);
        if (!presetToToggle) {
          throw new Error('Пресет не найден');
        }

        if (presetToToggle.isActive) {
          const presetRef = doc(db, 'discountPresets', presetId);
          await updateDoc(presetRef, { isActive: false });

          const productUpdates = presetToToggle.discountItems.map((item) => {
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, {
              discountedPrice: null,
              discountPercent: null,
            });
          });
          await Promise.all(productUpdates);
        } else {
          const activePreset = discountPresets.find((p) => p.isActive);
          if (activePreset) {
            const activePresetRef = doc(db, 'discountPresets', activePreset.id);
            await updateDoc(activePresetRef, { isActive: false });

            const productUpdates = activePreset.discountItems.map((item) => {
              const productRef = doc(db, 'products', item.productId);
              return updateDoc(productRef, {
                discountedPrice: null,
                discountPercent: null,
              });
            });
            await Promise.all(productUpdates);
          }

          const presetRef = doc(db, 'discountPresets', presetId);
          await updateDoc(presetRef, { isActive: true });

          const productUpdates = presetToToggle.discountItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return Promise.resolve();

            const originalPrice = product.priceProduct;
            const discountedPrice = originalPrice - (originalPrice * item.discountPercent) / 100;
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, {
              discountedPrice: discountedPrice.toFixed(2),
              discountPercent: item.discountPercent,
            });
          });
          await Promise.all(productUpdates);
        }
      } catch (error) {
        throw new Error('Ошибка при управлении пресетом: ' + error.message);
      }
    },
    [userRole, discountPresets, products],
  );

  // Добавление нового промокода
  const addPromoCode = useCallback(
    async (promoCodeData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут добавлять промокоды');
      }
      try {
        const promoCodeRef = doc(db, 'promoCodes', promoCodeData.id);
        await setDoc(promoCodeRef, promoCodeData);
      } catch (error) {
        throw new Error('Ошибка при добавлении промокода: ' + error.message);
      }
    },
    [userRole],
  );

  // Обновление промокода
  const updatePromoCode = useCallback(
    async (promoCodeId, updatedData) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут обновлять промокоды');
      }
      try {
        const promoCodeRef = doc(db, 'promoCodes', promoCodeId);
        await updateDoc(promoCodeRef, updatedData);
      } catch (error) {
        throw new Error('Ошибка при обновлении промокода: ' + error.message);
      }
    },
    [userRole],
  );

  // Удаление промокода
  const deletePromoCode = useCallback(
    async (promoCodeId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут удалять промокоды');
      }
      try {
        await deleteDoc(doc(db, 'promoCodes', promoCodeId));
      } catch (error) {
        throw new Error('Ошибка при удалении промокода: ' + error.message);
      }
    },
    [userRole],
  );

  // Включение/выключение промокода
  const togglePromoCode = useCallback(
    async (promoCodeId) => {
      if (userRole !== 'admin') {
        throw new Error('Только администраторы могут управлять промокодами');
      }
      try {
        const promoCode = promoCodes.find((p) => p.id === promoCodeId);
        if (!promoCode) {
          throw new Error('Промокод не найден');
        }
        const promoCodeRef = doc(db, 'promoCodes', promoCodeId);
        await updateDoc(promoCodeRef, { available: !promoCode.available });
      } catch (error) {
        throw new Error('Ошибка при управлении промокодом: ' + error.message);
      }
    },
    [userRole, promoCodes],
  );

  const value = {
    users,
    courses,
    products,
    orders,
    notifications,
    accessLevels,
    timers,
    discountPresets,
    promoCodes, // Добавляем промокоды в контекст
    fetchAllCourses,
    fetchAllProducts,
    fetchAllOrders,
    addUser,
    updateUser,
    deleteUser,
    addCourse,
    addProduct,
    updateCourse,
    updateProduct,
    deleteCourse,
    deleteProduct,
    addNotification,
    deleteNotification,
    addAccessLevel,
    addTimer,
    deleteTimer,
    addDiscountPreset,
    updateDiscountPreset,
    deleteDiscountPreset,
    toggleDiscountPreset,
    addPromoCode, // Добавляем методы для промокодов
    updatePromoCode,
    deletePromoCode,
    togglePromoCode,
    error,
    setError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
