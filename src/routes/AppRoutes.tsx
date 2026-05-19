import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DriverLayout from '../layouts/DriverLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import CompleteRegistrationPage from '../pages/CompleteRegistrationPage';
import AnalyticsPage from '../pages/driver/AnalyticsPage';
import DriverOrdersPage from '../pages/driver/DriverOrdersPage';
import DriverSettingsPage from '../pages/driver/DriverSettingsPage';
import DriverShiftPage from '../pages/driver/DriverShiftPage';
import LoginPage from '../pages/LoginPage';
import DevelopmentPage from '../pages/manager/DevelopmentPage';
import DriversPage from '../pages/manager/DriversPage';
import ManagersPage from '../pages/manager/ManagersPage';
import RidesPage from '../pages/manager/RidesPage';
import SettingsPage from '../pages/manager/SettingsPage';
import WhitelistPage from '../pages/manager/WhitelistPage';

export default function AppRoutes() {
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
          <Route path="analytics/:driverProfileId" element={<AnalyticsPage />} />
          <Route path="development" element={<DevelopmentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="Driver" />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<Navigate to="/driver/shift" replace />} />
          <Route path="dashboard" element={<Navigate to="/driver/shift" replace />} />
          <Route path="shift" element={<DriverShiftPage />} />
          <Route path="orders" element={<DriverOrdersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<DriverSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
