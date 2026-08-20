import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

// Route-level code splitting via dynamic imports for blazing-fast initial bundle loading
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExamsPage = lazy(() => import("./pages/ExamsPage"));
const ExamDetailPage = lazy(() => import("./pages/ExamDetailPage"));
const ExamTakingPage = lazy(() => import("./pages/ExamTakingPage"));
const ExamResultPage = lazy(() => import("./pages/ExamResultPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

const RouteSuspenseFallback = () => (
  <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
    <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
    <span className="text-xs font-semibold text-slate-400">Loading module...</span>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<RouteSuspenseFallback />}>
      <Routes>
        {/* Auth route */}
        <Route path="/login" element={<LoginPage />} />
        {/* Main app layout routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exams/:examId" element={<ExamDetailPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        {/* Full-screen exam flow routes */}
        <Route path="/exams/:examId/take" element={<ExamTakingPage />} />
        <Route path="/exams/:examId/result" element={<ExamResultPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
