import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DailyWork from './pages/DailyWork.jsx';
import Reports from './pages/Reports.jsx';
import ReviewSheet from './pages/ReviewSheet.jsx';
import LoginHistoryPage from './pages/LoginHistoryPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppLayout from './components/common/AppLayout.jsx';
import { fetchMe, selectUser, selectToken } from './store/slices/auth.js';

function Landing() {
  const user = useSelector(selectUser);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [token, user, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Landing />} />

        <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/daily-work" element={<ProtectedRoute roles={['student']}><DailyWork /></ProtectedRoute>} />
        <Route path="/student/reviews" element={<ProtectedRoute roles={['student']}><ReviewSheet /></ProtectedRoute>} />

        <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/reviews" element={<ProtectedRoute roles={['teacher']}><ReviewSheet /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'teacher']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/login-history" element={<ProtectedRoute roles={['admin']}><LoginHistoryPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
