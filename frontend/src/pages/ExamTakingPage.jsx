import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Clock, Flag, ChevronLeft, ChevronRight, AlertCircle, Loader2, 
  Bookmark, BookmarkCheck, RotateCcw, LayoutGrid, X, Check, Eye, Maximize2 
} from "lucide-react";
import { formatTime } from "../utils/formatters";
import { BRAND, BRAND_TINT, INK, FONT_DISPLAY, FONT_BODY } from "../constants/theme";
import { useToast } from "../context/ToastContext";
import { requestFullscreen, exitFullscreen, isFullscreen } from "../utils/fullscreen";
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
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [paletteDrawerOpen, setPaletteDrawerOpen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState("all"); // "all" | "answered" | "marked" | "unanswered"
  const [seconds, setSeconds] = useState(1800);
  const timerRef = useRef(null);
  const targetEndTimeRef = useRef(null);

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
  const isWarningActiveRef = useRef(false);
  const warningGraceUntilRef = useRef(0);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { proctoringSessionIdRef.current = proctoringSessionId; }, [proctoringSessionId]);
  useEffect(() => { tabSwitchLimitRef.current = tabSwitchLimit; }, [tabSwitchLimit]);
  useEffect(() => { 
    warningModalRef.current = warningModal; 
    if (!warningModal) isWarningActiveRef.current = false;
  }, [warningModal]);

  // Trigger immediate disqualification and auto-submission
  const triggerDisqualification = async (reason) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    setSubmitting(true);
    setWarningModal(null);
    isWarningActiveRef.current = false;

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

    if (isFullscreen()) {
      exitFullscreen().catch(() => {});
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
    isWarningActiveRef.current = false;
    // 1.5-second grace period after modal dismissal so refocusing doesn't trigger repeat violations
    warningGraceUntilRef.current = Date.now() + 1500;

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

  // Automatically auto-submit the exam if the student closes the browser, quits the tab, or navigates away
  useEffect(() => {
    const handleUnloadOrQuit = () => {
      if (submittingRef.current || !attemptIdRef.current) return;
      submittingRef.current = true;

      const currAttemptId = attemptIdRef.current;
      const currSessionId = proctoringSessionIdRef.current;
      const token = localStorage.getItem("token") || "";

      const baseUrl = api.defaults.baseURL || "http://localhost:5000/api";
      const submitUrl = `${baseUrl}/answers/submit`;

      const payload = JSON.stringify({
        attemptId: currAttemptId,
        submissionType: "Auto Submitted",
        token,
      });

      let beaconSent = false;
      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          beaconSent = navigator.sendBeacon(submitUrl, blob);
        } catch (e) {
          beaconSent = false;
        }
      }

      if (!beaconSent) {
        try {
          fetch(submitUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": token ? `Bearer ${token}` : "",
            },
            body: payload,
            keepalive: true,
            credentials: "include",
          }).catch(() => {});
        } catch (e) {}
      }

      if (currSessionId) {
        try {
          const endSessionUrl = `${baseUrl}/v1/proctoring/sessions/${currSessionId}/end`;
          if (navigator.sendBeacon) {
            navigator.sendBeacon(endSessionUrl, new Blob([JSON.stringify({ token })], { type: "application/json" }));
          }
        } catch (e) {}
      }
    };

    window.addEventListener("beforeunload", handleUnloadOrQuit);
    window.addEventListener("pagehide", handleUnloadOrQuit);

    return () => {
      window.removeEventListener("beforeunload", handleUnloadOrQuit);
      window.removeEventListener("pagehide", handleUnloadOrQuit);

      if (!submittingRef.current && attemptIdRef.current) {
        handleUnloadOrQuit();
      }
    };
  }, []);

  const isInitiatingRef = useRef(false);

  // Initialize test attempt from API
  useEffect(() => {
    if (isInitiatingRef.current) return;
    isInitiatingRef.current = true;

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

          // Calculate remaining duration and set absolute target end time
          const totalMinutes = examData?.durationMinutes || examData?.minutes || 30;
          const totalDurationMs = totalMinutes * 60 * 1000;
          let targetEnd = Date.now() + totalDurationMs;

          if (attempt?.started_at) {
            const startTime = new Date(attempt.started_at).getTime();
            targetEnd = startTime + totalDurationMs;
          }
          targetEndTimeRef.current = targetEnd;
          const remaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
          setSeconds(remaining);

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

  // Automatically request fullscreen mode once exam is ready
  useEffect(() => {
    if (!loading && !isFullscreen()) {
      requestFullscreen().catch(() => {});
    }
  }, [loading]);

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

    if (isFullscreen()) {
      exitFullscreen().catch(() => {});
    }

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
    if (!sId || submittingRef.current || warningModalRef.current || isWarningActiveRef.current) return;

    // Immediately lock out subsequent events synchronously while this event is evaluated and modal is active
    isWarningActiveRef.current = true;

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
          isWarningActiveRef.current = false;
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
      } else {
        isWarningActiveRef.current = false;
      }
    } catch (err) {
      console.warn("Failed to log proctoring event to backend:", err);
      isWarningActiveRef.current = false;
    }
  };

  // Proctoring Event Listeners
  useEffect(() => {
    if (!proctoringEnabled || !proctoringSessionId || !attemptId) return;

    let lastTabSwitchTime = 0;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (submittingRef.current || warningModalRef.current || isWarningActiveRef.current) return;
        logProctoringEvent("FULLSCREEN_EXIT");
      }
    };

    const handleVisibilityChange = () => {
      if (submittingRef.current || warningModalRef.current || isWarningActiveRef.current) return;
      if (document.hidden) {
        const now = Date.now();
        if (now - lastTabSwitchTime > 1500) {
          lastTabSwitchTime = now;
          logProctoringEvent("TAB_SWITCH");
        }
      }
    };

    const handleWindowBlur = () => {
      if (submittingRef.current || warningModalRef.current || isWarningActiveRef.current) return;
      const now = Date.now();
      if (now - lastTabSwitchTime > 1500) {
        lastTabSwitchTime = now;
        logProctoringEvent("TAB_SWITCH"); // Log as TAB_SWITCH so switching windows/monitors increments tabSwitchCount
      }
    };

    const handleFullscreenChange = () => {
      if (submittingRef.current || warningModalRef.current || isWarningActiveRef.current || Date.now() < warningGraceUntilRef.current) return;
      if (!isFullscreen()) {
        logProctoringEvent("FULLSCREEN_EXIT");
      }
    };

    let lastResizeTime = 0;
    const handleResize = () => {
      if (submittingRef.current || warningModalRef.current || isWarningActiveRef.current) return;
      const now = Date.now();
      if (now - lastResizeTime < 1500) return;

      const thresholdWidth = screen.width - 50;
      const thresholdHeight = screen.height - 50;
      if (!isFullscreen() || window.outerWidth < thresholdWidth || window.outerHeight < thresholdHeight) {
        lastResizeTime = now;
        logProctoringEvent("FULLSCREEN_EXIT");
      }
    };

    const handleCopy = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!isFullscreen() && !warningModalRef.current && !isWarningActiveRef.current) {
        requestFullscreen().catch(() => { });
      }
    };

    const handlePaste = (e) => {
      if (e && e.preventDefault) e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
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
      window.removeEventListener("keydown", handleKeyDown);
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
    const updateTimer = () => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setSeconds(remaining);
      if (remaining <= 0 && !submittingRef.current && !loading) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishExam();
      }
    };

    // 500ms active interval tick
    timerRef.current = setInterval(updateTimer, 500);

    const handleSync = () => {
      updateTimer();
    };

    window.addEventListener("focus", handleSync);
    window.addEventListener("pageshow", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("pageshow", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [loading]);

  useEffect(() => {
    setVisited((prev) => ({ ...prev, [current]: true }));
  }, [current]);

  const toggleMarkForReview = (qIndex = current) => {
    setMarkedForReview((prev) => {
      const copy = { ...prev };
      if (copy[qIndex]) {
        delete copy[qIndex];
      } else {
        copy[qIndex] = true;
      }
      return copy;
    });
  };

  const clearCurrentResponse = async (qIndex = current) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qIndex];
      return copy;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).length;
  const answeredAndMarkedCount = questions.filter((_, i) => answers[i] !== undefined && markedForReview[i]).length;
  const visitedUnansweredCount = questions.filter((_, i) => answers[i] === undefined && visited[i] && !markedForReview[i]).length;
  const notVisitedCount = questions.filter((_, i) => answers[i] === undefined && !visited[i] && !markedForReview[i]).length;

  const isCurrentMarked = !!markedForReview[current];
  const isCurrentAnswered = answers[current] !== undefined;
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

  // Reusable Question Palette Grid
  const renderPaletteContent = (isDrawer = false) => {
    const filteredQuestions = questions.map((qObj, idx) => ({ ...qObj, idx })).filter(item => {
      const i = item.idx;
      const ans = answers[i] !== undefined;
      const mrk = !!markedForReview[i];
      if (paletteFilter === "answered") return ans;
      if (paletteFilter === "marked") return mrk;
      if (paletteFilter === "unanswered") return !ans;
      return true;
    });

    return (
      <div className="space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setPaletteFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              paletteFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setPaletteFilter("answered")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              paletteFilter === "answered" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Ans ({answeredCount})
          </button>
          <button
            onClick={() => setPaletteFilter("marked")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              paletteFilter === "marked" ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Marked ({markedCount})
          </button>
          <button
            onClick={() => setPaletteFilter("unanswered")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              paletteFilter === "unanswered" ? "bg-amber-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Unans ({questions.length - answeredCount})
          </button>
        </div>

        {/* Grid of Question Buttons */}
        <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto p-1 pr-1.5 scrollbar-thin">
          {filteredQuestions.map((item) => {
            const i = item.idx;
            const isAnswered = answers[i] !== undefined;
            const isMarked = !!markedForReview[i];
            const isVis = !!visited[i];
            const isCur = i === current;

            let btnStyle = "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200";
            if (isAnswered && isMarked) {
              btnStyle = "bg-purple-600 text-white border-2 border-emerald-400 shadow-sm";
            } else if (isAnswered) {
              btnStyle = "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm";
            } else if (isMarked) {
              btnStyle = "bg-purple-100 text-purple-800 border-2 border-purple-400 hover:bg-purple-200 font-bold";
            } else if (isVis) {
              btnStyle = "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200";
            }

            return (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  if (isDrawer) setPaletteDrawerOpen(false);
                }}
                className={`relative h-10 w-full rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer select-none ${btnStyle} ${
                  isCur ? "ring-2 ring-offset-2 ring-slate-900 scale-105 z-10 font-extrabold shadow-md" : ""
                }`}
                title={`Question ${i + 1}`}
              >
                {i + 1}
                {/* Answered & Marked dual-indicator */}
                {isAnswered && isMarked && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                )}
                {/* Marked only ribbon icon */}
                {!isAnswered && isMarked && (
                  <Bookmark size={10} className="absolute top-1 right-1 fill-purple-600 text-purple-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold shrink-0">✓</span>
            <span>Answered ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-100 border border-purple-400 flex items-center justify-center text-[8px] text-purple-700 font-bold shrink-0">★</span>
            <span>Marked ({markedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-600 border border-emerald-400 flex items-center justify-center text-[8px] text-white font-bold shrink-0">★✓</span>
            <span>Ans & Marked ({answeredAndMarkedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-[8px] text-amber-900 font-bold shrink-0">!</span>
            <span>Skipped ({visitedUnansweredCount})</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[8px] text-gray-500 shrink-0">·</span>
            <span>Not Visited ({notVisitedCount})</span>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-3.5 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-gray-900 text-sm sm:text-base" style={{ fontFamily: FONT_DISPLAY }}>
              {exam.title}
            </div>
            <div className="text-xs text-gray-400">
              Question {current + 1} of {questions.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Question Palette Trigger Button */}
          <button
            onClick={() => setPaletteDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full transition-colors cursor-pointer"
            title="Open Question Palette"
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">Palette</span>
            <span className="bg-slate-800 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
              {answeredCount}/{questions.length}
            </span>
          </button>

          {/* Clock Timer Badge */}
          <div className={`flex items-center gap-1.5 border rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold ${
            seconds < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-gray-50 text-gray-800 border-gray-200"
          }`}>
            <Clock size={15} /> {formatTime(seconds)}
          </div>

          {/* Submit Button */}
          <button
            onClick={finishExam}
            disabled={submitting}
            className="flex items-center gap-1.5 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
            style={{ background: BRAND }}
          >
            {submitting ? "Submitting..." : "Submit"} <Flag size={14} />
          </button>
        </div>
      </div>

      {/* SLIDE-OVER QUESTION PALETTE DRAWER (MODAL FOR MOBILE & EXPANDED VIEW) */}
      {paletteDrawerOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl p-6 overflow-y-auto animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: FONT_DISPLAY }}>
                  Question Palette
                </h3>
                <p className="text-xs text-gray-500">Jump directly to any question</p>
              </div>
              <button
                onClick={() => setPaletteDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Palette Grid */}
            <div className="flex-1 overflow-y-auto">
              {renderPaletteContent(true)}
            </div>

            {/* Drawer Footer Action */}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setPaletteDrawerOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Resume Current Question ({current + 1})
              </button>
            </div>
          </div>
        </div>
      )}

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

            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6">
              Warning #{warningModal.switchCount} Issued
            </div>

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

      {/* FULLSCREEN ENTRY MODAL IF NOT IN FULLSCREEN */}
      {!isFullscreen() && !warningModal && !loading && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-indigo-100">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Maximize2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: FONT_DISPLAY }}>
              Fullscreen Mode Required
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              This exam is securely monitored and must be taken in fullscreen mode.
            </p>
            <button
              onClick={async () => {
                try {
                  await requestFullscreen();
                } catch (e) {
                  console.warn("Fullscreen enter error:", e);
                }
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <Maximize2 size={16} /> Enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

      {/* MAIN EXAM LAYOUT */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto w-full flex-1">
        {/* QUESTION & OPTIONS CONTAINER */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            {/* Question Card Top Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                  QUESTION {current + 1}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  +{q.marks || 1} {q.marks === 1 ? "Mark" : "Marks"}
                </span>
              </div>

              {/* Mark for Review Toggle Pill in Card Header */}
              <button
                onClick={() => toggleMarkForReview(current)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isCurrentMarked
                    ? "bg-purple-100 text-purple-700 border border-purple-300 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                }`}
              >
                {isCurrentMarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span>{isCurrentMarked ? "Marked for Review" : "Mark for Review"}</span>
              </button>
            </div>

            {/* Question Prompt */}
            <p className="text-base sm:text-lg text-gray-900 font-medium mb-6 leading-relaxed">
              {q.q}
            </p>

            {/* Options List */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[current] === i;
                const letter = String.fromCharCode(65 + i);
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(current, i)}
                    className="w-full flex items-center gap-3.5 border rounded-xl px-5 py-3.5 text-left transition-all cursor-pointer hover:border-gray-300"
                    style={{
                      background: selected ? BRAND_TINT : "#fff",
                      borderColor: selected ? BRAND : "#E5E7EB",
                      boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                      style={{
                        background: selected ? BRAND : "#F3F4F6",
                        color: selected ? "#fff" : "#6B7280",
                      }}
                    >
                      {letter}
                    </span>
                    <span className={`text-sm ${selected ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Left Action Buttons: Clear Response & Mark for Review */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearCurrentResponse(current)}
                disabled={!isCurrentAnswered}
                className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw size={14} /> Clear Choice
              </button>
              <button
                onClick={() => toggleMarkForReview(current)}
                className={`flex items-center gap-1.5 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm ${
                  isCurrentMarked 
                    ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" 
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {isCurrentMarked ? <BookmarkCheck size={14} className="text-purple-600" /> : <Bookmark size={14} />}
                <span>{isCurrentMarked ? "Unmark" : "Mark Review"}</span>
              </button>
            </div>

            {/* Right Action Buttons: Previous, Next, Finish */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {isLast ? (
                <button
                  onClick={finishExam}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-white font-semibold text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                  style={{ background: BRAND }}
                >
                  {submitting ? "Submitting..." : "Finish Exam"} <Flag size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="flex items-center gap-1.5 text-white font-semibold text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                  style={{ background: INK }}
                >
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP SIDEBAR QUESTION PALETTE */}
        <div className="hidden lg:block space-y-5">
          {/* Question Palette Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: FONT_DISPLAY }}>
                Question Palette
              </h3>
              <span className="text-xs text-gray-500 font-semibold font-mono">
                {answeredCount}/{questions.length} Ans
              </span>
            </div>
            {renderPaletteContent(false)}
          </div>

          {/* Test Progress Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500 uppercase tracking-wider">Exam Progress</span>
              <span className="text-gray-900">
                {Math.round((answeredCount / (questions.length || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
