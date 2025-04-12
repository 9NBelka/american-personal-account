import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db, auth, storage } from '../../firebase';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';

// Initial state
const initialState = {
  users: [],
  courses: [],
  products: [],
  orders: [],
  notifications: [],
  accessLevels: [],
  timers: [],
  discountPresets: [],
  promoCodes: [],
  error: null,
  status: 'idle',
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') return [];
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchCourses = createAsyncThunk(
  'admin/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, 'courses'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchOrders = createAsyncThunk('admin/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchNotifications = createAsyncThunk(
  'admin/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'notifications'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAccessLevels = createAsyncThunk(
  'admin/fetchAccessLevels',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'accessLevels'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchTimers = createAsyncThunk(
  'admin/fetchTimers',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'timers'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDiscountPresets = createAsyncThunk(
  'admin/fetchDiscountPresets',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'discountPresets'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchPromoCodes = createAsyncThunk(
  'admin/fetchPromoCodes',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || auth.userRole !== 'admin') {
      return [];
    }
    try {
      const snapshot = await getDocs(collection(db, 'promoCodes'));
      const promoCodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Check expiry dates
      for (const promo of promoCodes) {
        if (promo.expiryDate && promo.available) {
          const expiry = new Date(promo.expiryDate);
          const now = new Date();
          if (now >= expiry) {
            await updateDoc(doc(db, 'promoCodes', promo.id), { available: false });
          }
        }
      }
      return promoCodes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ... (keep existing fetch thunks: fetchCourses, fetchProducts, fetchOrders, fetchNotifications, etc.)

export const addUser = createAsyncThunk(
  'admin/addUser',
  async (userData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять пользователей');
    try {
      const idToken = await auth.user.getIdToken();
      const response = await fetch(
        'https://us-central1-k-syndicate.cloudfunctions.net/addNewUser',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(userData),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Ошибка при добавлении пользователя');
      }
      const result = await response.json();
      await sendPasswordResetEmail(auth, userData.email, {
        url: 'https://lms-jet-one.vercel.app/login',
        handleCodeInApp: true,
      });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут удалять пользователей');
    try {
      const idToken = await auth.user.getIdToken();
      const response = await fetch(
        'https://us-central1-k-syndicate.cloudfunctions.net/deleteUser',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Ошибка при удалении пользователя');
      }
      return userId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addAccessLevel = createAsyncThunk(
  'admin/addAccessLevel',
  async (accessLevelData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять уровни доступа');
    try {
      const accessLevelRef = doc(db, 'accessLevels', accessLevelData.id);
      await setDoc(accessLevelRef, accessLevelData);
      return accessLevelData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addCourse = createAsyncThunk(
  'admin/addCourse',
  async (courseData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять курсы');
    try {
      const courseRef = doc(db, 'courses', courseData.id);
      await setDoc(courseRef, courseData);
      return courseData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, updatedData }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут обновлять пользователей');
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updatedData);
      return { userId, updatedData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteCourse = createAsyncThunk(
  'admin/deleteCourse',
  async (courseId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут удалять курсы');
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
      return courseId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadImage = createAsyncThunk(
  'admin/uploadImage',
  async ({ file, productId }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!file) {
      return rejectWithValue('Файл не выбран');
    }
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут загружать изображения');
    }
    try {
      const storageRef = ref(storage, `product-images/${productId}/${Date.now()}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ... (keep existing thunks: updateUser, deleteCourse, uploadImage, etc.)

export const addNotification = createAsyncThunk(
  'admin/addNotification',
  async (notificationData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять уведомления');
    try {
      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return { id: docRef.id, ...notificationData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteNotification = createAsyncThunk(
  'admin/deleteNotification',
  async (notificationId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут удалять уведомления');
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addTimer = createAsyncThunk(
  'admin/addTimer',
  async (timerData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять таймеры');
    try {
      const docRef = await addDoc(collection(db, 'timers'), timerData);
      return { id: docRef.id, ...timerData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTimer = createAsyncThunk(
  'admin/deleteTimer',
  async (timerId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут удалять таймеры');
    try {
      await deleteDoc(doc(db, 'timers', timerId));
      return timerId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addDiscountPreset = createAsyncThunk(
  'admin/addDiscountPreset',
  async (presetData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять пресеты скидок');
    try {
      const presetRef = doc(db, 'discountPresets', presetData.id);
      await setDoc(presetRef, { ...presetData, isActive: false });
      return { ...presetData, isActive: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateDiscountPreset = createAsyncThunk(
  'admin/updateDiscountPreset',
  async ({ presetId, updatedData }, { getState, rejectWithValue }) => {
    const { auth, admin } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут обновлять пресеты скидок');
    try {
      const presetToUpdate = admin.discountPresets.find((p) => p.id === presetId);
      if (!presetToUpdate) return rejectWithValue('Пресет не найден');

      const presetRef = doc(db, 'discountPresets', presetId);
      await updateDoc(presetRef, updatedData);

      if (presetToUpdate.isActive) {
        const resetPromises = presetToUpdate.discountItems.map((item) => {
          const productRef = doc(db, 'products', item.productId);
          return updateDoc(productRef, { discountedPrice: null, discountPercent: null });
        });
        await Promise.all(resetPromises);

        const updatePromises = updatedData.discountItems.map((item) => {
          const product = admin.products.find((p) => p.id === item.productId);
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
      return { id: presetId, ...updatedData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteDiscountPreset = createAsyncThunk(
  'admin/deleteDiscountPreset',
  async (presetId, { getState, rejectWithValue }) => {
    const { auth, admin } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут удалять пресеты скидок');
    try {
      const presetToDelete = admin.discountPresets.find((p) => p.id === presetId);
      if (presetToDelete?.isActive) {
        const productUpdates = presetToDelete.discountItems.map((item) => {
          const productRef = doc(db, 'products', item.productId);
          return updateDoc(productRef, { discountedPrice: null, discountPercent: null });
        });
        await Promise.all(productUpdates);
      }
      await deleteDoc(doc(db, 'discountPresets', presetId));
      return presetId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const toggleDiscountPreset = createAsyncThunk(
  'admin/toggleDiscountPreset',
  async (presetId, { getState, rejectWithValue }) => {
    const { auth, admin } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут управлять пресетами скидок');
    try {
      const presetToToggle = admin.discountPresets.find((p) => p.id === presetId);
      if (!presetToToggle) return rejectWithValue('Пресет не найден');

      const newIsActive = !presetToToggle.isActive;
      const presetRef = doc(db, 'discountPresets', presetId);
      await updateDoc(presetRef, { isActive: newIsActive });

      if (newIsActive) {
        const activePreset = admin.discountPresets.find((p) => p.isActive && p.id !== presetId);
        if (activePreset) {
          const activePresetRef = doc(db, 'discountPresets', activePreset.id);
          await updateDoc(activePresetRef, { isActive: false });
          const resetPromises = activePreset.discountItems.map((item) => {
            const productRef = doc(db, 'products', item.productId);
            return updateDoc(productRef, { discountedPrice: null, discountPercent: null });
          });
          await Promise.all(resetPromises);
        }

        const updatePromises = presetToToggle.discountItems.map((item) => {
          const product = admin.products.find((p) => p.id === item.productId);
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
      } else {
        const resetPromises = presetToToggle.discountItems.map((item) => {
          const productRef = doc(db, 'products', item.productId);
          return updateDoc(productRef, { discountedPrice: null, discountPercent: null });
        });
        await Promise.all(resetPromises);
      }
      return { id: presetId, isActive: newIsActive };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addPromoCode = createAsyncThunk(
  'admin/addPromoCode',
  async (promoCodeData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут добавлять промокоды');
    try {
      const promoCodeRef = doc(db, 'promoCodes', promoCodeData.id);
      await setDoc(promoCodeRef, promoCodeData);
      return promoCodeData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updatePromoCode = createAsyncThunk(
  'admin/updatePromoCode',
  async ({ promoCodeId, updatedData }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут обновлять промокоды');
    try {
      const promoCodeRef = doc(db, 'promoCodes', promoCodeId);
      await updateDoc(promoCodeRef, updatedData);
      return { id: promoCodeId, ...updatedData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deletePromoCode = createAsyncThunk(
  'admin/deletePromoCode',
  async (promoCodeId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут удалять промокоды');
    try {
      await deleteDoc(doc(db, 'promoCodes', promoCodeId));
      return promoCodeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const togglePromoCode = createAsyncThunk(
  'admin/togglePromoCode',
  async (promoCodeId, { getState, rejectWithValue }) => {
    const { auth, admin } = getState();
    if (auth.userRole !== 'admin')
      return rejectWithValue('Только администраторы могут управлять промокодами');
    try {
      const promoCode = admin.promoCodes.find((p) => p.id === promoCodeId);
      if (!promoCode) return rejectWithValue('Промокод не найден');
      const promoCodeRef = doc(db, 'promoCodes', promoCodeId);
      await updateDoc(promoCodeRef, { available: !promoCode.available });
      return { id: promoCodeId, available: !promoCode.available };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setCourses: (state, action) => {
      state.courses = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setAccessLevels: (state, action) => {
      state.accessLevels = action.payload;
    },
    setTimers: (state, action) => {
      state.timers = action.payload;
    },
    setDiscountPresets: (state, action) => {
      state.discountPresets = action.payload;
    },
    setPromoCodes: (state, action) => {
      state.promoCodes = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.courses = action.payload;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(fetchAccessLevels.fulfilled, (state, action) => {
        state.accessLevels = action.payload;
      })
      .addCase(fetchTimers.fulfilled, (state, action) => {
        state.timers = action.payload;
      })
      .addCase(fetchDiscountPresets.fulfilled, (state, action) => {
        state.discountPresets = action.payload;
      })
      .addCase(fetchPromoCodes.fulfilled, (state, action) => {
        state.promoCodes = action.payload;
      })
      .addCase(uploadImage.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(addAccessLevel.fulfilled, (state, action) => {
        state.accessLevels.push(action.payload);
      })
      .addCase(addCourse.fulfilled, (state, action) => {
        state.courses.push(action.payload);
      })
      .addCase(addNotification.fulfilled, (state, action) => {
        state.notifications.push(action.payload);
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      })
      .addCase(addTimer.fulfilled, (state, action) => {
        state.timers.push(action.payload);
      })
      .addCase(deleteTimer.fulfilled, (state, action) => {
        state.timers = state.timers.filter((t) => t.id !== action.payload);
      })
      .addCase(addDiscountPreset.fulfilled, (state, action) => {
        state.discountPresets.push(action.payload);
      })
      .addCase(updateDiscountPreset.fulfilled, (state, action) => {
        const index = state.discountPresets.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.discountPresets[index] = action.payload;
      })
      .addCase(deleteDiscountPreset.fulfilled, (state, action) => {
        state.discountPresets = state.discountPresets.filter((p) => p.id !== action.payload);
      })
      .addCase(toggleDiscountPreset.fulfilled, (state, action) => {
        const index = state.discountPresets.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.discountPresets[index].isActive = action.payload.isActive;
      })
      .addCase(addPromoCode.fulfilled, (state, action) => {
        state.promoCodes.push(action.payload);
      })
      .addCase(updatePromoCode.fulfilled, (state, action) => {
        const index = state.promoCodes.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.promoCodes[index] = action.payload;
      })
      .addCase(deletePromoCode.fulfilled, (state, action) => {
        state.promoCodes = state.promoCodes.filter((p) => p.id !== action.payload);
      })
      .addCase(togglePromoCode.fulfilled, (state, action) => {
        const index = state.promoCodes.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.promoCodes[index].available = action.payload.available;
      });
    // ... (keep existing extraReducers for fetchCourses, fetchProducts, etc.)
  },
});

export const {
  setError,
  clearError,
  setUsers,
  setCourses,
  setProducts,
  setOrders,
  setNotifications,
  setAccessLevels,
  setTimers,
  setDiscountPresets,
  setPromoCodes,
} = adminSlice.actions;

export default adminSlice.reducer;
