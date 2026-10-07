import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Permission } from './auth/permissions';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth, RequirePermission } from './auth/RequireAuth';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import EmployeeDetail from './pages/EmployeeDetail';
import Employees from './pages/Employees';
import Forbidden from './pages/Forbidden';
import Leaves from './pages/Leaves';
import Login from './pages/Login';
import Organization from './pages/Organization';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route
                path="/"
                element={
                  <RequirePermission permission={Permission.DASHBOARD_VIEW}>
                    <Dashboard />
                  </RequirePermission>
                }
              />
              <Route
                path="/employees"
                element={
                  <RequirePermission permission={Permission.EMPLOYEES_VIEW}>
                    <Employees />
                  </RequirePermission>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <RequirePermission permission={Permission.EMPLOYEES_VIEW}>
                    <EmployeeDetail />
                  </RequirePermission>
                }
              />
              <Route
                path="/leaves"
                element={
                  <RequirePermission permission={Permission.LEAVES_VIEW}>
                    <Leaves />
                  </RequirePermission>
                }
              />
              <Route
                path="/attendance"
                element={
                  <RequirePermission permission={Permission.ATTENDANCE_VIEW}>
                    <Attendance />
                  </RequirePermission>
                }
              />
              <Route
                path="/payroll"
                element={
                  <RequirePermission permission={Permission.PAYROLL_VIEW}>
                    <Payroll />
                  </RequirePermission>
                }
              />
              <Route
                path="/documents"
                element={
                  <RequirePermission permission={Permission.DOCUMENTS_VIEW}>
                    <Documents />
                  </RequirePermission>
                }
              />
              <Route
                path="/performance"
                element={
                  <RequirePermission permission={Permission.PERFORMANCE_VIEW}>
                    <Performance />
                  </RequirePermission>
                }
              />
              <Route
                path="/organization"
                element={
                  <RequirePermission permission={Permission.ORGANIZATION_VIEW}>
                    <Organization />
                  </RequirePermission>
                }
              />
              <Route
                path="/announcements"
                element={
                  <RequirePermission permission={Permission.ANNOUNCEMENTS_VIEW}>
                    <Announcements />
                  </RequirePermission>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequirePermission permission={Permission.SETTINGS_VIEW}>
                    <Settings />
                  </RequirePermission>
                }
              />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
