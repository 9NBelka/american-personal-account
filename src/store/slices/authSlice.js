import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, db, storage } from '../../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  signInWithRedirect,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Храним currentUser вне Redux
let firebaseCurrentUser = null;

const initialState = {
  user: null,
  userRole: null,
  userName: '',
  registrationDate: '',
  progress: {},
  completedLessons: {},
  lastModules: {},
  courses: [],
  avatarUrl: null,
  readNotifications: [],
  notifications: [],
  userAccessLevels: [],
  accessLevels: [],
  timers: [],
  error: null,
  isLoading: true,
  isAuthInitialized: false,
  lastCourseId: localStorage.getItem('lastCourseId') || null,
  status: 'idle',
};

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Попробуем войти через email/пароль
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      firebaseCurrentUser = user;
      return { uid: user.uid, email: user.email, displayName: user.displayName };
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return rejectWithValue({ code: error.code, message: 'Неверный пароль' });
      } else if (error.code === 'auth/user-not-found') {
        return rejectWithValue({ code: error.code, message: 'Пользователь не найден' });
      } else {
        return rejectWithValue({
          code: error.code,
          message: `Ошибка входа: ${error.message}`,
        });
      }
    }
  },
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (email, { rejectWithValue }) => {
    try {
      // Проверяем, существует ли пользователь с этим email в Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const userExistsInFirestore = !querySnapshot.empty;

      // Проверяем методы входа для email
      const methods = await fetchSignInMethodsForEmail(auth, email);
      console.log('Sign-in methods for email:', methods);

      // Если пользователь существует в Firestore или email уже используется с password
      if (
        (userExistsInFirestore || methods.includes('password')) &&
        !methods.includes('google.com')
      ) {
        return rejectWithValue({
          code: 'auth/account-exists-with-different-credential',
          message: `Этот email (${email}) уже используется с провайдером password. Войдите через email/пароль, чтобы привязать Google-аккаунт.`,
          email,
          methods,
        });
      }

      // Если email не используется или уже имеет Google-провайдер, продолжаем
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: email });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('User provider data1:', user.providerData);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const registrationDate = new Date().toISOString();
        const name = user.displayName?.split(' ')[0] || '';
        const lastName = user.displayName?.split(' ').slice(1).join(' ') || '';
        await setDoc(userDocRef, {
          name,
          lastName,
          email: user.email,
          role: 'guest',
          registrationDate,
          avatarUrl: user.photoURL || null,
          readNotifications: [],
        });
      }

      firebaseCurrentUser = user;
      return { uid: user.uid, email: user.email, displayName: user.displayName };
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.email;
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return rejectWithValue({
          code: error.code,
          message: `Этот email уже используется с провайдером: ${methods.join(
            ', ',
          )}. Пожалуйста, войдите через email/пароль и привяжите Google-аккаунт.`,
          email,
          methods,
          credential: error.credential,
        });
      }
      console.log('Ошибка входа через Google:', error);
      return rejectWithValue({ code: error.code, message: error.message });
    }
  },
);

