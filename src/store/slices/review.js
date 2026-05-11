import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReviewAPI } from '../../api/endpoints';

export const fetchReviews = createAsyncThunk('review/list', async (params) =>
  (await ReviewAPI.list(params)).items
);
export const fetchReview = createAsyncThunk('review/get', async (id) =>
  (await ReviewAPI.get(id)).review
);
export const upsertReview = createAsyncThunk('review/upsert', async (body, { rejectWithValue }) => {
  try { return (await ReviewAPI.upsert(body)).review; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const sendReviewEmail = createAsyncThunk('review/sendEmail', async (id, { rejectWithValue }) => {
  try { return (await ReviewAPI.sendEmail(id)).review; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const slice = createSlice({
  name: 'review',
  initialState: { list: [], current: null, status: 'idle', error: null },
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (b) => {
    b.addCase(fetchReviews.fulfilled, (s, a) => { s.list = a.payload; })
      .addCase(fetchReview.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(upsertReview.fulfilled, (s, a) => {
        const idx = s.list.findIndex((r) => r._id === a.payload._id);
        if (idx >= 0) s.list[idx] = a.payload;
        else s.list.unshift(a.payload);
      })
      .addCase(sendReviewEmail.fulfilled, (s, a) => {
        const idx = s.list.findIndex((r) => r._id === a.payload._id);
        if (idx >= 0) s.list[idx] = a.payload;
      });
  },
});

export const { clearCurrent } = slice.actions;
export default slice.reducer;
