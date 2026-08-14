import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, ArrowRight, ShieldAlert, Calendar, AlertCircle } from "lucide-react";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";

export function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedTests() {
      try {
        setLoading(true);
        const res = await api.get("/test-management/student/assigned");
        if (res.data?.tests) {
          const formatted = res.data.tests.map(({ test, setting, schedule }) => ({
            id: test._id,
            title: test.title,
            category: test.testType || "Aptitude",
            minutes: test.duration_minutes || test.durationMinutes || 30,
            questions: test.totalMarks || 10,
            live: test.status === "Published",
            proctoring: setting?.proctoringEnabled ?? true,
            tabSwitchLimit: setting?.tabSwitchLimit ?? 3,
            startAt: schedule?.startAt,
            endAt: schedule?.endAt,
          }));
          setExams(formatted);
        } else {
          setExams([]);
        }
      } catch (err) {
        console.warn("Error fetching assigned tests:", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedTests();
  }, []);

  const handleStartExam = (id) => {
    navigate(`/exams/${id}`);
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Exams & Assessments
      </h1>
      <p className="text-gray-500 mt-1 mb-6">All assigned aptitude tests, practice modules, and upcoming scheduled exams</p>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 shadow-sm">
          Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: FONT_DISPLAY }}>
            No Exams Available
          </h3>
          <p className="text-sm text-gray-500">
            No exams have been created or assigned to you yet. Once your administrator creates and schedules an exam, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {exams.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full"
                    style={{ background: e.live ? BRAND : "#F3F4F6", color: e.live ? "#fff" : "#6B7280" }}
                  >
                    {e.live ? "LIVE NOW" : e.category.toUpperCase()}
                  </span>
                  {e.proctoring && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                      <ShieldAlert size={12} /> Proctoring Enabled
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: FONT_DISPLAY }}>
                  {e.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-5">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} /> {e.questions} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {e.minutes} minutes
                  </span>
                  {e.tabSwitchLimit && (
                    <span className="text-xs text-gray-400">
                      Max {e.tabSwitchLimit} Tab Switches
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleStartExam(e.id)}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: INK }}
              >
                {e.live ? "Take Exam" : "Start Practice"} <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExamsPage;
