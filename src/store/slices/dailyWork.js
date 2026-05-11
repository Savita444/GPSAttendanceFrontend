import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DailyWorkAPI } from '../../api/endpoints';

export const fetchMine = createAsyncThunk('dailyWork/mine', async (params) =>
  (await DailyWorkAPI.mine(params)).items
);
export const fetchPending = createAsyncThunk('dailyWork/list', async (params) =>
  (await DailyWorkAPI.list(params)).items
);
export const submitWork = createAsyncThunk('dailyWork/submit', async (body, { rejectWithValue }) => {
  try { return (await DailyWorkAPI.submit(body)).work; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const reviewWork = createAsyncThunk('dailyWork/review', async ({ id, body }, { rejectWithValue }) => {
  try { return (await DailyWorkAPI.review(id, body)).work; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const slice = createSlice({
  name: 'dailyWork',
  initialState: { mine: [], pending: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMine.fulfilled, (s, a) => { s.mine = a.payload; })
      .addCase(fetchPending.fulfilled, (s, a) => { s.pending = a.payload; })
      .addCase(submitWork.fulfilled, (s, a) => {
        const idx = s.mine.findIndex((w) => w._id === a.payload._id);
        if (idx >= 0) s.mine[idx] = a.payload;
        else s.mine.unshift(a.payload);
      })
      .addCase(reviewWork.fulfilled, (s, a) => {
        s.pending = s.pending.filter((w) => w._id !== a.payload._id);
      });
  },
});

export default slice.reducer;
