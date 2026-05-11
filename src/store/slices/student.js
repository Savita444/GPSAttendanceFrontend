import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { StudentAPI } from '../../api/endpoints';

export const fetchStudentDashboard = createAsyncThunk('student/dashboard', async () =>
  StudentAPI.dashboard()
);

const slice = createSlice({
  name: 'student',
  initialState: { dashboard: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchStudentDashboard.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchStudentDashboard.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.dashboard = a.payload;
      })
      .addCase(fetchStudentDashboard.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error?.message;
      });
  },
});

export default slice.reducer;
