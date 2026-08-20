import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, MinusCircle, ChevronLeft, HelpCircle, Check, X } from "lucide-react";
import { INK, BRAND, FONT_DISPLAY } from "../constants/theme";
import { exitFullscreen, isFullscreen } from "../utils/fullscreen";
import api from "../api/axios";
import { ExamResultSkeleton } from "../components/skeletons";

export function ExamResultPage() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState({
    correct: state.correct ?? 0,
    total: state.total ?? 0,
    answeredCount: state.answeredCount ?? 0,
    wrongCount: state.wrongCount ?? 0,
    percentage: state.percentage ?? 0,
    breakdown: []
  });

  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "correct" | "incorrect" | "skipped"

  useEffect(() => {
    const targetId = state.attemptId || examId;
    if (targetId) {
      setLoading(true);
      api.get(`/answers/results/${targetId}`)
        .then((res) => {
          if (res.data) {
            const answered = res.data.answeredCount ?? state.answeredCount ?? 0;
            const correct = res.data.correctCount ?? state.correct ?? 0;
            const wrong = res.data.wrongCount !== undefined 
              ? res.data.wrongCount 
              : Math.max(0, answered - correct);
            const total = res.data.totalQuestions || res.data.totalMarks || state.total || 0;

            setResultData({
              correct,
              total,
              answeredCount: answered,
              wrongCount: wrong,
              percentage: res.data.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0),
              breakdown: res.data.breakdown || []
            });
          }
        })
        .catch((err) => console.warn("Could not fetch attempt result from backend:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [state.attemptId, examId]);

  if (loading) {
    return <ExamResultSkeleton />;
  }

  const { correct, total, answeredCount, percentage, wrongCount, breakdown } = resultData;
  const wrong = wrongCount !== undefined ? wrongCount : Math.max(0, answeredCount - correct);
  const skipped = Math.max(0, total - answeredCount);
  const pct = percentage !== undefined ? percentage : (total > 0 ? Math.round((correct / total) * 100) : 0);
  const isDisqualified = state.disqualified === true;
  const passed = isDisqualified ? false : (pct >= 40);

  // Filtered breakdown questions
  const filteredBreakdown = breakdown.filter(q => {
    if (activeFilter === "correct") return q.isCorrect;
    if (activeFilter === "incorrect") return q.isAnswered && !q.isCorrect;
    if (activeFilter === "skipped") return !q.isAnswered;
    return true;
  });

  const handleReturnToDashboard = async () => {
    if (isFullscreen()) {
      try {
        await exitFullscreen();
      } catch (err) {
        console.warn("Could not exit fullscreen on return:", err);
      }
    }
    navigate("/dashboard");
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto space-y-6">
      {/* Top Left Return to Dashboard Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReturnToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft size={16} /> Return to Dashboard
        </button>
      </div>

      {/* Disqualification Banner */}
      {isDisqualified && (
        <div className="bg-red-600 text-white rounded-2xl p-5 shadow-md text-sm font-semibold flex items-center gap-3">
          <XCircle size={28} className="shrink-0" />
          <div>
            <strong className="block text-base font-bold">Attempt Terminated</strong>
            This attempt was automatically submitted and locked because you exceeded the tab/window switch limits allowed for this exam.
          </div>
        </div>
      )}

      {/* Outcome Banner */}
      <div
        className={`rounded-2xl p-6 text-center shadow-sm ${
          passed ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "bg-red-50 text-red-900 border border-red-100"
        }`}
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {isDisqualified ? "Disqualified" : (passed ? "Congratulations!" : "Keep Practicing!")}
        </h1>
        <p className="text-sm opacity-90">
          {isDisqualified 
            ? "Your attempt was disqualified due to exam security violations."
            : (passed
              ? "You have successfully passed the examination assessment."
              : "You did not reach the passing threshold this time.")}
        </p>
      </div>

      {/* Score Overview Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Score Percentage</span>
        <div className="text-5xl font-bold text-gray-900 my-2" style={{ fontFamily: FONT_DISPLAY }}>
          {pct}%
        </div>
        <span className="text-sm text-gray-500 font-semibold">
          {correct} / {total} Total Marks
        </span>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div>
            <CheckCircle2 className="mx-auto text-emerald-500 mb-1.5" size={22} />
            <div className="text-2xl font-bold text-emerald-600">{correct}</div>
            <div className="text-xs text-gray-500 font-medium">Correct</div>
          </div>
          <div>
            <XCircle className="mx-auto text-red-500 mb-1.5" size={22} />
            <div className="text-2xl font-bold text-red-600">{wrong}</div>
            <div className="text-xs text-gray-500 font-medium">Wrong</div>
          </div>
          <div>
            <MinusCircle className="mx-auto text-gray-400 mb-1.5" size={22} />
            <div className="text-2xl font-bold text-gray-500">{skipped}</div>
            <div className="text-xs text-gray-500 font-medium">Skipped</div>
          </div>
        </div>
      </div>

      {/* DETAILED QUESTION BREAKDOWN SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              Detailed Question Analysis
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review your submitted answers against correct answers.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({breakdown.length})
            </button>
            <button
              onClick={() => setActiveFilter("correct")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "correct" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Correct ({correct})
            </button>
            <button
              onClick={() => setActiveFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "incorrect" ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Incorrect ({wrong})
            </button>
            <button
              onClick={() => setActiveFilter("skipped")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "skipped" ? "bg-slate-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Skipped ({skipped})
            </button>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {filteredBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No questions found under this filter option.
            </div>
          ) : (
            filteredBreakdown.map((q) => (
              <div
                key={q.questionId}
                className={`p-5 rounded-2xl border transition-all ${
                  q.isCorrect
                    ? "border-emerald-200 bg-emerald-50/30"
                    : q.isAnswered
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-200 bg-gray-50/50"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                      Q{q.number}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      ({q.marks} {q.marks === 1 ? "Mark" : "Marks"})
                    </span>
                  </div>

                  {/* Status Pill */}
                  {q.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      <Check size={13} /> Correct (+{q.marks})
                    </span>
                  ) : q.isAnswered ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                      <X size={13} /> Incorrect (0)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                      <MinusCircle size={13} /> Skipped (0)
                    </span>
                  )}
                </div>

                {/* Question Prompt */}
                <p className="text-sm font-bold text-gray-900 mb-4 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options Grid */}
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOption = opt.isCorrectOption;
                    const isSelectedOption = opt.isSelectedOption;

                    let optionStyle = "border-gray-200 bg-white text-gray-700";
                    let badge = null;

                    if (isCorrectOption) {
                      optionStyle = "border-emerald-400 bg-emerald-100/80 text-emerald-900 font-semibold";
                      badge = (
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 shrink-0 bg-emerald-200/80 px-2 py-0.5 rounded">
                          <Check size={12} /> Correct Answer
                        </span>
                      );
                    } else if (isSelectedOption && !isCorrectOption) {
                      optionStyle = "border-red-300 bg-red-100/80 text-red-900 font-semibold";
                      badge = (
                        <span className="text-[11px] font-bold text-red-800 flex items-center gap-1 shrink-0 bg-red-200/80 px-2 py-0.5 rounded">
                          <X size={12} /> Your Choice
                        </span>
                      );
                    }

                    return (
                      <div
                        key={opt.id || optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamResultPage;
