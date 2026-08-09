import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, MinusCircle, ChevronLeft, RotateCcw } from "lucide-react";
import { EXAMS_LIST, QUESTIONS } from "../data/mockData";
import { INK, FONT_DISPLAY } from "../constants/theme";

export function ExamResultPage() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const exam = EXAMS_LIST.find((e) => e.id === Number(examId)) || EXAMS_LIST[0];

  // Default state fallback if user direct navigated
  const state = location.state || {
    correct: 6,
    total: QUESTIONS.length,
    answeredCount: 7,
    examTitle: exam.title,
  };

  const { correct, total, answeredCount } = state;
  const wrong = answeredCount - correct;
  const skipped = total - answeredCount;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 40;

  return (
    <div className="px-4 sm:px-6 md:px-10 py-10 max-w-2xl mx-auto">
      <div
        className={`rounded-2xl p-6 text-center mb-6 shadow-sm ${
          passed ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "bg-red-50 text-red-900 border border-red-100"
        }`}
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {passed ? "Congratulations!" : "Keep Practicing!"}
        </h1>
        <p className="text-sm opacity-90">
          {passed
            ? "You have successfully passed the examination."
            : "You did not reach the passing marks this time."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 text-center shadow-sm">
        <span className="text-sm text-gray-500">Your Score</span>
        <div className="text-5xl font-bold text-gray-900 my-2" style={{ fontFamily: FONT_DISPLAY }}>
          {pct}%
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {correct} / {total} marks
        </span>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div>
            <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={22} />
            <div className="text-2xl font-bold text-emerald-600">{correct}</div>
            <div className="text-xs text-gray-500 font-medium">Correct</div>
          </div>
          <div>
            <XCircle className="mx-auto text-red-500 mb-2" size={22} />
            <div className="text-2xl font-bold text-red-600">{wrong}</div>
            <div className="text-xs text-gray-500 font-medium">Wrong</div>
          </div>
          <div>
            <MinusCircle className="mx-auto text-gray-400 mb-2" size={22} />
            <div className="text-2xl font-bold text-gray-500">{skipped}</div>
            <div className="text-xs text-gray-500 font-medium">Skipped</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
          Summary
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Questions</span>
            <span className="font-semibold text-gray-900">{total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Attempted</span>
            <span className="font-semibold text-gray-900">{answeredCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Accuracy</span>
            <span className="font-semibold text-gray-900">{pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold ${passed ? "text-emerald-600" : "text-red-600"}`}>
              {passed ? "Passed" : "Failed"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={16} /> Dashboard
        </button>
        <button
          onClick={() => navigate(`/exams/${exam.id}/take`)}
          className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity ml-auto shadow-sm"
          style={{ background: INK }}
        >
          Retake Exam <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

export default ExamResultPage;
