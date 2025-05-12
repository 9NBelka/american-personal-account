import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../firebase';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const fetchTimers = createAsyncThunk('timers/fetchTimers', async () => {
  const timersCollection = collection(db, 'timersPages');
  const timersSnapshot = await getDocs(timersCollection);
  const timersList = timersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return timersList;
});

export const addTimer = createAsyncThunk('timers/addTimer', async (timerData) => {
  const timerRef = doc(db, 'timersPages', timerData.id);
  await setDoc(timerRef, timerData);
  return timerData;
});

export const updateTimer = createAsyncThunk(
  'timers/updateTimer',
  async ({ timerId, updatedData }) => {
    const timerRef = doc(db, 'timersPages', timerId);
    await updateDoc(timerRef, updatedData);
    return { timerId, updatedData };
  },
);

export const setActiveTimer = createAsyncThunk('timers/setActiveTimer', async (timerId) => {
  const timerRef = doc(db, 'timersPages', timerId);
  const timerDoc = await getDocs(collection(db, 'timersPages'));
  const timer = timerDoc.docs.find((doc) => doc.id === timerId).data();
  const newActiveState = !timer.isActive;
  await updateDoc(timerRef, { isActive: newActiveState });
  return { timerId, isActive: newActiveState };
});

export const deleteTimer = createAsyncThunk('timers/deleteTimer', async (timerId) => {
  const timerRef = doc(db, 'timersPages', timerId);
  await deleteDoc(timerRef);
  return timerId;
});

const timersForPagesSlice = createSlice({
  name: 'timers',
  initialState: {
    timers: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTimers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.timers = action.payload;
      })
      .addCase(fetchTimers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addTimer.fulfilled, (state, action) => {
        state.timers.push(action.payload);
      })
      .addCase(updateTimer.fulfilled, (state, action) => {
        const { timerId, updatedData } = action.payload;
        const timerIndex = state.timers.findIndex((timer) => timer.id === timerId);
        if (timerIndex !== -1) {
          state.timers[timerIndex] = { ...state.timers[timerIndex], ...updatedData };
        }
      })
      .addCase(setActiveTimer.fulfilled, (state, action) => {
        const { timerId, isActive } = action.payload;
        const timerIndex = state.timers.findIndex((timer) => timer.id === timerId);
        if (timerIndex !== -1) {
          state.timers[timerIndex].isActive = isActive;
        }
      })
      .addCase(deleteTimer.fulfilled, (state, action) => {
        state.timers = state.timers.filter((timer) => timer.id !== action.payload);
      });
  },
});

export default timersForPagesSlice.reducer;
