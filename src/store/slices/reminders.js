import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReminderAPI } from '../../api/endpoints';

export const fetchReminderPreview = createAsyncThunk('reminders/preview', async (params) =>
  ReminderAPI.preview(params)
);
export const fetchTrainerPreview = createAsyncThunk(
  'reminders/previewTrainer',
  async ({ trainerId, params }) => ReminderAPI.previewTrainer(trainerId, params)
);
export const sendTrainerMail = createAsyncThunk(
  'reminders/sendTrainer',
  async ({ trainerId, body }, { rejectWithValue }) => {
    try { return await ReminderAPI.sendTrainer(trainerId, body); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const sendAllTrainersMail = createAsyncThunk(
  'reminders/sendAll',
  async (body, { rejectWithValue }) => {
    try { return await ReminderAPI.sendAllTrainers(body); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);
export const runAdminMail = createAsyncThunk(
  'reminders/runAdmin',
  async (body, { rejectWithValue }) => {
    try { return await ReminderAPI.runAdmin(body); }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
  }
);

const slice = createSlice({
  name: 'reminders',
  initialState: { preview: null, trainerPreview: null, lastSend: null, status: 'idle', error: null },
  reducers: { clearTrainerPreview: (s) => { s.trainerPreview = null; } },
  extraReducers: (b) => {
    b.addCase(fetchReminderPreview.fulfilled, (s, a) => { s.preview = a.payload; })
      .addCase(fetchTrainerPreview.fulfilled, (s, a) => { s.trainerPreview = a.payload; })
      .addCase(sendTrainerMail.fulfilled, (s, a) => { s.lastSend = a.payload; })
      .addCase(sendAllTrainersMail.fulfilled, (s, a) => { s.lastSend = a.payload; })
      .addCase(runAdminMail.fulfilled, (s, a) => { s.lastSend = a.payload; });
  },
});

export const { clearTrainerPreview } = slice.actions;
export default slice.reducer;
