import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { EXAMS_LIST, QUESTIONS } from "../data/mockData";
import { formatTime } from "../utils/formatters";
import { BRAND, BRAND_TINT, INK, FONT_DISPLAY, FONT_BODY } from "../constants/theme";

export function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const exam = EXAMS_LIST.find((e) => e.id === Number(examId)) || EXAMS_LIST[0];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(exam.minutes * 60);
  const timerRef = useRef(null);

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let correct = 0;
    QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.answer) correct += 1;
    });
    const answeredCount = Object.keys(answers).length;

    // Navigate to result route with state
    navigate(`/exams/${exam.id}/result`, {
      state: { correct, total: QUESTIONS.length, answeredCount, examTitle: exam.title },
    });
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (seconds === 0) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const answeredCount = Object.keys(answers).length;
  const isLast = current === QUESTIONS.length - 1;

  function selectOption(qIndex, optIndex) {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  const q = QUESTIONS[current];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: FONT_BODY }}>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div>
          <div className="font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            {exam.title}
          </div>
          <div className="text-xs text-gray-400">
            Question {current + 1} of {QUESTIONS.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700">
            <Clock size={15} /> {formatTime(seconds)}
          </div>
          <button
            onClick={finishExam}
            className="flex items-center gap-1.5 text-white font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}
          >
            Submit <Flag size={14} />
          </button>
        </div>
      </div>

      {/* QUESTION CONTENT */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 px-4 sm:px-6 md:px-10 py-8 max-w-6xl mx-auto w-full flex-1">
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <span className="text-xs font-bold tracking-wide" style={{ color: BRAND }}>
              QUESTION {current + 1}
            </span>
            <p className="text-lg text-gray-900 mt-2 mb-6 font-medium">{q.q}</p>

            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[current] === i;
                const letter = String.fromCharCode(65 + i);
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(current, i)}
                    className="w-full flex items-center gap-3 border rounded-xl px-5 py-3.5 text-left transition-colors"
                    style={{
                      background: selected ? BRAND_TINT : "#fff",
                      borderColor: selected ? BRAND : "#E5E7EB",
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: selected ? BRAND : "#F3F4F6",
                        color: selected ? "#fff" : "#6B7280",
                      }}
                    >
                      {letter}
                    </span>
                    <span className="text-gray-800">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-5 py-3 font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {isLast ? (
              <button
                onClick={finishExam}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: BRAND }}
              >
                Finish Exam <Flag size={15} />
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(QUESTIONS.length - 1, c + 1))}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: INK }}
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* SIDEBAR PALETTE */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Questions</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {QUESTIONS.map((_, i) => {
                const isAnswered = answers[i] !== undefined;
                const isCurrent = i === current;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="w-10 h-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-all"
                    style={{
                      background: isAnswered ? BRAND : "#F3F4F6",
                      color: isAnswered ? "#fff" : "#6B7280",
                      border: isCurrent ? "2px solid #111827" : "2px solid transparent",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND }} /> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Skipped
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Unanswered
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Progress</h3>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Answered</span>
              <span className="font-semibold text-gray-900">
                {answeredCount}/{QUESTIONS.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">Remaining</span>
              <span className="font-semibold text-gray-900">{QUESTIONS.length - answeredCount}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(answeredCount / QUESTIONS.length) * 100}%`,
                  background: BRAND,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamTakingPage;
