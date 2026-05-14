import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import SidebarLayout from './components/common/SidebarLayout.jsx';
import { fetchMe, selectUser, selectToken } from './store/slices/auth.js';
import { normalizeRole } from './utils/roles.js';

// Admin (MVP)
import DashboardPage from './pages/admin/DashboardPage.jsx';
import CollegesPage from './pages/admin/CollegesPage.jsx';
import BatchesPage from './pages/admin/BatchesPage.jsx';
import StudentsPage from './pages/admin/StudentsPage.jsx';
import TrainersPage from './pages/admin/TrainersPage.jsx';
import BulkUploadPage from './pages/admin/BulkUploadPage.jsx';
import AttendancePage from './pages/admin/AttendancePage.jsx';
import StaffContactsPage from './pages/admin/StaffContactsPage.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import LoginHistoryPage from './pages/LoginHistoryPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';

// Legacy (kept as fallbacks where existing UI helps)
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';

function Landing() {
  const user = useSelector(selectUser);
  if (!user) return <Navigate to="/login" replace />;
  const role = normalizeRole(user.role);
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'trainer') return <Navigate to="/trainer" replace />;
  return <Navigate to="/user" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [token, user, dispatch]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
          <Route path="/" element={<Landing />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin/colleges" element={<ProtectedRoute roles={['admin']}><CollegesPage /></ProtectedRoute>} />
          <Route path="/admin/batches" element={<ProtectedRoute roles={['admin']}><BatchesPage /></ProtectedRoute>} />
          <Route path="/admin/trainers" element={<ProtectedRoute roles={['admin']}><TrainersPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/admin/students/bulk-upload" element={<ProtectedRoute roles={['admin']}><BulkUploadPage /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin', 'trainer']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/admin/staff-contacts" element={<ProtectedRoute roles={['admin']}><StaffContactsPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'trainer']}><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/login-history" element={<ProtectedRoute roles={['admin']}><LoginHistoryPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />

          {/* Trainer */}
          <Route path="/trainer" element={<ProtectedRoute roles={['trainer']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/trainer/students" element={<ProtectedRoute roles={['trainer']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/trainer/attendance" element={<ProtectedRoute roles={['trainer']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/trainer/reports" element={<ProtectedRoute roles={['trainer']}><ReportsPage /></ProtectedRoute>} />

          {/* User (student) */}
          <Route path="/user" element={<ProtectedRoute roles={['user']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/user/mark" element={<ProtectedRoute roles={['user']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/user/history" element={<ProtectedRoute roles={['user']}><StudentDashboard /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
