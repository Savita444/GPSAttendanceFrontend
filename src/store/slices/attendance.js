import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AttendanceAPI } from '../../api/endpoints';

export const checkIn = createAsyncThunk('attendance/checkIn', async (payload, { rejectWithValue }) => {
  try { return (await AttendanceAPI.checkIn(payload)).attendance; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Check-in failed'); }
});
export const checkOut = createAsyncThunk('attendance/checkOut', async (payload, { rejectWithValue }) => {
  try { return (await AttendanceAPI.checkOut(payload)).attendance; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Check-out failed'); }
});
export const fetchToday = createAsyncThunk('attendance/today', async () =>
  (await AttendanceAPI.today()).attendance
);
export const fetchHistory = createAsyncThunk('attendance/history', async (params) =>
  (await AttendanceAPI.history(params)).items
);
export const fetchSummary = createAsyncThunk('attendance/summary', async (params) =>
  AttendanceAPI.summary(params)
);

const slice = createSlice({
  name: 'attendance',
  initialState: { today: null, history: [], summary: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchToday.fulfilled, (s, a) => { s.today = a.payload; })
      .addCase(checkIn.fulfilled, (s, a) => { s.today = a.payload; })
      .addCase(checkOut.fulfilled, (s, a) => { s.today = a.payload; })
      .addCase(fetchHistory.fulfilled, (s, a) => { s.history = a.payload; })
      .addCase(fetchSummary.fulfilled, (s, a) => { s.summary = a.payload; });
  },
});

export default slice.reducer;
