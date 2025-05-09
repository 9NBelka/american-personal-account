import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// Асинхронный thunk для получения данных форм
export const fetchForms = createAsyncThunk(
  'forms/fetchForms',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user || !['admin', 'moderator'].includes(auth.userRole)) {
      return rejectWithValue('Только администраторы и модераторы могут просматривать данные форм');
    }
    try {
      const snapshot = await getDocs(collection(db, 'formsPages'));
      const formsData = snapshot.docs.map((doc) => ({
        pageId: doc.id,
        forms: doc.data().forms || [],
      }));
      return formsData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const formsSlice = createSlice({
  name: 'forms',
  initialState: {
    formsPages: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchForms.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.formsPages = action.payload;
        state.error = null;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default formsSlice.reducer;
