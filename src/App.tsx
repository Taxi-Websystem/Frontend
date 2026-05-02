import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute requiredRole="Manager" />}>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute requiredRole="Driver" />}>
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
