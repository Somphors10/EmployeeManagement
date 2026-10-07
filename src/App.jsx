import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import EmployeeDetail from './pages/EmployeeDetail';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Organization from './pages/Organization';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
