import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentManagement from '../pages/admin/StudentManagement';
import BatchManagement from '../pages/admin/BatchManagement';
import TrainerManagement from '../pages/admin/TrainerManagement';
import AttendanceManagement from '../pages/admin/AttendanceManagement';
import PlacementManagement from '../pages/admin/PlacementManagement';
import RoomManagement from '../pages/admin/RoomManagement';
import RoomAllocation from '../pages/admin/RoomAllocation';
import RoomAvailability from '../pages/admin/RoomAvailability';
import ScheduleCalendar from '../pages/admin/ScheduleCalendar';
import Reports from '../pages/admin/Reports';
import DeviceResetManagement from '../pages/admin/DeviceResetManagement';

// Trainer Pages
import TrainerDashboard from '../pages/trainer/TrainerDashboard';
import TrainerBatchesPage from '../pages/trainer/TrainerBatchesPage';
import TrainerStudentsPage from '../pages/trainer/TrainerStudentsPage';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import QRClassSession from '../pages/trainer/QRClassSession';
import QRScanner from '../pages/student/QRScanner';
import PlacementReadiness from '../pages/student/PlacementReadiness';
import StudentScorecards from '../pages/student/StudentScorecards';
import StudentTrainingPage from '../pages/student/StudentTrainingPage';
import UserProfile from '../pages/common/UserProfile';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ADMIN DASHBOARDS */}
      <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']} />}>
        <Route 
          path="/admin" 
          element={
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <DashboardLayout>
              <StudentManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/batches" 
          element={
            <DashboardLayout>
              <BatchManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/trainers" 
          element={
            <DashboardLayout>
              <TrainerManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/attendance" 
          element={
            <DashboardLayout>
              <AttendanceManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/placement" 
          element={
            <DashboardLayout>
              <PlacementManagement />
            </DashboardLayout>
          } 
        />
        {/* SUPER ADMIN ONLY FEATURES */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
          <Route 
            path="/admin/rooms" 
            element={
              <DashboardLayout>
                <RoomManagement />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/allocations" 
            element={
              <DashboardLayout>
                <RoomAllocation />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/availability" 
            element={
              <DashboardLayout>
                <RoomAvailability />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/calendar" 
            element={
              <DashboardLayout>
                <ScheduleCalendar />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/device-resets" 
            element={
              <DashboardLayout>
                <DeviceResetManagement />
              </DashboardLayout>
            } 
          />
        </Route>

        <Route 
          path="/admin/reports" 
          element={
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/admin/profile" 
          element={
            <DashboardLayout>
              <UserProfile />
            </DashboardLayout>
          } 
        />
      </Route>

      {/* TRAINER DASHBOARDS */}
      <Route element={<ProtectedRoute allowedRoles={['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin']} />}>
        <Route 
          path="/trainer" 
          element={
            <DashboardLayout>
              <TrainerDashboard />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/batches" 
          element={
            <DashboardLayout>
              <TrainerBatchesPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/trainers" 
          element={
            <DashboardLayout>
              <TrainerManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/students" 
          element={
            <DashboardLayout>
              <TrainerStudentsPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/attendance" 
          element={
            <DashboardLayout>
              <TrainerDashboard />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/scores" 
          element={
            <DashboardLayout>
              <TrainerDashboard />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/session" 
          element={
            <DashboardLayout>
              <QRClassSession />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/trainer/profile" 
          element={
            <DashboardLayout>
              <UserProfile />
            </DashboardLayout>
          } 
        />
      </Route>

      {/* STUDENT DASHBOARDS */}
      <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
        <Route 
          path="/student" 
          element={
            <DashboardLayout>
              <StudentDashboard />
            </DashboardLayout>
          } 
        />
        <Route
          path="/student/training"
          element={
            <DashboardLayout>
              <StudentTrainingPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/student/profile"
          element={
            <DashboardLayout>
              <StudentProfile />
            </DashboardLayout>
          }
        />
        <Route 
          path="/student/scanner" 
          element={
            <DashboardLayout>
              <QRScanner />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/student/placement" 
          element={
            <DashboardLayout>
              <PlacementReadiness />
            </DashboardLayout>
          } 
        />
        <Route
          path="/student/scorecards"
          element={
            <DashboardLayout>
              <StudentScorecards />
            </DashboardLayout>
          }
        />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
