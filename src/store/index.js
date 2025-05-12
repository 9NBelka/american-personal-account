import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import currencyReducer from './slices/currencySlice';
import storageReducer from './slices/storageSlice';
import formsReducer from './slices/formsSlice';
import timersReducer from './slices/timersForPagesSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    auth: authReducer,
    currency: currencyReducer,
    storage: storageReducer,
    forms: formsReducer,
    timers: timersReducer,
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
          'storage/uploadImage/pending',
          'storage/uploadImage/fulfilled',
          'storage/uploadImage/rejected',
          'storage/deleteImage/pending',
          'storage/deleteImage/fulfilled',
          'storage/deleteImage/rejected',
          'storage/fetchImages/pending',
          'storage/fetchImages/fulfilled',
          'storage/fetchImages/rejected',
        ],
        ignoredActionPaths: ['payload.ref', 'payload.firestore', 'meta.arg', 'payload.*.ref'],
        ignoredPaths: [
          'admin.firestore',
          'auth.firestore',
          'meta.arg.file',
          'storage.images',
          'storage.images.*.ref',
        ],
      },
    }),
});

export default store;
