import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User 
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

export function AdminDashboardPage() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

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

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
          Admin Dashboard & Telemetry
        </h1>
        <p className="text-gray-500 mt-1">Real-time student attempt telemetry, test scores, and proctoring analytics</p>
      </div>

      {/* Admin Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Managed Exams"
          value={overviewStats.totalExams || tests.length}
          icon={<FileText size={18} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Published & Live"
          value={overviewStats.publishedExams || 0}
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
          label="Disqualified Attempts"
          value={attempts.filter(a => a.status === "Auto Submitted" || a.status === "Disqualified").length || overviewStats.disqualifiedAttempts || 0}
          icon={<ShieldAlert size={18} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
      </div>

      {/* Attempted Students Data Telemetry Log */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              Attempted Students Telemetry Log
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time submission records, student scores, and proctoring violation counts.
            </p>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search student or roll number..."
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none w-full sm:w-64 font-medium"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Clock className="animate-spin mx-auto mb-2" size={28} />
            <p className="text-sm font-medium">Fetching student telemetry records...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-slate-200">
            <User size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No student attempt records logged yet.</p>
            <p className="text-xs text-slate-400 mt-1">Student exam scores and proctoring attempt logs will populate here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">STUDENT & ROLL</th>
                  <th className="px-4 py-3.5">DEPT</th>
                  <th className="px-4 py-3.5">EXAM TITLE</th>
                  <th className="px-4 py-3.5">SCORE & MARKS</th>
                  <th className="px-4 py-3.5">VIOLATIONS</th>
                  <th className="px-4 py-3.5">STATUS</th>
                  <th className="px-4 py-3.5 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {attempts
                  .filter(att => 
                    !studentSearchQuery ||
                    att.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    att.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    att.testTitle.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  )
                  .map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{att.studentName}</div>
                        <div className="text-xs text-gray-400 font-mono">Roll: {att.rollNumber}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-600 text-xs">
                        {att.department}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900 text-xs block">{att.testTitle}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {att.testType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 text-xs">
                          {att.obtainedMarks} / {att.totalMarks || 10} Marks
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700">
                          {att.score}% Score
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold w-fit ${
                            (att.violations > 0 || att.tabSwitches > 0)
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            <ShieldAlert size={12} className={(att.violations > 0 || att.tabSwitches > 0) ? "text-red-600" : "text-emerald-600"} />
                            {(att.violations !== undefined && att.violations !== null && att.violations > 0)
                              ? `${att.violations} violation${att.violations > 1 ? "s" : ""}`
                              : (att.tabSwitches > 0 ? `${att.tabSwitches} switches` : "0 violations (Clean)")}
                          </span>
                          {att.riskScore > 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              Risk: {att.riskScore}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          att.status === "Auto Submitted" || att.status === "Disqualified"
                            ? "bg-red-100 text-red-700"
                            : att.status === "Time Expired"
                            ? "bg-amber-100 text-amber-800"
                            : att.status === "Started"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {att.status || "Submitted"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-gray-400 font-medium">
                        {new Date(att.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
