import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthAPI } from '../../api/endpoints';

const safeJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

// Normalises both legacy `{ token, user }` and MVP `{ success, message, data: { accessToken, refreshToken, user } }`.
function unwrap(res) {
  const payload = res?.data || res || {};
  return {
    token: payload.accessToken || payload.token || null,
    refreshToken: payload.refreshToken || null,
    user: payload.user || null,
  };
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await AuthAPI.login(email, password);
      const { token, refreshToken, user } = unwrap(res);
      if (!token || !user) return rejectWithValue('Unexpected login response');
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await AuthAPI.logout(); } catch {}
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
});

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const res = await AuthAPI.me();
  // MVP: { success, message, data: { role, profile } }  | Legacy: { user }
  const payload = res?.data || res || {};
  const user = payload.user || payload.profile || (payload.profile ? { ...payload.profile, role: payload.role } : null);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  return user;
});

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: safeJSON(localStorage.getItem('user')),
    token: localStorage.getItem('token') || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.user = a.payload.user;
        s.token = a.payload.token;
      })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(logout.fulfilled, (s) => {
        s.user = null; s.token = null; s.status = 'idle'; s.error = null;
      })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; });
  },
});

export const { clearAuth } = slice.actions;
export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
export const selectAuthLoading = (s) => s.auth.status === 'loading';
export default slice.reducer;
