import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TaskAPI } from '../../api/endpoints';

export const fetchMyTasks = createAsyncThunk('task/mine', async (params) =>
  (await TaskAPI.mine(params)).items
);
export const fetchCreatedTasks = createAsyncThunk('task/list', async (params) =>
  (await TaskAPI.list(params)).items
);
export const createTask = createAsyncThunk('task/create', async (body, { rejectWithValue }) => {
  try { return (await TaskAPI.create(body)).task; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const updateTask = createAsyncThunk('task/update', async ({ id, body }, { rejectWithValue }) => {
  try { return (await TaskAPI.update(id, body)).task; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const deleteTask = createAsyncThunk('task/delete', async (id, { rejectWithValue }) => {
  try { await TaskAPI.remove(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const slice = createSlice({
  name: 'task',
  initialState: { mine: [], created: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyTasks.fulfilled, (s, a) => { s.mine = a.payload; })
      .addCase(fetchCreatedTasks.fulfilled, (s, a) => { s.created = a.payload; })
      .addCase(createTask.fulfilled, (s, a) => { s.created.unshift(a.payload); })
      .addCase(updateTask.fulfilled, (s, a) => {
        for (const arr of [s.mine, s.created]) {
          const i = arr.findIndex((t) => t._id === a.payload._id);
          if (i >= 0) arr[i] = a.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (s, a) => {
        s.created = s.created.filter((t) => t._id !== a.payload);
        s.mine = s.mine.filter((t) => t._id !== a.payload);
      });
  },
});

export default slice.reducer;
