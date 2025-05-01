import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Предполагается, что db инициализирован

// Получение всех валют
export const fetchCurrencies = createAsyncThunk(
  'currency/fetchCurrencies',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!['admin', 'moderator'].includes(auth.userRole)) {
      return rejectWithValue('Только администраторы и модераторы могут просматривать валюты');
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'currencies'));
      const currencies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return currencies;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Добавление новой валюты
export const addCurrency = createAsyncThunk(
  'currency/addCurrency',
  async (currencyData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут добавлять валюты');
    }
    try {
      const currencyRef = doc(db, 'currencies', currencyData.id);
      await setDoc(currencyRef, {
        code: currencyData.code,
        name: currencyData.name,
        rate: parseFloat(currencyData.rate) || 1,
        customRate: null,
        isActive: false,
      });
      return { id: currencyData.id, ...currencyData, customRate: null, isActive: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Обновление валюты (курс, кастомный курс, выбор активной валюты)
export const updateCurrency = createAsyncThunk(
  'currency/updateCurrency',
  async ({ currencyId, updatedData }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут обновлять валюты');
    }
    try {
      const currencyRef = doc(db, 'currencies', currencyId);
      await updateDoc(currencyRef, updatedData);
      return { id: currencyId, ...updatedData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Сброс всех isActive и установка новой активной валюты
export const setActiveCurrency = createAsyncThunk(
  'currency/setActiveCurrency',
  async (currencyId, { getState, dispatch, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.userRole !== 'admin') {
      return rejectWithValue('Только администраторы могут выбирать валюту');
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'currencies'));
      const updates = querySnapshot.docs.map(async (doc) => {
        const currencyRef = doc.ref;
        if (doc.id === currencyId) {
          await updateDoc(currencyRef, { isActive: true });
        } else {
          await updateDoc(currencyRef, { isActive: false });
        }
      });
      await Promise.all(updates);
      return currencyId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    currencies: [],
    activeCurrency: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currencies = action.payload;
        state.activeCurrency = action.payload.find((c) => c.isActive)?.id || null;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addCurrency.fulfilled, (state, action) => {
        state.currencies.push(action.payload);
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        const index = state.currencies.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.currencies[index] = { ...state.currencies[index], ...action.payload };
        }
      })
      .addCase(setActiveCurrency.fulfilled, (state, action) => {
        state.activeCurrency = action.payload;
        state.currencies = state.currencies.map((c) =>
          c.id === action.payload ? { ...c, isActive: true } : { ...c, isActive: false },
        );
      });
  },
});

export default currencySlice.reducer;
