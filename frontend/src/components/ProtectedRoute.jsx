import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to fallback dashboard depending on role
    if (user.role === 'Admin' || user.role === 'Super Admin') return <Navigate to="/admin" replace />;
    if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(user.role)) {
      return <Navigate to="/trainer" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
