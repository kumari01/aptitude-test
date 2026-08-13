import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ExamsPage from "./pages/ExamsPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamTakingPage from "./pages/ExamTakingPage";
import ExamResultPage from "./pages/ExamResultPage";
import ResultsPage from "./pages/ResultsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  return (
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
  );
}
