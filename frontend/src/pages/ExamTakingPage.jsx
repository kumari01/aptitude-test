import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flag, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { formatTime } from "../utils/formatters";
import { BRAND, BRAND_TINT, INK, FONT_DISPLAY, FONT_BODY } from "../constants/theme";
import api from "../api/axios";

export function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState({ title: "Exam", minutes: 30 });
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmittedAlert, setAutoSubmittedAlert] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(1800);
  const timerRef = useRef(null);

  // Initialize test attempt from API
  useEffect(() => {
    async function initExam() {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await api.post(`/exams/${examId}/start`);
        if (res.data) {
          const { attempt, exam: examData, questions: qData, isTimeExpired, remainingSeconds } = res.data;
          
          if (attempt?._id) setAttemptId(attempt._id);
          if (examData?.title) {
            setExam({
              id: examData._id,
              title: examData.title,
              minutes: examData.duration_minutes || 30,
              totalMarks: examData.total_marks || 10,
            });
          }

          // Handle already expired attempt directly
          if (isTimeExpired || attempt?.status === 'Submitted' || attempt?.status === 'Time Expired') {
            navigate(`/exams/${examId}/result`, {
              state: {
                attemptId: attempt?._id,
                examTitle: examData?.title || exam.title,
                isAutoSubmitted: attempt?.status === 'Time Expired' || isTimeExpired
              }
            });
            return;
          }

          if (qData && qData.length > 0) {
            const formatted = qData.map((q) => ({
              id: q._id,
              q: q.question_text,
              options: q.options.map((opt) => opt.text || opt),
              rawOptions: q.options,
              marks: q.marks || 1,
            }));
            setQuestions(formatted);
          } else {
            setQuestions([]);
          }

          // Calculate remaining duration from server response or start time
          if (remainingSeconds !== undefined) {
            setSeconds(remainingSeconds);
          } else if (attempt?.started_at && examData?.duration_minutes) {
            const startTime = new Date(attempt.started_at).getTime();
            const totalDurationMs = (examData.duration_minutes || 30) * 60 * 1000;
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, Math.floor(totalDurationMs / 1000) - elapsedSeconds);
            setSeconds(remaining);
          }

          // Fetch pre-saved answers if resuming attempt
          if (attempt?._id && qData?.length > 0) {
            try {
              const answersRes = await api.get(`/answers/attempt/${attempt._id}`);
              if (answersRes.data?.answers) {
                const loadedAnswers = {};
                answersRes.data.answers.forEach((ans) => {
                  const qIdx = qData.findIndex((q) => q._id === ans.question_id);
                  if (qIdx !== -1) {
                    const optIdx = qData[qIdx].options.findIndex(
                      (o) => (o._id ? o._id.toString() : o) === ans.selected_option_id
                    );
                    if (optIdx !== -1) loadedAnswers[qIdx] = optIdx;
                  }
                });
                setAnswers(loadedAnswers);
              }
            } catch (err) {
              console.warn("Could not load saved answers:", err);
            }
          }
        }
      } catch (err) {
        console.warn("Error initializing test session:", err);
        setErrorMsg(err.response?.data?.message || "Failed to initialize test session");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    initExam();
  }, [examId, navigate]);

  const finishExam = async (isAutoSubmit = false) => {
    const autoSubmitted = isAutoSubmit === true;
    if (submitting) return;
    setSubmitting(true);
    if (autoSubmitted) {
      setAutoSubmittedAlert(true);
    }
    if (timerRef.current) clearInterval(timerRef.current);

    let submitResult = null;
    if (attemptId) {
      try {
        const res = await api.post("/answers/submit", {
          attemptId,
          reason: autoSubmitted ? "Time Expired" : "Manual Submit"
        });
        submitResult = res.data;
      } catch (err) {
        console.warn("Backend submit error, using client calculation:", err);
      }
    }

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct += 1;
    });
    const answeredCount = Object.keys(answers).length;

    navigate(`/exams/${examId}/result`, {
      state: {
        attemptId,
        correct: submitResult?.correctCount ?? correct,
        total: submitResult?.totalMarks ?? questions.length,
        answeredCount: submitResult?.answeredCount ?? answeredCount,
        score: submitResult?.score,
        percentage: submitResult?.percentage,
        examTitle: exam.title,
        isAutoSubmitted: autoSubmitted,
      },
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
    if (seconds === 0 && !loading && !submitting) {
      finishExam(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, loading, submitting]);

  const answeredCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;
  const isLowTime = seconds > 0 && seconds <= 300; // <= 5 mins
  const isUrgentTime = seconds > 0 && seconds <= 60; // <= 1 min

  async function selectOption(qIndex, optIndex) {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));

    // Save answer to backend if attemptId is present
    const qObj = questions[qIndex];
    if (attemptId && qObj?.id && qObj?.rawOptions?.[optIndex]?._id) {
      try {
        const saveRes = await api.post("/answers/save", {
          attemptId,
          questionId: qObj.id,
          selectedOptionId: qObj.rawOptions[optIndex]._id,
        });
        if (saveRes.data?.isTimeExpired) {
          finishExam(true);
        }
      } catch (err) {
        if (err.response?.data?.isTimeExpired) {
          finishExam(true);
        } else {
          console.warn("Failed to persist student answer to backend:", err);
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 mb-3" size={36} />
        <p className="text-gray-600 font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (errorMsg || questions.length === 0 || !questions[current]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Start Exam</h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            {errorMsg || "No questions found for this exam."}
          </p>
          <button
            onClick={() => navigate("/exams")}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}
          >
            <ChevronLeft size={16} /> Return to Exams List
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: FONT_BODY }}>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div>
          <div className="font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            {exam.title}
          </div>
          <div className="text-xs text-gray-400">
            Question {current + 1} of {questions.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 border rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              isUrgentTime
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                : isLowTime
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "border-gray-200 text-gray-700"
            }`}
          >
            {isLowTime ? <AlertCircle size={15} className="text-amber-500" /> : <Clock size={15} />}
            <span>{formatTime(seconds)}</span>
          </div>
          <button
            onClick={() => finishExam(false)}
            disabled={submitting}
            className="flex items-center gap-1.5 text-white font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {submitting ? "Submitting..." : "Submit"} <Flag size={14} />
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
                onClick={() => finishExam(false)}
                disabled={submitting}
                className="flex items-center gap-1.5 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {submitting ? "Submitting..." : "Finish Exam"} <Flag size={15} />
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
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
              {questions.map((_, i) => {
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
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Unanswered
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Progress</h3>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Answered</span>
              <span className="font-semibold text-gray-900">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">Remaining</span>
              <span className="font-semibold text-gray-900">{questions.length - answeredCount}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(answeredCount / (questions.length || 1)) * 100}%`,
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
