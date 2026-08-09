import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { EXAMS_LIST, QUESTIONS } from "../data/mockData";
import { BRAND, FONT_DISPLAY } from "../constants/theme";

export function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const exam = EXAMS_LIST.find((e) => e.id === Number(examId)) || EXAMS_LIST[0];

  const handleBeginExam = () => {
    navigate(`/exams/${exam.id}/take`);
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/exams")}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Exams
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
        <span className="text-xs font-bold tracking-wide" style={{ color: BRAND }}>
          {exam.category.toUpperCase()}
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-6" style={{ fontFamily: FONT_DISPLAY }}>
          {exam.title}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <FileText size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{QUESTIONS.length}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <Clock size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{exam.minutes} min</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{QUESTIONS.length}</div>
            <div className="text-xs text-gray-500">Total Marks</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{Math.ceil(QUESTIONS.length * 0.4)}</div>
            <div className="text-xs text-gray-500">Passing Marks</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
          Instructions
        </h2>
        <ol className="space-y-3 text-sm text-gray-700">
          {[
            `This exam contains ${QUESTIONS.length} multiple choice questions.`,
            `Total duration is ${exam.minutes} minutes. The timer will start once you begin.`,
            `Each question carries 1 mark. Total marks: ${QUESTIONS.length}.`,
            `Passing marks: ${Math.ceil(QUESTIONS.length * 0.4)}.`,
            "Negative marking of 0.25 marks for each wrong answer.",
            "You can navigate between questions using the palette or navigation buttons.",
            "You can mark questions for review and come back to them later.",
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

      <button
        onClick={handleBeginExam}
        className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
        style={{ background: BRAND }}
      >
        Start Exam <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default ExamDetailPage;
