import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import currencyReducer from './slices/currencySlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    auth: authReducer,
    currency: currencyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'admin/uploadImage/pending',
          'admin/uploadImage/fulfilled',
          'admin/uploadImage/rejected',
          'auth/updateUserAvatar/pending',
          'auth/updateUserAvatar/fulfilled',
          'auth/updateUserAvatar/rejected',
        ],
        ignoredActionPaths: ['payload.ref', 'payload.firestore', 'meta.arg'],
        ignoredPaths: ['admin.firestore', 'auth.firestore', 'meta.arg.file'],
      },
    }),
});

export default store;
