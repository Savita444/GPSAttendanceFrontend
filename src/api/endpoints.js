import api from './axios';

export const AuthAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  history: (uid) => api.get(`/auth/login-history/${uid || ''}`).then((r) => r.data),
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
};

export const AttendanceAPI = {
  checkIn: (payload) => api.post('/attendance/check-in', payload).then((r) => r.data),
  checkOut: (payload) => api.post('/attendance/check-out', payload).then((r) => r.data),
  today: () => api.get('/attendance/today').then((r) => r.data),
  history: (params) => api.get('/attendance/history', { params }).then((r) => r.data),
  summary: (params) => api.get('/attendance/summary', { params }).then((r) => r.data),
};

export const StudentAPI = {
  dashboard: () => api.get('/student/dashboard').then((r) => r.data),
};

export const TeacherAPI = {
  students: () => api.get('/teacher/students').then((r) => r.data),
  stats: () => api.get('/teacher/stats').then((r) => r.data),
  studentSummary: (id, params) => api.get(`/teacher/student/${id}/summary`, { params }).then((r) => r.data),
  studentDetails: (id, params) => api.get(`/teacher/student/${id}/details`, { params }).then((r) => r.data),
};

export const TaskAPI = {
  mine: (params) => api.get('/tasks/mine', { params }).then((r) => r.data),
  list: (params) => api.get('/tasks', { params }).then((r) => r.data),
  create: (body) => api.post('/tasks', body).then((r) => r.data),
  update: (id, body) => api.patch(`/tasks/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

export const AdminAPI = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  performance: (params) => api.get('/admin/performance', { params }).then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUser: (id, body) => api.patch(`/admin/users/${id}`, body).then((r) => r.data),
  setActive: (id, isActive) => api.patch(`/admin/users/${id}/active`, { isActive }).then((r) => r.data),
  offices: () => api.get('/admin/offices').then((r) => r.data),
  createOffice: (body) => api.post('/admin/offices', body).then((r) => r.data),
  updateOffice: (id, body) => api.patch(`/admin/offices/${id}`, body).then((r) => r.data),
};

export const DailyWorkAPI = {
  submit: (body) => api.post('/daily-work', body).then((r) => r.data),
  mine: (params) => api.get('/daily-work/mine', { params }).then((r) => r.data),
  list: (params) => api.get('/daily-work', { params }).then((r) => r.data),
  review: (id, body) => api.patch(`/daily-work/${id}/review`, body).then((r) => r.data),
};

export const ReviewAPI = {
  upsert: (body) => api.post('/review', body).then((r) => r.data),
  list: (params) => api.get('/review', { params }).then((r) => r.data),
  get: (id) => api.get(`/review/${id}`).then((r) => r.data),
  sendEmail: (id) => api.post(`/review/${id}/send-email`).then((r) => r.data),
};

export const ReportAPI = {
  json: (params) => api.get('/reports/attendance', { params }).then((r) => r.data),
  excelUrl: (params) => `/api/reports/attendance/excel?${new URLSearchParams(params)}`,
  pdfUrl: (params) => `/api/reports/attendance/pdf?${new URLSearchParams(params)}`,
};

// ---------- MVP backend (Attendance Management System) ----------

// Admin / Trainer accounts (password login)
export const UserMvpAPI = {
  list: (params) => api.get('/users', { params }).then((r) => r.data?.data ?? r.data),
  create: (body) => api.post('/users', body).then((r) => r.data?.data ?? r.data),
  update: (id, body) => api.put(`/users/${id}`, body).then((r) => r.data?.data ?? r.data),
  disable: (id) => api.delete(`/users/${id}`).then((r) => r.data?.data ?? r.data),
};

export const CollegeAPI = {
  list: (params) => api.get('/colleges', { params }).then((r) => r.data?.data ?? r.data),
  get: (id) => api.get(`/colleges/${id}`).then((r) => r.data?.data ?? r.data),
  create: (body) => api.post('/colleges', body).then((r) => r.data?.data ?? r.data),
  update: (id, body) => api.put(`/colleges/${id}`, body).then((r) => r.data?.data ?? r.data),
  disable: (id) => api.delete(`/colleges/${id}`).then((r) => r.data?.data ?? r.data),
};

export const BatchAPI = {
  list: (params) => api.get('/batches', { params }).then((r) => r.data?.data ?? r.data),
  get: (id) => api.get(`/batches/${id}`).then((r) => r.data?.data ?? r.data),
  create: (body) => api.post('/batches', body).then((r) => r.data?.data ?? r.data),
  update: (id, body) => api.put(`/batches/${id}`, body).then((r) => r.data?.data ?? r.data),
  disable: (id) => api.delete(`/batches/${id}`).then((r) => r.data?.data ?? r.data),
};

export const StudentMasterAPI = {
  list: (params) => api.get('/students', { params }).then((r) => r.data?.data ?? r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data?.data ?? r.data),
  create: (body) => api.post('/students', body).then((r) => r.data?.data ?? r.data),
  update: (id, body) => api.put(`/students/${id}`, body).then((r) => r.data?.data ?? r.data),
  disable: (id) => api.delete(`/students/${id}`).then((r) => r.data?.data ?? r.data),
  bulkPreview: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/students/bulk/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data?.data ?? r.data);
  },
  bulkImport: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/students/bulk/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data?.data ?? r.data);
  },
};

export const StaffContactAPI = {
  list: (params) => api.get('/staff-contacts', { params }).then((r) => r.data?.data ?? r.data),
  create: (body) => api.post('/staff-contacts', body).then((r) => r.data?.data ?? r.data),
  update: (id, body) => api.put(`/staff-contacts/${id}`, body).then((r) => r.data?.data ?? r.data),
  remove: (id) => api.delete(`/staff-contacts/${id}`).then((r) => r.data?.data ?? r.data),
};

export const AttendanceMVP = {
  mark: (formData) =>
    api.post('/attendance/mark', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data?.data ?? r.data),
  myHistory: (params) => api.get('/attendance/me', { params }).then((r) => r.data?.data ?? r.data),
  list: (params) => api.get('/attendance', { params }).then((r) => r.data?.data ?? r.data),
  forStudent: (studentId) => api.get(`/attendance/student/${studentId}`).then((r) => r.data?.data ?? r.data),
};

export const DashboardAPI = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data?.data ?? r.data),
  insights: () => api.get('/dashboard/insights').then((r) => r.data?.data ?? r.data),
};

export const SettingsAPI = {
  get: () => api.get('/settings').then((r) => r.data?.data ?? r.data),
  update: (body) => api.put('/settings', body).then((r) => r.data?.data ?? r.data),
};

export const ReportMVPAPI = {
  list: (params) => api.get('/reports', { params }).then((r) => r.data?.data ?? r.data),
  get: (id) => api.get(`/reports/${id}`).then((r) => r.data?.data ?? r.data),
  generateForBatch: (batchId, body) => api.post(`/reports/batch/${batchId}`, body || {}).then((r) => r.data?.data ?? r.data),
  generateWeeklyAll: () => api.post('/reports/weekly/run-now').then((r) => r.data?.data ?? r.data),
};

export const ReminderAPI = {
  preview: (params) => api.get('/reminders/fortnightly/preview', { params }).then((r) => r.data),
  previewTrainer: (trainerId, params) =>
    api.get(`/reminders/fortnightly/preview/${trainerId}`, { params }).then((r) => r.data),
  sendTrainer: (trainerId, body) =>
    api.post(`/reminders/fortnightly/send-trainer/${trainerId}`, body || {}).then((r) => r.data),
  sendAllTrainers: (body) =>
    api.post('/reminders/fortnightly/send-all-trainers', body || {}).then((r) => r.data),
  runAdmin: (body) =>
    api.post('/reminders/fortnightly/run-admin', body || {}).then((r) => r.data),
};
