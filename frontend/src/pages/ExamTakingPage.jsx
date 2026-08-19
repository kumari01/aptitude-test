import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flag, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { formatTime } from "../utils/formatters";
import { BRAND, BRAND_TINT, INK, FONT_DISPLAY, FONT_BODY } from "../constants/theme";
import { useToast } from "../context/ToastContext";
import { requestFullscreen, isFullscreen } from "../utils/fullscreen";
import api from "../api/axios";

export function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [exam, setExam] = useState({ title: "Assessment Test", minutes: 30 });
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(1800);
  const timerRef = useRef(null);

  // Proctoring States
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [warningModal, setWarningModal] = useState(null);
  const [modalCountdown, setModalCountdown] = useState(10);
  const modalTimerRef = useRef(null);

  // Refs to prevent event listeners from re-registering on every question option select
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const examRef = useRef(exam);
  const submittingRef = useRef(submitting);
  const attemptIdRef = useRef(attemptId);
  const proctoringSessionIdRef = useRef(proctoringSessionId);
  const tabSwitchLimitRef = useRef(tabSwitchLimit);
  const warningModalRef = useRef(warningModal);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { proctoringSessionIdRef.current = proctoringSessionId; }, [proctoringSessionId]);
  useEffect(() => { tabSwitchLimitRef.current = tabSwitchLimit; }, [tabSwitchLimit]);
  useEffect(() => { warningModalRef.current = warningModal; }, [warningModal]);
  // Trigger immediate disqualification and auto-submission
  const triggerDisqualification = async (reason) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    setSubmitting(true);
    setWarningModal(null);

    const sId = proctoringSessionIdRef.current;
    const currAttemptId = attemptIdRef.current || attemptId;

    if (sId) {
      try {
        await api.post(`/v1/proctoring/sessions/${sId}/disqualify`, {
          reason: reason || "Proctoring violation limit exceeded",
          attemptId: currAttemptId,
        });
      } catch (err) {
        console.warn("Failed to notify backend of disqualification:", err);
      }
    } else if (currAttemptId) {
      try {
        await api.post("/answers/submit", { attemptId: currAttemptId, submissionType: "Disqualified" });
      } catch (err) {
        console.warn("Fallback submit error:", err);
      }
    }

    navigate(`/exams/${examId}/result`, {
      state: {
        attemptId: currAttemptId,
        correct: 0,
        total: questionsRef.current.length,
        answeredCount: Object.keys(answersRef.current).length,
        score: 0,
        percentage: 0,
        examTitle: examRef.current.title,
        disqualified: true,
        reason: reason || "Proctoring violation limit exceeded",
      },
      replace: true,
    });
  };

  const acknowledgeWarningModal = async () => {
    if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    setWarningModal(null);
    setModalCountdown(10);

    // Automatically re-trigger fullscreen on acknowledgement click if exited
    if (!isFullscreen()) {
      try {
        await requestFullscreen();
      } catch (err) {
        console.warn("Failed to re-enter fullscreen automatically:", err);
      }
    }
  };

  // 10-Second Auto-Disqualification Countdown Timer for Warning Modal
  useEffect(() => {
    if (warningModal) {
      setModalCountdown(10);
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);

      modalTimerRef.current = setInterval(() => {
        setModalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(modalTimerRef.current);
            triggerDisqualification("Failed to acknowledge proctoring warning within 10 seconds");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    }

    return () => {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    };
  }, [warningModal]);

  // Initialize test attempt from API
  useEffect(() => {
    async function initExam() {
      try {
        setLoading(true);
        const res = await api.post(`/exams/${examId}/start`);
        if (res.data) {
          const { attempt, exam: examData, questions: qData, proctoringSession } = res.data;

          if (attempt?.status && ["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(attempt.status)) {
            toast.error("This exam has already been submitted and cannot be resumed.");
            navigate(`/exams/${examId}/result`, { state: { attemptId: attempt._id, disqualified: attempt.status === "Auto Submitted" || attempt.status === "Disqualified" }, replace: true });
            return;
          }

          if (attempt?._id) setAttemptId(attempt._id);

          if (proctoringSession?._id) {
            setProctoringSessionId(proctoringSession._id);
          }

          if (examData?.title) {
            setExam({
              id: examData._id,
              title: examData.title,
              minutes: 30,
              totalMarks: examData.totalMarks || 10,
            });
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
          }

          // Fetch settings to check if proctoring is enabled
          try {
            const settingsRes = await api.get(`/test-management/${examId}`);
            if (settingsRes.data?.setting) {
              const s = settingsRes.data.setting;
              setProctoringEnabled(s.proctoringEnabled !== false);
              setTabSwitchLimit(s.tabSwitchLimit || 3);
            }
          } catch (e) {
            console.warn("Failed to fetch settings, defaulting proctoring to active:", e.message);
            setProctoringEnabled(true);
          }

          // Calculate remaining duration based on start time (30 min default)
          if (attempt?.started_at) {
            const startTime = new Date(attempt.started_at).getTime();
            const totalDurationMs = 30 * 60 * 1000;
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, Math.floor(totalDurationMs / 1000) - elapsedSeconds);
            setSeconds(remaining);
          }

          // Fetch pre-saved answers if resuming attempt
          if (attempt?._id) {
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
        console.warn("Exam start error:", err);
        const msg = err.response?.data?.message || "Exam cannot be started or resumed.";
        if (err.response?.status === 400 || err.response?.status === 403) {
          toast.error(msg);
          navigate("/dashboard", { replace: true });
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    initExam();
  }, [examId]);

  const finishExam = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (modalTimerRef.current) clearInterval(modalTimerRef.current);

    // End proctoring session cleanly on submission
    if (proctoringSessionId) {
      try {
        await api.post(`/v1/proctoring/sessions/${proctoringSessionId}/end`);
      } catch (err) {
        console.warn("Failed to end proctoring session:", err);
      }
    }

    let submitResult = null;
    if (attemptId) {
      try {
        const res = await api.post("/answers/submit", { attemptId });
        submitResult = res.data;
      } catch (err) {
        console.warn("Backend submit error, using client calculation:", err);
      }
    }

    const answeredCount = Object.keys(answers).length;

    navigate(`/exams/${examId}/result`, {
      state: {
        attemptId,
        correct: submitResult?.score ?? answeredCount,
        total: submitResult?.totalMarks ?? questions.length,
        answeredCount,
        score: submitResult?.score,
        percentage: submitResult?.percentage,
        examTitle: exam.title,
      },
    });
  };

  const logProctoringEvent = async (eventType) => {
    const sId = proctoringSessionIdRef.current;
    if (!sId || submittingRef.current || warningModalRef.current) return;
    try {
      const res = await api.post(`/v1/proctoring/sessions/${sId}/events`, {
        eventType,
      });
      if (res.data?.success) {
        const updatedSession = res.data.data?.session;
        const currentSwitches = updatedSession?.tabSwitchCount || 0;

        if (updatedSession?.status === "TERMINATED" || currentSwitches >= tabSwitchLimitRef.current) {
          triggerDisqualification("Exceeded maximum allowed tab or window switches");
          return;
        }

        // Do not show warning modal for copy/paste actions as per requirements
        if (eventType === "COPY" || eventType === "PASTE") {
          return;
        }

        // Show Warning Modal Popup
        let detailMsg = "You navigated away from the exam window or switched tabs.";
        if (eventType === "FULLSCREEN_EXIT") detailMsg = "You exited fullscreen or resized the exam window.";

        setWarningModal({
          eventType,
          message: detailMsg,
          switchCount: currentSwitches,
          limit: tabSwitchLimitRef.current,
        });
      }
    } catch (err) {
      console.warn("Failed to log proctoring event to backend:", err);
    }
  };

  // Proctoring Event Listeners
  useEffect(() => {
    if (!proctoringEnabled || !proctoringSessionId || !attemptId) return;

    let lastTabSwitchTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastTabSwitchTime > 1000) {
          lastTabSwitchTime = now;
          logProctoringEvent("TAB_SWITCH");
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastTabSwitchTime > 1000) {
        lastTabSwitchTime = now;
        logProctoringEvent("TAB_SWITCH"); // Log as TAB_SWITCH so switching windows/monitors increments tabSwitchCount
      }
    };

    const handleFullscreenChange = () => {
      const isFull = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      if (!isFull) {
        logProctoringEvent("FULLSCREEN_EXIT");
      }
    };

    let lastResizeTime = 0;
    const handleResize = () => {
      const now = Date.now();
      if (now - lastResizeTime < 1500) return;

      const thresholdWidth = screen.width - 60;
      const thresholdHeight = screen.height - 60;
      if (window.outerWidth < thresholdWidth || window.outerHeight < thresholdHeight) {
        lastResizeTime = now;
        logProctoringEvent("FULLSCREEN_EXIT");
      }
    };

    const handleCopy = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!isFullscreen()) {
        requestFullscreen().catch(() => { });
      }
    };

    const handlePaste = (e) => {
      if (e && e.preventDefault) e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleResize);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCopy);
    window.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCopy);
      window.removeEventListener("paste", handlePaste);
    };
  }, [proctoringEnabled, proctoringSessionId, attemptId]);

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
    if (seconds === 0 && !loading) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, loading]);

  const answeredCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;

  async function selectOption(qIndex, optIndex) {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));

    // Save answer to backend if attemptId is present
    const qObj = questions[qIndex];
    if (attemptId && qObj?.id && qObj?.rawOptions?.[optIndex]?._id) {
      try {
        await api.post("/answers/save", {
          attemptId,
          questionId: qObj.id,
          selectedOptionId: qObj.rawOptions[optIndex]._id,
        });
      } catch (err) {
        console.warn("Failed to persist student answer to backend:", err);
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

  const q = questions[current] || questions[0];

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
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700">
            <Clock size={15} /> {formatTime(seconds)}
          </div>
          <button
            onClick={finishExam}
            disabled={submitting}
            className="flex items-center gap-1.5 text-white font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {submitting ? "Submitting..." : "Submit"} <Flag size={14} />
          </button>
        </div>
      </div>

      {/* WARNING MODAL POPUP WITH 10s COUNTDOWN */}
      {warningModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-red-100 transform animate-scale-up">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertCircle size={36} />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: FONT_DISPLAY }}>
              Proctoring Warning!
            </h2>

            <p className="text-slate-600 text-sm mb-4">
              {warningModal.message}
            </p>

            {warningModal.limit > 0 && (
              <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6">
                Warning Count: {warningModal.switchCount} of {warningModal.limit} allowed switches
              </div>
            )}

            {/* COUNTDOWN TIMER RING */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <span className="text-xs text-red-700 font-semibold block uppercase tracking-wider mb-1">
                Acknowledge Requirement
              </span>
              <div className="text-3xl font-black text-red-600 font-mono">
                {modalCountdown}s
              </div>
              <p className="text-[11px] text-red-500 mt-1">
                Auto-submitting & disqualifying if not acknowledged in time!
              </p>
            </div>

            <button
              onClick={acknowledgeWarningModal}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-red-600/25 transition-all cursor-pointer text-sm"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

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