export const linkGoogleAccount = createAsyncThunk(
  'auth/linkGoogleAccount',
  async ({ credential }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !firebaseCurrentUser) {
      return rejectWithValue('Нет авторизованного пользователя');
    }
    try {
      console.log('Связываем Google-провайдер с текущим пользователем');
      console.log('User provider data3:', firebaseCurrentUser.providerData);
      await firebaseCurrentUser.linkWithCredential(credential);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
        return rejectWithValue(
          'Этот Google-аккаунт уже привязан к другому пользователю. Используйте другой Google-аккаунт.',
        );
      }
      console.log('Ошибка связывания Google:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const unlinkGoogleProvider = createAsyncThunk(
  'auth/unlinkGoogleProvider',
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !firebaseCurrentUser) {
      return rejectWithValue('Нет авторизованного пользователя');
    }
    try {
      // Проверяем, сколько провайдеров связано с аккаунтом
      const providerData = firebaseCurrentUser.providerData;
      if (providerData.length <= 1) {
        return rejectWithValue(
          'Нельзя отвязать Google, так как это единственный способ входа. Добавьте другой способ входа перед отвязкой.',
        );
      }

      // Отвязываем Google-провайдер
      await firebaseCurrentUser.unlink('google.com');
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      return new Promise((resolve, reject) => {
        // Проверяем результат редиректа (например, после Google Sign-In)
        getRedirectResult(auth)
          .then(async (result) => {
            if (result) {
              const user = result.user;
              console.log('Результат редиректа Google:', user.providerData);

              // Проверяем методы входа для email
              const methods = await fetchSignInMethodsForEmail(auth, user.email);
              console.log('Sign-in methods for email:', methods);

              if (methods.includes('password') && !methods.includes('google.com')) {
                // Email уже используется с password, но Google не привязан
                return reject({
                  code: 'auth/account-exists-with-different-credential',
                  message: `Этот email (${user.email}) уже используется с провайдером password. Войдите через email/пароль, чтобы привязать Google-аккаунт.`,
                  email: user.email,
                  methods,
                  credential: result.credential,
                });
              }

              const userDocRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);

              if (!userDoc.exists()) {
                const registrationDate = new Date().toISOString();
                const name = user.displayName?.split(' ')[0] || '';
                const lastName = user.displayName?.split(' ').slice(1).join(' ') || '';
                await setDoc(userDocRef, {
                  name,
                  lastName,
                  email: user.email,
                  role: 'guest',
                  registrationDate,
                  avatarUrl: user.photoURL || null,
                  readNotifications: [],
                });
              }

              firebaseCurrentUser = user;
              const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
              };
              dispatch(setUser(userData));
              const userDataResult = await dispatch(fetchUserData(user.uid)).unwrap();
              dispatch(setUserRole(userDataResult.role));
              dispatch(subscribeToCourses(userDataResult.purchasedCourses));
              resolve(userData);
            }

            // Обычная проверка состояния авторизации
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                const userData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                };
                firebaseCurrentUser = firebaseUser;
                dispatch(setUser(userData));
                const userDataResult = await dispatch(fetchUserData(firebaseUser.uid)).unwrap();
                dispatch(setUserRole(userDataResult.role));
                dispatch(subscribeToCourses(userDataResult.purchasedCourses));
                resolve(userData);
              } else {
                firebaseCurrentUser = null;
                dispatch(setUser(null));
                dispatch(setUserRole(null));
                resolve(null);
              }
              dispatch(setAuthInitialized(true));
              unsubscribe();
            });
          })
          .catch((error) => {
            console.log('Ошибка обработки редиректа:', error);
            if (error.code === 'auth/account-exists-with-different-credential') {
              const email = error.email;
              fetchSignInMethodsForEmail(auth, email).then((methods) => {
                reject({
                  code: error.code,
                  message: `Этот email (${email}) уже используется с провайдером: ${methods.join(
                    ', ',
                  )}. Войдите через email/пароль и привяжите Google-аккаунт.`,
                  email,
                  methods,
                  credential: error.credential,
                });
              });
            } else {
              reject(error);
            }
          });
      });
    } catch (error) {
      dispatch(setAuthInitialized(true));
      return rejectWithValue(error.message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await signOut(auth);
    firebaseCurrentUser = null;
    return null;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const getFirebaseCurrentUser = () => firebaseCurrentUser;

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ name, lastName, email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const registrationDate = new Date().toISOString();
      const user = userCredential.user;
      firebaseCurrentUser = user;

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

      return { uid: user.uid, email: user.email, displayName: user.displayName };
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (uid, { rejectWithValue }) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const purchasedCourses = data.purchasedCourses || {};
        const accessLevels = Object.values(purchasedCourses)
          .map((course) => course.access)
          .filter((access, index, self) => access && self.indexOf(access) === index);
        return {
          name: data.name || '',
          role: data.role || 'guest',
          registrationDate: data.registrationDate || '',
          avatarUrl: data.avatarUrl || null,
          readNotifications: data.readNotifications || [],
          userAccessLevels: accessLevels,
          purchasedCourses,
        };
      }
      return {
        name: '',
        role: 'guest',
        registrationDate: '',
        avatarUrl: null,
        readNotifications: [],
        userAccessLevels: [],
        purchasedCourses: {},
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const subscribeToCourses = createAsyncThunk(
  'auth/subscribeToCourses',
  async (purchasedCourses, { dispatch, rejectWithValue }) => {
    try {
      onSnapshot(collection(db, 'courses'), (snapshot) => {
        const courseList = snapshot.docs.map((doc) => {
          const courseData = doc.data();
          const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
          const courseAccess = purchasedCourses[doc.id]?.access || 'denied';
          const isAccessible = courseAccess !== 'denied' && hasModules;

          const modulesData = courseData.modules || {};
          const sortedModuleKeys = Object.keys(modulesData).sort((a, b) => a.localeCompare(b));

          const modulesArray = sortedModuleKeys.map((moduleId) => ({
            id: moduleId,
            moduleTitle: modulesData[moduleId].title,
            links: modulesData[moduleId].lessons
              ? Object.values(modulesData[moduleId].lessons)
              : [],
            unlockDate: modulesData[moduleId].unlockDate || null,
            order: modulesData[moduleId].order || null,
          }));

          const totalLessons = modulesArray.reduce(
            (sum, module) => sum + (module.links.length || 0),
            0,
          );
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
              courseData.title ||
              doc.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            category: courseData.category || 'Uncategorized',
            gitHubRepLink: courseData.gitHubRepLink,
            description: courseData.description || ' ',
            available: isAccessible,
            access: courseAccess,
            modules: modulesArray,
            totalLessons,
            completedLessonsCount,
            totalDuration,
            userCount: courseData.userCount || 0,
            certificateImage: courseData.certificateImage || '/img/DefaultCertificate.jpg',
          };
        });
        dispatch(setCourses(courseList));
      });

      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchCourses = createAsyncThunk(
  'auth/fetchCourses',
  async (purchasedCourses = {}, { rejectWithValue }) => {
    try {
      const courseDocs = await getDocs(collection(db, 'courses'));
      if (courseDocs.empty) return [];

      const courseList = courseDocs.docs.map((doc) => {
        const courseData = doc.data();
        const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
        const courseAccess = purchasedCourses[doc.id]?.access || 'denied';
        const isAccessible = courseAccess !== 'denied' && hasModules;

        const modulesData = courseData.modules || {};
        const sortedModuleKeys = Object.keys(modulesData).sort((a, b) => a.localeCompare(b));

        const modulesArray = sortedModuleKeys.map((moduleId) => ({
          id: moduleId,
          moduleTitle: modulesData[moduleId].title,
          links: modulesData[moduleId].lessons ? Object.values(modulesData[moduleId].lessons) : [],
          unlockDate: modulesData[moduleId].unlockDate || null,
          order: modulesData[moduleId].order || null,
        }));

        const totalLessons = modulesArray.reduce(
          (sum, module) => sum + (module.links.length || 0),
          0,
        );
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
          userCount: courseData.userCount || 0,
        };
      });
      return courseList;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateUserAvatar = createAsyncThunk(
  'auth/updateUserAvatar',
  async (file, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !file) {
      return rejectWithValue('Пользователь не авторизован или файл не выбран');
    }
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: downloadURL });
      return downloadURL;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const toggleLessonCompletion = createAsyncThunk(
  'auth/toggleLessonCompletion',
  async ({ courseId, moduleId, lessonIndex, totalLessons }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user) {
      return rejectWithValue('Пользователь не авторизован');
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const purchasedCourses = userDoc.data().purchasedCourses || {};
        const courseData = purchasedCourses[courseId] || { completedLessons: {} };

        const currentModuleLessons = courseData.completedLessons[moduleId] || [];
        const newLessons = currentModuleLessons.includes(lessonIndex)
          ? currentModuleLessons.filter((index) => index !== lessonIndex)
          : [...currentModuleLessons, lessonIndex];

        const updatedCompletedLessons = {
          ...courseData.completedLessons,
          [moduleId]: newLessons,
        };

        const completedLessonsCount = Object.values(updatedCompletedLessons).reduce(
          (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
          0,
        );
        const newProgress =
          totalLessons > 0
            ? Math.min(Math.round((completedLessonsCount / totalLessons) * 100), 100)
            : 0;

        await updateDoc(userRef, {
          [`purchasedCourses.${courseId}.completedLessons`]: updatedCompletedLessons,
          [`purchasedCourses.${courseId}.progress`]: newProgress,
        });

        return { courseId, moduleId, lessonIndex, progress: newProgress };
      }
      return rejectWithValue('Пользователь не найден');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateCourseData = createAsyncThunk(
  'auth/updateCourseData',
  async (courseId, { getState, rejectWithValue }) => {
    const { user, courses } = getState().auth;
    if (!user || !user.uid || !courseId) return rejectWithValue('No user or courseId');
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const purchasedCourses = userDoc.data().purchasedCourses || {};
        const courseData = purchasedCourses[courseId] || { completedLessons: {}, progress: 0 };
        const course = courses.find((c) => c.id === courseId);
        if (!course) return rejectWithValue('Course not found');

        const validCompletedLessons = {};
        course.modules.forEach((module) => {
          if (courseData.completedLessons[module.id]) {
            validCompletedLessons[module.id] = courseData.completedLessons[module.id].filter(
              (index) => index < module.links.length,
            );
          }
        });

        return { courseId, completedLessons: validCompletedLessons, progress: courseData.progress };
      }
      return rejectWithValue('User not found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateUserName = createAsyncThunk(
  'auth/updateUserName',
  async (newName, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !user.uid) return rejectWithValue('No user');
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: newName });
      return newName;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateUserPassword = createAsyncThunk(
  'auth/updateUserPassword',
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user || !user.email) return rejectWithValue('No user');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
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
      return rejectWithValue({ success: false, message });
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'auth/markNotificationAsRead',
  async (notificationId, { getState, rejectWithValue }) => {
    const { user, readNotifications } = getState().auth;
    if (!user || !user.uid) return rejectWithValue('No user');
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentReadNotifications = userDoc.data().readNotifications || [];
        if (!currentReadNotifications.includes(notificationId)) {
          const updatedReadNotifications = [...currentReadNotifications, notificationId];
          await updateDoc(userRef, { readNotifications: updatedReadNotifications });
          return updatedReadNotifications;
        }
        return currentReadNotifications;
      }
      return rejectWithValue('User not found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
        ? { ...action.payload, providerData: firebaseCurrentUser?.providerData || [] }
        : null;
      state.isLoading = false;
    },
    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    setAuthInitialized: (state, action) => {
      state.isAuthInitialized = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLastCourseId: (state, action) => {
      state.lastCourseId = action.payload;
      localStorage.setItem('lastCourseId', action.payload);
    },
    updateLastModule: (state, action) => {
      const { courseId, moduleId } = action.payload;
      state.lastModules[courseId] = moduleId;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setCompletedLessons: (state, action) => {
      state.completedLessons = action.payload;
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
    setUserAccessLevels: (state, action) => {
      state.userAccessLevels = action.payload;
    },
    setCourses: (state, action) => {
      state.courses = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isAuthInitialized = false;
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state) => {
        state.isAuthInitialized = true;
        state.isLoading = false;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isAuthInitialized = true;
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isLoading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
        state.isLoading = false;
      })
      .addCase(unlinkGoogleProvider.fulfilled, (state) => {
        state.status = 'succeeded';
        state.isLoading = false;
      })
      .addCase(unlinkGoogleProvider.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isLoading = false;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        if (action.payload.redirectInitiated) {
          state.status = 'redirecting';
          state.isLoading = true;
        } else {
          state.status = 'succeeded';
          state.isLoading = false;
        }
      })
      .addCase(linkGoogleAccount.fulfilled, (state) => {
        state.status = 'succeeded';
        state.isLoading = false;
      })
      .addCase(linkGoogleAccount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
        state.isLoading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.userRole = null;
        state.userName = '';
        state.registrationDate = '';
        state.avatarUrl = null;
        state.readNotifications = [];
        state.userAccessLevels = [];
        state.progress = {};
        state.completedLessons = {};
        state.lastModules = {};
        state.courses = [];
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.userName = action.payload.name;
        state.userRole = action.payload.role;
        state.registrationDate = action.payload.registrationDate;
        state.avatarUrl = action.payload.avatarUrl;
        state.readNotifications = action.payload.readNotifications;
        state.userAccessLevels = action.payload.userAccessLevels;
        const purchasedCourses = action.payload.purchasedCourses;
        Object.keys(purchasedCourses).forEach((courseId) => {
          state.progress[courseId] = purchasedCourses[courseId].progress || 0;
          state.completedLessons[courseId] = purchasedCourses[courseId].completedLessons || {};
        });
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.courses = action.payload;
      })
      .addCase(subscribeToCourses.fulfilled, (state) => {
        // Ничего не делаем, так как данные обновляются через setCourses
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.avatarUrl = action.payload;
      })
      .addCase(toggleLessonCompletion.fulfilled, (state, action) => {
        const { courseId, moduleId, lessonIndex, progress } = action.payload;
        if (!state.completedLessons[courseId]) {
          state.completedLessons[courseId] = {};
        }
        if (!state.completedLessons[courseId][moduleId]) {
          state.completedLessons[courseId][moduleId] = [];
        }
        const lessonIndexInArray = state.completedLessons[courseId][moduleId].indexOf(lessonIndex);
        if (lessonIndexInArray === -1) {
          state.completedLessons[courseId][moduleId].push(lessonIndex);
        } else {
          state.completedLessons[courseId][moduleId] = state.completedLessons[courseId][
            moduleId
          ].filter((index) => index !== lessonIndex);
        }
        state.progress[courseId] = progress;
        state.lastModules[courseId] = moduleId;
      })
      .addCase(toggleLessonCompletion.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCourseData.fulfilled, (state, action) => {
        const { courseId, completedLessons, progress } = action.payload;
        state.completedLessons[courseId] = completedLessons;
        state.progress[courseId] = progress;
        state.lastCourseId = courseId;
        localStorage.setItem('lastCourseId', courseId);
      })
      .addCase(updateUserName.fulfilled, (state, action) => {
        state.userName = action.payload;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        // Ничего не обновляем в состоянии, так как пароль обновляется в Firebase
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
        state.isLoading = false;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.readNotifications = action.payload;
      });
  },
});

export const {
  setUser,
  setUserRole,
  setAuthInitialized,
  setError,
  clearError,
  setLastCourseId,
  updateLastModule,
  setProgress,
  setCompletedLessons,
  setNotifications,
  setAccessLevels,
  setTimers,
  setUserAccessLevels,
  setCourses,
} = authSlice.actions;

export default authSlice.reducer;
