import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { EXAMS_LIST } from "../data/mockData";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";

export function ExamsPage() {
  const navigate = useNavigate();

  const handleStartExam = (id) => {
    navigate(`/exams/${id}`);
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Exams
      </h1>
      <p className="text-gray-500 mt-1 mb-6">All available and upcoming aptitude exams</p>

      <div className="grid md:grid-cols-2 gap-4">
        {EXAMS_LIST.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full"
                  style={{ background: e.live ? BRAND : "#F3F4F6", color: e.live ? "#fff" : "#6B7280" }}
                >
                  {e.live ? "LIVE NOW" : e.category.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: FONT_DISPLAY }}>
                {e.title}
              </h3>
              <div className="flex items-center gap-4 text-gray-500 text-sm mb-5">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} /> {e.questions} questions
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {e.minutes} minutes
                </span>
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
    </div>
  );
}

export default ExamsPage;
