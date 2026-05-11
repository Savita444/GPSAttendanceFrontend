import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AdminAPI, AuthAPI } from '../../api/endpoints';

export const createUser = createAsyncThunk('admin/createUser', async (body, { rejectWithValue }) => {
  try { return (await AuthAPI.register(body)).user; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchDashboard = createAsyncThunk('admin/dashboard', async () =>
  AdminAPI.dashboard()
);
export const fetchPerformance = createAsyncThunk('admin/performance', async (params) =>
  (await AdminAPI.performance(params)).items
);
export const fetchUsers = createAsyncThunk('admin/users', async (params) =>
  (await AdminAPI.users(params)).items
);
export const updateUser = createAsyncThunk('admin/updateUser', async ({ id, body }, { rejectWithValue }) => {
  try { return (await AdminAPI.updateUser(id, body)).user; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const setUserActive = createAsyncThunk('admin/setActive', async ({ id, isActive }, { rejectWithValue }) => {
  try { return (await AdminAPI.setActive(id, isActive)).user; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const fetchOffices = createAsyncThunk('admin/offices', async () =>
  (await AdminAPI.offices()).items
);
export const createOffice = createAsyncThunk('admin/createOffice', async (body, { rejectWithValue }) => {
  try { return (await AdminAPI.createOffice(body)).office; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const updateOffice = createAsyncThunk('admin/updateOffice', async ({ id, body }, { rejectWithValue }) => {
  try { return (await AdminAPI.updateOffice(id, body)).office; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const slice = createSlice({
  name: 'admin',
  initialState: {
    dashboard: null,
    performance: [],
    users: [],
    offices: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.fulfilled, (s, a) => { s.dashboard = a.payload; })
      .addCase(fetchPerformance.fulfilled, (s, a) => { s.performance = a.payload; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.users = a.payload; })
      .addCase(updateUser.fulfilled, (s, a) => {
        const i = s.users.findIndex((u) => u._id === a.payload._id);
        if (i >= 0) s.users[i] = a.payload;
      })
      .addCase(setUserActive.fulfilled, (s, a) => {
        const i = s.users.findIndex((u) => u._id === a.payload._id);
        if (i >= 0) s.users[i] = a.payload;
      })
      .addCase(createUser.fulfilled, (s, a) => {
        s.users.unshift(a.payload);
      })
      .addCase(fetchOffices.fulfilled, (s, a) => { s.offices = a.payload; })
      .addCase(createOffice.fulfilled, (s, a) => { s.offices.unshift(a.payload); })
      .addCase(updateOffice.fulfilled, (s, a) => {
        const i = s.offices.findIndex((o) => o._id === a.payload._id);
        if (i >= 0) s.offices[i] = a.payload;
      });
  },
});

export default slice.reducer;
