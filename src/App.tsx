import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CompleteRegistrationPage from './pages/CompleteRegistrationPage';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerLayout from './layouts/ManagerLayout';
import DriverLayout from './layouts/DriverLayout';
import WhitelistPage from './pages/manager/WhitelistPage';
import ManagersPage from './pages/manager/ManagersPage';
import DriversPage from './pages/manager/DriversPage';
import SettingsPage from './pages/manager/SettingsPage';
import RidesPage from './pages/manager/RidesPage';
import DevelopmentPage from './pages/manager/DevelopmentPage';
import DriverShiftPage from './pages/driver/DriverShiftPage';
import DriverSettingsPage from './pages/driver/DriverSettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/complete-registration" element={<CompleteRegistrationPage />} />

      <Route element={<ProtectedRoute requiredRole="Manager" />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/whitelist" replace />} />
          <Route path="dashboard" element={<Navigate to="/manager/whitelist" replace />} />
          <Route path="whitelist" element={<WhitelistPage />} />
          <Route path="managers" element={<ManagersPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="development" element={<DevelopmentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="Driver" />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<Navigate to="/driver/shift" replace />} />
          <Route path="dashboard" element={<Navigate to="/driver/shift" replace />} />
          <Route path="shift" element={<DriverShiftPage />} />
          <Route path="settings" element={<DriverSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
