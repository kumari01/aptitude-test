import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { EXAMS_LIST, QUESTIONS as MOCK_QUESTIONS } from "../data/mockData";
import { BRAND, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";

export function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const fallbackExam = EXAMS_LIST.find((e) => e.id === Number(examId)) || EXAMS_LIST[0];
  const [exam, setExam] = useState(fallbackExam);
  const [setting, setSetting] = useState(null);
  const [sections, setSections] = useState([]);
  const [questionCount, setQuestionCount] = useState(MOCK_QUESTIONS.length);

  useEffect(() => {
    async function fetchTestDetails() {
      try {
        const res = await api.get(`/test-management/${examId}`);
        if (res.data?.test) {
          const { test: testData, setting: setObj, sections: secList } = res.data;
          setExam({
            id: testData._id,
            title: testData.title,
            category: testData.testType || "Aptitude",
            minutes: 20,
            totalMarks: testData.totalMarks || 10,
          });
          if (setObj) setSetting(setObj);
          if (secList) setSections(secList);
        }
      } catch (err) {
        console.warn("Using mock exam detail fallback:", err);
      }
    }

    fetchTestDetails();
  }, [examId]);

  const handleBeginExam = () => {
    navigate(`/exams/${examId}/take`);
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
            <div className="text-lg font-bold text-gray-900">{exam.totalMarks || questionCount}</div>
            <div className="text-xs text-gray-500">Total Marks</div>
          </div>
          <div className="bg-gray-50 rounded-xl py-5 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-gray-500" />
            <div className="text-lg font-bold text-gray-900">{Math.ceil((exam.totalMarks || questionCount) * 0.4)}</div>
            <div className="text-xs text-gray-500">Passing Marks</div>
          </div>
        </div>
      </div>

      {sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
            Exam Sections
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sections.map(({ section }) => (
              <div key={section._id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-800">{section.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Total Marks: {section.totalMarks || 10}</p>
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

      <button
        onClick={handleBeginExam}
        className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        style={{ background: BRAND }}
      >
        Start Exam <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default ExamDetailPage;
