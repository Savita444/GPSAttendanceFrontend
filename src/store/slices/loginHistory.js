import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthAPI } from '../../api/endpoints';

export const fetchLoginHistory = createAsyncThunk('loginHistory/fetch', async (userId) =>
  (await AuthAPI.history(userId)).items
);

const slice = createSlice({
  name: 'loginHistory',
  initialState: { items: [], status: 'idle' },
  reducers: { clearHistory: (s) => { s.items = []; } },
  extraReducers: (b) => {
    b.addCase(fetchLoginHistory.fulfilled, (s, a) => { s.items = a.payload; });
  },
});

export const { clearHistory } = slice.actions;
export default slice.reducer;
