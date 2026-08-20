import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  Calendar,
  ArrowRight,
  Award,
  TrendingUp,
  Trophy,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  Layers,
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import AdminDashboardPage from "./AdminDashboardPage";
import { BaseSkeleton, DashboardSkeleton } from "../components/skeletons";

export function DashboardPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [liveExam, setLiveExam] = useState(null);
  const [totalAssignedCount, setTotalAssignedCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardExamTitle, setLeaderboardExamTitle] = useState("");
  const [leaderboardExams, setLeaderboardExams] = useState([]);
  const [selectedLeaderboardExamId, setSelectedLeaderboardExamId] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef(null);

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

        let targetExamId = null;

        // Find the most appropriate active, upcoming, or live test for the banner
        if (assignedRes?.data?.tests && assignedRes.data.tests.length > 0) {
          const testsList = assignedRes.data.tests;
          const now = new Date();

          // 1. Prioritize any latest in-progress (Started) exam
          let activeItem = testsList.find((item) => item.attempt?.status === "Started");

          // 2. Or find the latest uncompleted exam within live schedule window
          if (!activeItem) {
            activeItem = testsList.find((item) => {
              const isCompleted = item.attempt?.status && ["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(item.attempt.status);
              if (isCompleted) return false;

              const startAt = item.schedule?.startAt ? new Date(item.schedule.startAt) : null;
              const endAt = item.schedule?.endAt ? new Date(item.schedule.endAt) : null;
              if (startAt && now < startAt) return false;
              if (endAt && now > endAt) return false;
              return true;
            });
          }

          // 3. Or find the latest upcoming scheduled exam
          if (!activeItem) {
            activeItem = testsList.find((item) => {
              const isCompleted = item.attempt?.status && ["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(item.attempt.status);
              if (isCompleted) return false;
              const startAt = item.schedule?.startAt ? new Date(item.schedule.startAt) : null;
              return startAt && now < startAt;
            });
          }

          // 4. Or find the latest uncompleted exam
          if (!activeItem) {
            activeItem = testsList.find((item) => !item.attempt?.status || !["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(item.attempt.status));
          }

          // 5. Fallback to the latest exam overall (first item in latest-sorted array)
          if (!activeItem) {
            activeItem = testsList[0];
          }

          targetExamId = activeItem.test._id;
          const startAtDate = activeItem.schedule?.startAt ? new Date(activeItem.schedule.startAt) : null;
          const isUpcoming = startAtDate ? now < startAtDate : false;

          setLiveExam({
            id: targetExamId,
            title: activeItem.test.title,
            questions: activeItem.test.totalQuestions || 10,
            minutes: activeItem.test.duration_minutes || activeItem.test.durationMinutes || 30,
            due: activeItem.schedule?.endAt
              ? new Date(activeItem.schedule.endAt).toLocaleDateString()
              : "Scheduled",
            startAtFormatted: startAtDate ? startAtDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : null,
            isUpcoming,
            attemptStatus: activeItem.attempt?.status,
            attemptId: activeItem.attempt?._id,
          });
        }

        // Fetch leaderboard (for active exam or latest exam with completed submissions)
        const lbUrl = targetExamId ? `/leaderboard/${targetExamId}` : "/leaderboard/latest";
        api.get(lbUrl)
          .then((lbRes) => {
            if (lbRes.data?.leaderboard) {
              setLeaderboard(lbRes.data.leaderboard);
              if (lbRes.data.testTitle) {
                setLeaderboardExamTitle(lbRes.data.testTitle);
              }
              if (lbRes.data.examId) {
                setSelectedLeaderboardExamId(lbRes.data.examId);
              }
            }
          })
          .catch(() => null);

        // Fetch all exams list for leaderboard history dropdown
        api.get("/leaderboard/exams/list")
          .then((listRes) => {
            if (listRes.data?.exams) {
              setLeaderboardExams(listRes.data.exams);
            }
          })
          .catch(() => null);
      } catch (error) {
        console.error("Dashboard fetch error:", error);

        const localStudent = localStorage.getItem("student");
        if (localStudent) {
          setStudent(JSON.parse(localStudent));
        } else if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [navigate, isAdmin]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLeaderboardExamChange = async (examId) => {
    setSelectedLeaderboardExamId(examId);
    setLeaderboardLoading(true);
    try {
      const url = examId ? `/leaderboard/${examId}` : "/leaderboard/latest";
      const res = await api.get(url);
      if (res.data) {
        setLeaderboard(res.data.leaderboard || []);
        setLeaderboardExamTitle(res.data.testTitle || "");
      }
    } catch (err) {
      console.warn("Failed to switch leaderboard exam:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  if (pageLoading) {
    return <DashboardSkeleton />;
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
            {liveExam?.isUpcoming ? (
              <span className="text-[11px] font-bold tracking-wide text-white px-2.5 py-1 rounded-full bg-amber-600">
                SCHEDULED
              </span>
            ) : ["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(liveExam?.attemptStatus) ? (
              <span className="text-[11px] font-bold tracking-wide text-white px-2.5 py-1 rounded-full bg-slate-700">
                COMPLETED
              </span>
            ) : (
              <span
                className="text-[11px] font-bold tracking-wide text-white px-2.5 py-1 rounded-full"
                style={{ background: BRAND }}
              >
                LIVE NOW
              </span>
            )}
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
            onClick={() => navigate(`/exams/${liveExam.id}/result`, { state: { attemptId: liveExam.attemptId, disqualified: liveExam.attemptStatus === "Auto Submitted" || liveExam.attemptStatus === "Disqualified" } })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity shrink-0 bg-slate-800 cursor-pointer"
          >
            View Result <ArrowRight size={16} />
          </button>
        ) : liveExam?.isUpcoming ? (
          <button
            disabled
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white/70 font-semibold px-6 py-3.5 rounded-xl bg-slate-800 cursor-not-allowed shrink-0"
          >
            Starts {liveExam.startAtFormatted || "Soon"}
          </button>
        ) : (
          <button
            onClick={() => liveExam && handleStartExam(liveExam.id)}
            disabled={!liveExam}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 cursor-pointer"
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
          value={
            (progress?.rank && progress.rank !== "—")
              ? progress.rank
              : (leaderboard.find(l => l.studentId === student?._id)?.rank ? `#${leaderboard.find(l => l.studentId === student?._id).rank}` : "—")
          }
          icon={<Award size={17} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Percentile"
          value={progress ? progress.percentile : "—"}
          icon={<TrendingUp size={17} />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          label="Exams Completed"
          value={
            progress
              ? `${progress.examsCompleted || 0} / ${progress.totalExams || progress.totalConducted || totalAssignedCount || 0}`
              : `${0} / ${totalAssignedCount || 0}`
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
                Leaderboard
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Top student performers</p>
            </div>

            {/* Custom Interactive Exam History Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                  dropdownOpen
                    ? "bg-slate-900 text-white border-slate-900 ring-2 ring-indigo-500/20"
                    : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Award size={14} className={dropdownOpen ? "text-amber-400" : "text-indigo-600"} />
                <span className="max-w-[160px] sm:max-w-[200px] truncate">
                  {leaderboardExamTitle || "Select Exam Leaderboard"}
                </span>
                {liveExam && selectedLeaderboardExamId === liveExam.id && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Live Now"></span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 opacity-60 ${dropdownOpen ? "rotate-180 text-white" : "text-gray-500"}`}
                />
              </button>

              {/* Dropdown Popover */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-fade-in origin-top-right">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Exam Leaderboard History
                    </span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {leaderboardExams.length} Exams
                    </span>
                  </div>

                  {leaderboardExams.length > 4 && (
                    <div className="px-2 py-1.5 mb-1">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                        <Search size={13} className="text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="Search exam title..."
                          className="w-full bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}

                  <div className="max-h-64 overflow-y-auto space-y-1 p-1 scrollbar-thin">
                    {leaderboardExams
                      .filter((e) => !dropdownSearch || e.title.toLowerCase().includes(dropdownSearch.toLowerCase()))
                      .map((examItem) => {
                        const isSelected = selectedLeaderboardExamId === examItem._id;
                        const isCurrentLiveExam = liveExam && (liveExam.id === examItem._id);

                        return (
                          <button
                            key={examItem._id}
                            onClick={() => {
                              handleLeaderboardExamChange(examItem._id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 text-indigo-900 font-bold"
                                : "hover:bg-gray-50 text-gray-700 font-medium"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs text-gray-900 font-semibold">{examItem.title}</span>
                                {isCurrentLiveExam && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    LIVE NOW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                <span>{examItem.totalQuestions || 10} Questions</span>
                                <span>•</span>
                                <span className={examItem.submissionCount > 0 ? "text-emerald-600 font-medium" : "text-gray-400"}>
                                  {examItem.submissionCount} {examItem.submissionCount === 1 ? "submission" : "submissions"}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                          </button>
                        );
                      })}

                    {leaderboardExams.length === 0 && (
                      <p className="text-xs text-gray-400 py-3 text-center">No past exams found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {leaderboardLoading ? (
            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50/60"
                >
                  <div className="flex items-center gap-3">
                    <BaseSkeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                      <BaseSkeleton className="h-4 w-28 sm:w-36" />
                      <BaseSkeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <BaseSkeleton className="h-5 w-12 rounded-md" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No leaderboard entries available for this exam yet.</p>
          ) : (
            <div className="space-y-1">
              {leaderboard.map((p, idx) => (
                <div
                  key={p._id || idx}
                  className={`flex items-center justify-between py-3 px-3 rounded-lg ${
                    (p.studentId === student?._id || p.student_id?._id === student?._id) ? "bg-gray-50 border border-gray-100" : ""
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
                        {p.studentName || p.username || p.student_id?.username || p.student_id?.name || "Student"}{" "}
                        {(p.studentId === student?._id || p.student_id?._id === student?._id) && (
                          <span className="text-xs text-gray-400 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {p.rollno || p.student_id?.rollno || ""}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {typeof p.score === "string" && p.score.endsWith("%") ? p.score : `${p.score ?? 0}%`}
                  </span>
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
