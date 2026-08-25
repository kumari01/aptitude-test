import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RouteGuardSpinner = () => (
  <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
    <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
    <span className="text-xs font-semibold text-slate-400">Verifying authentication...</span>
  </div>
);

/**
 * Guard for authenticated users (Students and Admins)
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteGuardSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * Guard strictly for Admin users
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteGuardSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * Guard for public-only routes (e.g. /login) — redirects logged-in users to their dashboard
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteGuardSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
