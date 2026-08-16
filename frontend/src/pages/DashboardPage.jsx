import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  Calendar,
  ArrowRight,
  Award,
  TrendingUp,
  Trophy,
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import AdminDashboardPage from "./AdminDashboardPage";

export function DashboardPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [liveExam, setLiveExam] = useState(null);
  const [totalAssignedCount, setTotalAssignedCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const isAdmin = !!localStorage.getItem("admin");

  useEffect(() => {
    if (isAdmin) return;

    const fetchData = async () => {
      try {
        const [profileRes, progressRes, assignedRes] = await Promise.all([
          api.get("/auth/student/profile"),
          api.get("/auth/student/progress").catch(() => null),
          api.get("/test-management/student/assigned").catch(() => null),
        ]);

        if (profileRes?.data?.student) {
          setStudent(profileRes.data.student);
        }
        if (progressRes?.data) {
          setProgress(progressRes.data);
        }
        if (assignedRes?.data?.tests) {
          setTotalAssignedCount(assignedRes.data.tests.length);
        }
        // Use the first assigned test for the LIVE banner
        if (assignedRes?.data?.tests && assignedRes.data.tests.length > 0) {
          const first = assignedRes.data.tests[0];
          const targetExamId = first.test._id;
          setLiveExam({
            id: targetExamId,
            title: first.test.title,
            questions: 10,
            minutes: 30,
            due: first.schedule?.endAt
              ? new Date(first.schedule.endAt).toLocaleDateString()
              : "Scheduled",
            attemptStatus: first.attempt?.status,
            attemptId: first.attempt?._id,
          });

          // Fetch leaderboard for this test if available
          api.get(`/leaderboard/${targetExamId}`)
            .then((lbRes) => {
              if (lbRes.data?.leaderboard) {
                setLeaderboard(lbRes.data.leaderboard);
              }
            })
            .catch(() => null);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);

        const localStudent = localStorage.getItem("student");
        if (localStudent) {
          setStudent(JSON.parse(localStudent));
        } else if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchData();
  }, [navigate, isAdmin]);

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  const handleStartExam = (id) => {
    navigate(`/exams/${id}`);
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Hi, {student ? (student.username || student.name) : "Student"}
      </h1>
      <p className="text-gray-500 mt-1 mb-6">Here's your weekly exam status</p>

      {/* LIVE EXAM BANNER */}
      <div
        className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6 relative overflow-hidden shadow-sm"
        style={{ background: INK }}
      >
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[11px] font-bold tracking-wide text-white px-2.5 py-1 rounded-full"
              style={{ background: BRAND }}
            >
              LIVE NOW
            </span>
            <span className="text-gray-400 text-sm">This Week's Exam</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: FONT_DISPLAY }}>
            {liveExam ? liveExam.title : "No exams assigned yet"}
          </h2>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-gray-400 text-sm">
            <span className="flex items-center gap-1.5">
              <FileText size={15} /> {liveExam ? liveExam.questions : 0} questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> {liveExam ? liveExam.minutes : 0} minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={15} /> Due {liveExam ? liveExam.due : "—"}
            </span>
          </div>
        </div>
        {liveExam?.attemptStatus === "Submitted" || liveExam?.attemptStatus === "Auto Submitted" || liveExam?.attemptStatus === "Completed" ? (
          <button
            onClick={() => navigate(`/exams/${liveExam.id}/result`, { state: { attemptId: liveExam.attemptId, disqualified: liveExam.attemptStatus === "Auto Submitted" } })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity shrink-0 bg-slate-800"
          >
            View Result <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => liveExam && handleStartExam(liveExam.id)}
            disabled={!liveExam}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {liveExam?.attemptStatus === "Started" ? "Resume Exam" : "Take Exam"} <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Your Rank"
          value={progress?.rank || "—"}
          icon={<Award size={17} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Avg Score"
          value={progress ? progress.avgScore : "0%"}
          icon={<TrendingUp size={17} />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          label="Exams Completed"
          value={
            progress
              ? totalAssignedCount > 0
                ? `${progress.examsCompleted} / ${Math.max(totalAssignedCount, progress.examsCompleted)}`
                : `${progress.examsCompleted}`
              : "0"
          }
          icon={<FileText size={17} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Best Score"
          value={progress ? progress.bestScore : "0%"}
          icon={<Trophy size={17} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
      </div>

      {/* LEADERBOARD & RECENT WEEKS */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              Leaderboard
            </h3>
            <span className="text-sm text-gray-400">Exam Standings</span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No leaderboard entries available yet.</p>
          ) : (
            <div className="space-y-1">
              {leaderboard.map((p, idx) => (
                <div
                  key={p._id || idx}
                  className={`flex items-center justify-between py-3 px-3 rounded-lg ${
                    p.studentId === student?._id ? "bg-gray-50 border border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        (p.rank || idx + 1) === 1 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.rank || idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {p.studentName || p.username || "Student"} {p.studentId === student?._id && <span className="text-xs text-gray-400 font-normal">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-400">{p.rollno || ""}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{p.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
            Recent Attempts
          </h3>
          <div className="space-y-4">
            {(!progress?.recentAttempts || progress.recentAttempts.length === 0) ? (
              <p className="text-sm text-gray-400 py-4">No recent attempts recorded yet.</p>
            ) : (
              progress.recentAttempts.slice(0, 5).map((w, idx) => (
                <div key={w.id || idx} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{w.title}</div>
                    <div className="text-xs text-gray-400">{w.date}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        w.status === "Passed" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {w.score}
                    </div>
                    <div
                      className={`text-xs ${
                        w.status === "Passed" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {w.status}
                    </div>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => navigate("/results")}
              className="text-sm font-semibold pt-2 flex items-center gap-1 hover:underline"
              style={{ color: BRAND }}
            >
              View all results →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
