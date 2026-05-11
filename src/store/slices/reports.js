import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportAPI } from '../../api/endpoints';

export const fetchReport = createAsyncThunk('reports/json', async (params, { rejectWithValue }) => {
  try { return await ReportAPI.json(params); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const slice = createSlice({
  name: 'reports',
  initialState: { items: [], total: 0, status: 'idle', error: null },
  reducers: { clearReport: (s) => { s.items = []; s.total = 0; } },
  extraReducers: (b) => {
    b.addCase(fetchReport.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(fetchReport.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.items = a.payload.items;
        s.total = a.payload.total;
      })
      .addCase(fetchReport.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; });
  },
});

export const { clearReport } = slice.actions;
export default slice.reducer;
