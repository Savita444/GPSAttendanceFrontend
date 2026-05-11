import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TeacherAPI } from '../../api/endpoints';

export const fetchTeacherStats = createAsyncThunk('teacher/stats', async () =>
  TeacherAPI.stats()
);
export const fetchTeacherStudents = createAsyncThunk('teacher/students', async () =>
  (await TeacherAPI.students()).items
);
export const fetchStudentSummary = createAsyncThunk(
  'teacher/studentSummary',
  async ({ id, params }) => TeacherAPI.studentSummary(id, params)
);
export const fetchStudentDetails = createAsyncThunk(
  'teacher/studentDetails',
  async ({ id, params }) => TeacherAPI.studentDetails(id, params)
);

const slice = createSlice({
  name: 'teacher',
  initialState: {
    stats: { counts: {} },
    students: [],
    summary: null,
    details: null,
    status: 'idle',
  },
  reducers: { clearDetails: (s) => { s.details = null; } },
  extraReducers: (b) => {
    b.addCase(fetchTeacherStats.fulfilled, (s, a) => { s.stats = a.payload; })
      .addCase(fetchTeacherStudents.fulfilled, (s, a) => { s.students = a.payload; })
      .addCase(fetchStudentSummary.fulfilled, (s, a) => { s.summary = a.payload; })
      .addCase(fetchStudentDetails.fulfilled, (s, a) => { s.details = a.payload; });
  },
});

export const { clearDetails } = slice.actions;

export default slice.reducer;
