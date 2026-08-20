import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert, X, Maximize2 } from "lucide-react";
import { BRAND, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { requestFullscreen } from "../utils/fullscreen";

export function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState({ title: "Loading...", category: "Aptitude", minutes: 30, totalMarks: 0 });
  const [setting, setSetting] = useState(null);
  const [sections, setSections] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const toast = useToast();

  useEffect(() => {
    async function fetchTestDetails() {
      try {
        setLoading(true);
        setError(null);
        const [res, assignedRes] = await Promise.all([
          api.get(`/test-management/${examId}`),
          api.get('/test-management/student/assigned').catch(() => null),
        ]);

        if (assignedRes?.data?.tests) {
          const match = assignedRes.data.tests.find((t) => t.test._id === examId);
          if (match?.attempt) setAttemptInfo(match.attempt);
        }

        if (res.data?.test) {
          const { test: testData, setting: setObj, sections: secList, totalQuestions } = res.data;
          const qCount = typeof totalQuestions === 'number' ? totalQuestions : (testData.totalQuestions || (secList ? secList.reduce((sum, sec) => sum + (sec.questionCount || 0), 0) : 0));
          const tMarks = testData.totalMarks || (qCount > 0 ? qCount * 1 : 10);
          const pMarks = testData.passingMarks || Math.ceil(tMarks * 0.4);

          setExam({
            id: testData._id,
            title: testData.title,
            category: testData.testType || "Aptitude",
            minutes: testData.durationMinutes || 30,
            totalMarks: tMarks,
            passingMarks: pMarks
          });

          setQuestionCount(qCount);
          if (setObj) setSetting(setObj);
          if (secList) setSections(secList);
        }
        setLoading(false);
      } catch (err) {
        // If unauthorized, send user to login. Otherwise surface error.
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
        console.warn("Using mock exam detail fallback:", err.message);
        setError(err.message || 'Failed to load exam details');
        setLoading(false);
      }
    }
    
    fetchTestDetails();
  }, [examId]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto">Loading exam details...</div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded">
          <strong className="block mb-1">Unable to load exam</strong>
          <div className="text-sm">{error}</div>
          <div className="mt-3">
            <button onClick={() => navigate('/login')} className="underline text-sm">Go to Login</button>
          </div>
        </div>
      </div>
    );
  }

  const handleBeginExam = () => {
    setShowFullscreenPopup(true);
  };

  const confirmAndEnterFullscreen = async () => {
    setShowFullscreenPopup(false);
    try {
      await requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen permission note:", err);
    }
    navigate(`/exams/${examId}/take`);
  };

  const declineFullscreen = () => {
    setShowFullscreenPopup(false);
  };

  const isCompleted = attemptInfo?.status === "Submitted" || attemptInfo?.status === "Auto Submitted" || attemptInfo?.status === "Completed";
  const isStarted = attemptInfo?.status === "Started";

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/exams")}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Exams
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wide" style={{ color: BRAND }}>
            {(exam.category || "APTITUDE").toUpperCase()}
          </span>
          {setting?.proctoringEnabled && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              <ShieldAlert size={13} /> Proctoring Enabled (Max {setting.tabSwitchLimit || 3} Tab Switches)
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-6" style={{ fontFamily: FONT_DISPLAY }}>
          {exam.title}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <FileText size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{questionCount}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <Clock size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{exam.minutes} min</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{exam.totalMarks}</div>
            <div className="text-xs text-gray-500">Total Marks</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{exam.passingMarks || Math.ceil(exam.totalMarks * 0.4)}</div>
            <div className="text-xs text-gray-500">Passing Marks</div>
          </div>
        </div>
      </div>

      {sections.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
            Exam Sections
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sections.map(({ section, questionCount }) => (
              <div key={section._id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-800">{section.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Total Marks: {section.totalMarks || 10}</p>
                <p className="text-xs text-gray-500 mt-1">Questions: {questionCount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
          Instructions
        </h2>
        <ol className="space-y-3 text-sm text-gray-700">
          {[
            `This exam contains ${questionCount} multiple choice questions.`,
            `Total duration is ${exam.minutes} minutes. The timer will start once you begin.`,
            `Each question carries marks according to difficulty.`,
            `Passing score is 40% of total marks.`,
            setting?.proctoringEnabled ? `Proctoring is active. Switching tabs more than ${setting.tabSwitchLimit || 3} times will auto-submit the exam.` : "No tab switch restrictions for this practice test.",
            "You can navigate between questions using the palette or navigation buttons.",
            "The exam will auto-submit when the timer runs out.",
            "Do not refresh or close the browser during the exam.",
          ].map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-gray-400 font-medium">{i + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      {isCompleted ? (
        <button
          onClick={() => navigate(`/exams/${examId}/result`, { state: { attemptId: attemptInfo._id, disqualified: attemptInfo.status === "Auto Submitted" } })}
          className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm bg-slate-800"
        >
          View Result <ArrowRight size={16} />
        </button>
      ) : isStarted ? (
        <button
          onClick={handleBeginExam}
          className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          style={{ background: BRAND }}
        >
          Resume Exam <ArrowRight size={16} />
        </button>
      ) : (
        <button
          onClick={handleBeginExam}
          className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          style={{ background: BRAND }}
        >
          Start Exam <ArrowRight size={16} />
        </button>
      )}

      {/* Fullscreen Permission Popup */}
      {showFullscreenPopup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={declineFullscreen}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={declineFullscreen}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: `${BRAND}15` }}
            >
              <Maximize2 size={28} style={{ color: BRAND }} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: FONT_DISPLAY }}>
              Fullscreen Permission Required
            </h2>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This exam requires <strong>fullscreen mode</strong> to ensure a secure and
              distraction-free environment. The browser will request permission to enter
              fullscreen.
            </p>

            <p className="text-xs text-gray-500 mb-6">
              Do you want to proceed with entering fullscreen mode?
            </p>

            <div className="flex gap-3">
              <button
                onClick={declineFullscreen}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                No, Stay Here
              </button>
              <button
                onClick={confirmAndEnterFullscreen}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                style={{ background: BRAND }}
              >
                Yes, Enter Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamDetailPage;
