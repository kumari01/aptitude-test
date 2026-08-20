import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Search, 
  Users, 
  AlertTriangle, 
  ChevronRight, 
  BarChart3, 
  Filter, 
  Calendar,
  Layers,
  Sparkles,
  LayoutGrid,
  List,
  RotateCcw,
  ShieldCheck,
  X
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { AdminDashboardSkeleton } from "../components/skeletons";

export function AdminDashboardPage() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Exam for Detailed Drill-Down View (null = Overview Grid)
  const [selectedExamId, setSelectedExamId] = useState(null);
  
  // View mode switcher for assessment cards: "grid" (boxes) vs "list" (single row cards) - default is "list" (rows)
  const [viewMode, setViewMode] = useState("list");
  
  // Search and Filter states
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "passed" | "failed" | "in_progress" | "disqualified"

  // Re-Authorization Confirmation Modal State
  const [reauthCandidate, setReauthCandidate] = useState(null);
  const [isReauthorizing, setIsReauthorizing] = useState(false);

  const confirmReauthorize = async () => {
    if (!reauthCandidate?.attemptId) return;
    setIsReauthorizing(true);
    try {
      await api.post(`/test-management/admin/attempts/${reauthCandidate.attemptId}/reauthorize`);
      toast.success(`Successfully re-authorized ${reauthCandidate.studentName || "candidate"}. They can now write the exam.`);
      // Remove attempt in local attempts state so UI updates instantly
      setAttempts(prev => prev.filter(a => a.id !== reauthCandidate.attemptId && a._id !== reauthCandidate.attemptId));
      setReauthCandidate(null);
    } catch (err) {
      console.error("Failed to re-authorize candidate:", err);
      toast.error(err.response?.data?.message || "Failed to re-authorize candidate");
    } finally {
      setIsReauthorizing(false);
    }
  };

  // Overview metrics
  const [overviewStats, setOverviewStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    draftExams: 0,
    totalSchedules: 0,
    totalAttempts: 0,
    disqualifiedAttempts: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [allRes, overviewRes, attemptsRes] = await Promise.all([
        api.get("/test-management/admin/all").catch(() => null),
        api.get("/test-management/admin/overview").catch(() => null),
        api.get("/test-management/admin/attempts").catch(() => null),
      ]);

      if (allRes?.data?.tests) {
        setTests(allRes.data.tests);
      }

      if (overviewRes?.data) {
        setOverviewStats(overviewRes.data);
      }

      if (attemptsRes?.data?.attempts) {
        setAttempts(attemptsRes.data.attempts);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  // Safe string ID normalizer
  const normalizeId = (val) => {
    if (!val) return "";
    if (typeof val === "object") {
      if (val._id) return String(val._id);
      if (val.id) return String(val.id);
    }
    return String(val);
  };

  // Selected Exam Object for Drill-down
  const activeExamItem = selectedExamId
    ? tests.find((t) => normalizeId(t.test?._id || t.test?.id || t._id || t.id) === normalizeId(selectedExamId))
    : null;

  // Filter attempts for the selected exam
  const examAttempts = selectedExamId
    ? attempts.filter((a) => {
        const aTestId = normalizeId(a.testId?._id || a.testId?.id || a.testId || a.exam_id?._id || a.exam_id?.id || a.exam_id);
        return aTestId === normalizeId(selectedExamId);
      })
    : [];

  // Filtered students in drilldown table
  const filteredStudents = examAttempts.filter((att) => {
    // Search query match
    if (studentSearchQuery) {
      const q = studentSearchQuery.toLowerCase();
      const matchName = (att.studentName || "").toLowerCase().includes(q);
      const matchRoll = (att.rollNumber || "").toLowerCase().includes(q);
      const matchDept = (att.department || "").toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchDept) return false;
    }

    // Status filter match
    if (statusFilter === "passed") return (att.score ?? 0) >= 40 && att.status !== "Disqualified" && att.status !== "Auto Submitted";
    if (statusFilter === "failed") return (att.score ?? 0) < 40 && att.status !== "Started" && att.status !== "Disqualified" && att.status !== "Auto Submitted";
    if (statusFilter === "in_progress") return att.status === "Started";
    if (statusFilter === "disqualified") return att.status === "Disqualified" || att.status === "Auto Submitted";

    return true;
  });

  // Calculate drilldown metrics for selected exam
  const totalExamParticipants = examAttempts.length;
  const passedStudentsCount = examAttempts.filter((a) => (a.score ?? 0) >= 40 && a.status !== "Disqualified" && a.status !== "Auto Submitted").length;
  const passRate = totalExamParticipants > 0 ? Math.round((passedStudentsCount / totalExamParticipants) * 100) : 0;
  const avgScore = totalExamParticipants > 0 ? Math.round(examAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalExamParticipants) : 0;
  const flaggedCount = examAttempts.filter((a) => (a.violations > 0 || a.tabSwitches > 0 || a.status === "Disqualified" || a.status === "Auto Submitted")).length;

  // ================= DRILL-DOWN VIEW (STUDENT LIST & EXAM INSIGHTS) =================
  if (selectedExamId && activeExamItem) {
    const t = activeExamItem.test || {};
    const schedule = activeExamItem.schedule || {};

    return (
      <div className="px-3 sm:px-5 lg:px-6 py-4 w-full space-y-5 animate-fade-in">
        {/* Top Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedExamId(null);
                setStudentSearchQuery("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> All Weekly Exams
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
                  {t.title}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {t.category || t.testType || "Aptitude"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.totalQuestions || 10} Questions • {t.durationMinutes || 30} Minutes • Total Marks: {t.totalMarks || 10}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              t.status === "Published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-700"
            }`}>
              {t.status === "Published" ? "● Active & Live" : "Draft"}
            </span>
          </div>
        </div>

        {/* 4 Exam-Specific Telemetry Insights Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attempted</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Users size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalExamParticipants}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Students submitted</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pass Rate</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{passRate}%</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{passedStudentsCount} of {totalExamParticipants} passed</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Score</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><TrendingUp size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-purple-700">{avgScore}%</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Mean student performance</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proctoring Flags</span>
              <div className="p-2 rounded-xl bg-red-50 text-red-600"><ShieldAlert size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-red-600">{flaggedCount}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Violations / Disqualifications</div>
          </div>
        </div>

        {/* Search, Filter & Students Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: "all", label: "All", count: totalExamParticipants },
                { key: "passed", label: "Passed", count: passedStudentsCount },
                { key: "failed", label: "Failed", count: examAttempts.filter(a => (a.score ?? 0) < 40 && a.status !== "Started" && a.status !== "Disqualified" && a.status !== "Auto Submitted").length },
                { key: "in_progress", label: "In Progress", count: examAttempts.filter(a => a.status === "Started").length },
                { key: "disqualified", label: "Disqualified", count: examAttempts.filter(a => a.status === "Disqualified" || a.status === "Auto Submitted").length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Student Search Input */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-indigo-500 transition-all w-full md:w-72">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-800 outline-none font-medium placeholder-gray-400"
              />
            </div>
          </div>

          {/* Telemetry Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <User size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-gray-700 text-sm">No student attempt records match this view.</p>
              <p className="text-xs text-gray-400 mt-1">Student submissions for this exam will appear here in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-gray-50 text-[11px] text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">STUDENT & ROLL NUMBER</th>
                    <th className="px-4 py-3">DEPARTMENT</th>
                    <th className="px-4 py-3">MARKS OBTAINED</th>
                    <th className="px-4 py-3">SCORE (%)</th>
                    <th className="px-4 py-3">PROCTORING VIOLATIONS</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">DATE & TIME</th>
                    <th className="px-4 py-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredStudents.map((att) => (
                    <tr key={att.id || att._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">{att.studentName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">Roll: {att.rollNumber}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-600 text-xs">
                        {att.department || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {att.status === "Started" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100">
                            <Clock size={11} className="animate-spin text-blue-600" /> In Progress
                          </span>
                        ) : att.status === "Disqualified" || att.status === "Auto Submitted" ? (
                          <span className="font-bold text-red-700 text-xs sm:text-sm font-mono">
                            0 / {att.totalMarks || t.totalMarks || 10}
                          </span>
                        ) : (
                          <span className="font-bold text-gray-900 text-xs sm:text-sm font-mono">
                            {att.obtainedMarks ?? 0} / {att.totalMarks || t.totalMarks || 10}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {att.status === "Started" ? (
                          <span className="text-gray-400 text-xs font-medium">—</span>
                        ) : att.status === "Disqualified" || att.status === "Auto Submitted" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            0% (Disqualified)
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            (att.score ?? 0) >= 40 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {att.score ?? 0}% ({(att.score ?? 0) >= 40 ? "Passed" : "Failed"})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold w-fit ${
                            (att.violations > 0 || att.tabSwitches > 0)
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            <ShieldAlert size={11} className={(att.violations > 0 || att.tabSwitches > 0) ? "text-red-600" : "text-emerald-600"} />
                            {(att.violations !== undefined && att.violations !== null && att.violations > 0)
                              ? `${att.violations} violation${att.violations > 1 ? "s" : ""}`
                              : (att.tabSwitches > 0 ? `${att.tabSwitches} switches` : "0 (Clean)")}
                          </span>
                          {att.riskScore > 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              Risk: {att.riskScore}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          att.status === "Auto Submitted" || att.status === "Disqualified"
                            ? "bg-red-100 text-red-700"
                            : att.status === "Time Expired"
                            ? "bg-amber-100 text-amber-800"
                            : att.status === "Started"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {att.status === "Started" ? "In Progress" : (att.status || "Submitted")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">
                        {new Date(att.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {att.status === "Disqualified" || att.status === "Auto Submitted" || att.status === "Time Expired" || (att.violations > 0 && (att.score ?? 0) < 40) ? (
                          <button
                            type="button"
                            onClick={() => setReauthCandidate({
                              attemptId: att.id || att._id,
                              studentName: att.studentName,
                              rollNumber: att.rollNumber,
                              department: att.department,
                              examTitle: t.title,
                              violations: att.violations ?? att.tabSwitches ?? 0,
                              riskScore: att.riskScore ?? 0,
                              score: att.score ?? 0
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                            title="Reset violations & allow this candidate to retake the exam"
                          >
                            <RotateCcw size={12} /> Allow Retake
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400">
                            Attempt Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Re-Authorization Warning Confirmation Popup Modal */}
        {reauthCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-5">
              {/* Header with Warning Shield Badge */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600 shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: FONT_DISPLAY }}>
                    Re-Authorize Candidate Attempt?
                  </h3>
                  <p className="text-xs text-slate-500">
                    This action will reset previous proctoring violations and unlock the examination for this candidate.
                  </p>
                </div>
              </div>

              {/* Candidate Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{reauthCandidate.studentName || "Student"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-800">{reauthCandidate.rollNumber || "—"}</span>
                </div>
                {reauthCandidate.department && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Department:</span>
                    <span className="font-bold text-slate-700">{reauthCandidate.department}</span>
                  </div>
                )}
                {reauthCandidate.examTitle && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Examination:</span>
                    <span className="font-bold text-indigo-700 truncate max-w-[200px]">{reauthCandidate.examTitle}</span>
                  </div>
                )}
              </div>

              {/* Warning Notice Banner */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">What happens next:</span> The candidate's flagged attempt will be reset. They can immediately log into their portal and take the exam fresh under standard proctoring rules.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isReauthorizing}
                  onClick={() => setReauthCandidate(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  disabled={isReauthorizing}
                  onClick={confirmReauthorize}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isReauthorizing ? (
                    <>
                      <RotateCcw size={14} className="animate-spin" />
                      Re-Authorizing...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      Yes, Authorize Retake
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= MAIN OVERVIEW VIEW (WEEKLY ASSESSMENT CARDS) =================
  const filteredTestsList = tests.filter((item) => {
    if (!examSearchQuery) return true;
    const q = examSearchQuery.toLowerCase();
    const t = item.test || {};
    return (
      (t.title || "").toLowerCase().includes(q) ||
      (t.category || t.testType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-3 sm:px-5 lg:px-6 py-4 w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            Weekly Examinations Overview
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Select any weekly assessment to view real-time student attempt telemetry and performance insights
          </p>
        </div>
      </div>

      {/* Global Admin Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Managed Exams"
          value={overviewStats.totalExams || tests.length}
          icon={<FileText size={18} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Published & Live"
          value={overviewStats.publishedExams || tests.filter(t => t.test?.status === "Published").length}
          icon={<CheckCircle2 size={18} />}
          iconBg="#D1FAE5"
          iconColor="#059669"
        />
        <StatCard
          label="Total Student Attempts"
          value={attempts.length || overviewStats.totalAttempts || 0}
          icon={<Clock size={18} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Flagged Violations"
          value={attempts.filter(a => a.status === "Auto Submitted" || a.status === "Disqualified" || a.violations > 0).length}
          icon={<ShieldAlert size={18} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
      </div>

      {/* Weekly Assessments Section Header & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              Weekly Assessment Cards
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Click any exam card to drill down into student submissions and test analytics.</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-500 transition-all flex-1 sm:w-64">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search weekly exam..."
                value={examSearchQuery}
                onChange={(e) => setExamSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-800 outline-none font-medium placeholder-gray-400"
              />
            </div>

            {/* View Mode Toggle Switch (Boxes vs Single Row Cards) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Box View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <LayoutGrid size={15} />
                <span className="hidden md:inline">Boxes</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Single Row Card View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <List size={15} />
                <span className="hidden md:inline">Rows</span>
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Cards Display (Grid Box View or Single Row Card View) */}
        {filteredTestsList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <h4 className="text-base font-bold text-gray-800" style={{ fontFamily: FONT_DISPLAY }}>No examinations found</h4>
            <p className="text-xs text-gray-400 mt-1">Create or publish an exam to observe weekly student performance telemetry.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* ============= 1. GRID BOXES VIEW ============= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestsList.map((item, idx) => {
              const t = item.test || {};
              const tId = t._id || t.id || item.id;
              const schedule = item.schedule || {};

              // Calculate metrics for this card
              const cardAttempts = attempts.filter(a => {
                const aId = normalizeId(a.testId?._id || a.testId?.id || a.testId || a.exam_id?._id || a.exam_id?.id || a.exam_id);
                return aId === normalizeId(tId);
              });

              const participantCount = cardAttempts.length;
              const cardPassedCount = cardAttempts.filter(a => (a.score ?? 0) >= 40 && a.status !== "Disqualified" && a.status !== "Auto Submitted").length;
              const cardPassRate = participantCount > 0 ? Math.round((cardPassedCount / participantCount) * 100) : 0;
              const cardAvgScore = participantCount > 0 ? Math.round(cardAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / participantCount) : 0;
              const cardViolations = cardAttempts.filter(a => (a.violations > 0 || a.tabSwitches > 0 || a.status === "Disqualified")).length;

              const isLive = t.status === "Published";

              return (
                <div
                  key={tId || idx}
                  onClick={() => setSelectedExamId(tId)}
                  className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tracking-wider">
                        {t.category || t.testType || "APTITUDE"}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isLive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                      }`}>
                        {isLive ? "● LIVE NOW" : "DRAFT"}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors" style={{ fontFamily: FONT_DISPLAY }}>
                      {t.title}
                    </h4>

                    {/* Meta info: Duration, Total marks, Questions */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText size={13} /> {t.totalQuestions || 10} Questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {t.durationMinutes || 30} mins
                      </span>
                      <span>•</span>
                      <span>Total: {t.totalMarks || 10} marks</span>
                    </div>

                    {/* 3 Telemetry Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                        <div className="text-base font-bold text-gray-900">{participantCount}</div>
                        <div className="text-[10px] text-gray-400 font-medium">Students</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                        <div className="text-base font-bold text-emerald-600">{cardPassRate}%</div>
                        <div className="text-[10px] text-gray-400 font-medium">Pass Rate</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                        <div className="text-base font-bold text-red-600">{cardViolations}</div>
                        <div className="text-[10px] text-gray-400 font-medium">Flagged</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Link Footer */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    <span>View Student Telemetry & Insights</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============= 2. SINGLE ROW CARD VIEW (ONE AFTER ANOTHER) ============= */
          <div className="flex flex-col gap-3.5">
            {filteredTestsList.map((item, idx) => {
              const t = item.test || {};
              const tId = t._id || t.id || item.id;
              const schedule = item.schedule || {};

              // Calculate metrics for this card
              const cardAttempts = attempts.filter(a => {
                const aId = normalizeId(a.testId?._id || a.testId?.id || a.testId || a.exam_id?._id || a.exam_id?.id || a.exam_id);
                return aId === normalizeId(tId);
              });

              const participantCount = cardAttempts.length;
              const cardPassedCount = cardAttempts.filter(a => (a.score ?? 0) >= 40 && a.status !== "Disqualified" && a.status !== "Auto Submitted").length;
              const cardPassRate = participantCount > 0 ? Math.round((cardPassedCount / participantCount) * 100) : 0;
              const cardAvgScore = participantCount > 0 ? Math.round(cardAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / participantCount) : 0;
              const cardViolations = cardAttempts.filter(a => (a.violations > 0 || a.tabSwitches > 0 || a.status === "Disqualified")).length;

              const isLive = t.status === "Published";

              return (
                <div
                  key={tId || idx}
                  onClick={() => setSelectedExamId(tId)}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Category, Title & Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tracking-wider">
                        {t.category || t.testType || "APTITUDE"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isLive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                      }`}>
                        {isLive ? "● LIVE NOW" : "DRAFT"}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate" style={{ fontFamily: FONT_DISPLAY }}>
                      {t.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> {t.totalQuestions || 10} Questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {t.durationMinutes || 30} mins
                      </span>
                      <span>•</span>
                      <span>Total: {t.totalMarks || 10} marks</span>
                    </div>
                  </div>

                  {/* Center: 3 Telemetry Metrics */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="bg-gray-50 px-3 py-2 rounded-xl text-center border border-gray-100 min-w-[70px]">
                      <div className="text-sm font-bold text-gray-900">{participantCount}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Students</div>
                    </div>

                    <div className="bg-gray-50 px-3 py-2 rounded-xl text-center border border-gray-100 min-w-[75px]">
                      <div className="text-sm font-bold text-emerald-600">{cardPassRate}%</div>
                      <div className="text-[10px] text-gray-400 font-medium">Pass Rate</div>
                    </div>

                    <div className="bg-gray-50 px-3 py-2 rounded-xl text-center border border-gray-100 min-w-[65px]">
                      <div className="text-sm font-bold text-red-600">{cardViolations}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Flagged</div>
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center justify-end md:justify-center shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-all">
                      View Telemetry <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
