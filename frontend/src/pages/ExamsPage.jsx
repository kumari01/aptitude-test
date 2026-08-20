import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Calendar, 
  Loader2, 
  Plus, 
  Layers, 
  MoreVertical, 
  HelpCircle, 
  Settings, 
  CheckCircle2,
  X
} from "lucide-react";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/common/StatCard";
import AdminWorkflowVisualizer from "../components/admin/AdminWorkflowVisualizer";
import CreateTestWizardModal from "../components/admin/CreateTestWizardModal";
import LiveProctoringMonitorModal from "../components/admin/LiveProctoringMonitorModal";

const formatForDateTimeLocal = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ExamsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = !!localStorage.getItem("admin");

  // Student state
  const [assignedExams, setAssignedExams] = useState([]);
  
  // Admin state
  const [adminTests, setAdminTests] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    draftExams: 0,
  });
  const [loading, setLoading] = useState(true);

  // Admin Modals & Action Menus
  const [openMenuTestId, setOpenMenuTestId] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialTestId, setWizardInitialTestId] = useState("");
  const [liveMonitorOpen, setLiveMonitorOpen] = useState(false);
  const [monitorTestId, setMonitorTestId] = useState("");
  const [monitorTestTitle, setMonitorTestTitle] = useState("");

  const [activeModal, setActiveModal] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState("");

  // Forms for Quick Actions
  const [addQuestionForm, setAddQuestionForm] = useState({
    testId: "",
    questionText: "",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correctAnswerIndex: 0,
    marks: 1
  });

  const [settingsForm, setSettingsForm] = useState({
    testId: "",
    tabSwitchLimit: 3,
    proctoringEnabled: true,
    autoSubmit: true
  });

  const [scheduleForm, setScheduleForm] = useState({
    testId: "",
    startAt: formatForDateTimeLocal(new Date()),
    endAt: formatForDateTimeLocal(new Date(Date.now() + 3600000))
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchAssignedTests();
    }
  }, [isAdmin]);

  // Student fetch
  const fetchAssignedTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/test-management/student/assigned");
      if (res.data?.tests) {
        const formatted = res.data.tests.map(({ test, setting, schedule, attempt }) => ({
          id: test._id,
          title: test.title,
          category: test.testType || "Aptitude",
          minutes: test.durationMinutes || 30,
          questions: 10,
          live: test.status === "Published",
          proctoring: setting?.proctoringEnabled ?? true,
          tabSwitchLimit: setting?.tabSwitchLimit ?? 3,
          startAt: schedule?.startAt,
          endAt: schedule?.endAt,
          attemptStatus: attempt?.status,
          attemptId: attempt?._id,
        }));
        setAssignedExams(formatted);
      }
    } catch (err) {
      console.warn("Could not fetch assigned tests:", err);
      setAssignedExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Admin fetch
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [allRes, overviewRes] = await Promise.all([
        api.get("/test-management/admin/all").catch(() => null),
        api.get("/test-management/admin/overview").catch(() => null),
      ]);

      if (allRes?.data?.tests) {
        const formatted = allRes.data.tests.map(({ test, setting, schedule }) => ({
          id: test._id,
          title: test.title,
          category: test.testType || "Aptitude",
          status: test.status || "Draft",
          durationMinutes: test.duration_minutes || test.durationMinutes || 30,
          totalMarks: test.totalMarks || 10,
          maxAttempts: test.maxAttempts || 1,
          setting,
          schedule
        }));
        setAdminTests(formatted);
      }

      if (overviewRes?.data) {
        setOverviewStats(overviewRes.data);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (id) => {
    navigate(`/exams/${id}`);
  };

  // Admin Quick Action Handlers
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const tId = addQuestionForm.testId || selectedTestId;
    if (!tId || !addQuestionForm.questionText) {
      toast.warning("Please select a test and enter question text");
      return;
    }
    try {
      const secRes = await api.post(`/test-management/${tId}/sections`, {
        name: "General Section",
        displayOrder: 1,
        totalMarks: Number(addQuestionForm.marks) || 1
      });
      const sectionId = secRes.data?.section?._id;
      if (!sectionId) throw new Error("Could not create section");

      await api.post(`/test-management/sections/${sectionId}/questions`, {
        questionText: addQuestionForm.questionText,
        options: addQuestionForm.options,
        correctAnswerIndex: Number(addQuestionForm.correctAnswerIndex),
        marks: Number(addQuestionForm.marks)
      });

      toast.success("Question added successfully!");
      setActiveModal(null);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add question");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const tId = settingsForm.testId || selectedTestId;
    try {
      await api.put(`/test-management/${tId}/settings`, {
        tabSwitchLimit: Number(settingsForm.tabSwitchLimit),
        proctoringEnabled: settingsForm.proctoringEnabled,
        autoSubmit: settingsForm.autoSubmit
      });
      toast.success("Proctoring settings updated successfully!");
      setActiveModal(null);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    }
  };

  const handleScheduleTest = async (e) => {
    e.preventDefault();
    const tId = scheduleForm.testId || selectedTestId;
    try {
      await api.post(`/test-management/${tId}/schedule`, {
        startAt: new Date(scheduleForm.startAt).toISOString(),
        endAt: new Date(scheduleForm.endAt).toISOString()
      });
      toast.success("Test scheduled and published successfully!");
      setActiveModal(null);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule test");
    }
  };

  // ================= ADMIN MANAGED EXAMINATIONS VIEW =================
  if (isAdmin) {
    return (
      <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              Managed Examinations
            </h1>
            <p className="text-gray-500 mt-1">Author assessment questions, set proctoring policies, and schedule exam windows</p>
          </div>
          <button
            onClick={() => {
              setWizardInitialTestId("");
              setIsWizardOpen(true);
            }}
            className="flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-sm shrink-0 cursor-pointer text-sm"
            style={{ background: BRAND }}
          >
            <Plus size={18} /> Launch Test Provisioning Pipeline
          </button>
        </div>

        {/* Interactive Workflow Diagram Banner */}
        <AdminWorkflowVisualizer 
          onStartWorkflow={() => {
            setWizardInitialTestId("");
            setIsWizardOpen(true);
          }} 
        />

        {/* Create Test Guided Wizard Modal */}
        <CreateTestWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onTestPublished={fetchAdminData}
          initialTestId={wizardInitialTestId}
        />

        {/* Live Proctoring Monitor Modal */}
        <LiveProctoringMonitorModal
          isOpen={liveMonitorOpen}
          onClose={() => setLiveMonitorOpen(false)}
          testId={monitorTestId}
          testTitle={monitorTestTitle}
        />

        {/* Managed Exams List Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
                All Examinations & Setup Pipeline
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Author exam questions, configure security policy rules, schedule windows, and monitor proctoring telemetry.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {adminTests.length} Total Exams
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="font-medium text-sm">Loading examinations...</p>
            </div>
          ) : adminTests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-slate-50 rounded-xl border border-slate-200">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">No exams created yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click "Launch Test Provisioning Pipeline" above to create your first assessment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminTests.map((t) => (
                <div key={t.id} className="p-5 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {t.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          t.status === "Published" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
                      {t.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Duration: {t.durationMinutes} mins</span>
                      <span>Total Marks: {t.totalMarks}</span>
                      <span>Max Attempts: {t.maxAttempts}</span>
                      <span>Tab Switch Limit: {t.setting?.tabSwitchLimit ?? 3}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative shrink-0">
                    {/* Primary Action Button */}
                    {t.status === "Published" ? (
                      <button
                        onClick={() => {
                          setMonitorTestId(t.id);
                          setMonitorTestTitle(t.title);
                          setLiveMonitorOpen(true);
                        }}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShieldAlert size={14} /> Live Proctoring
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setWizardInitialTestId(t.id);
                          setIsWizardOpen(true);
                        }}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        style={{ background: BRAND }}
                      >
                        <Layers size={14} /> Launch Pipeline
                      </button>
                    )}

                    {/* 3-Dots Action Popover Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuTestId(openMenuTestId === t.id ? null : t.id);
                      }}
                      className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Sleek Enterprise Dropdown Popover */}
                    {openMenuTestId === t.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setOpenMenuTestId(null)}
                        />
                        <div className="absolute right-0 top-12 z-30 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 text-xs text-slate-700 font-semibold space-y-1">
                          <button
                            onClick={() => {
                              setOpenMenuTestId(null);
                              setWizardInitialTestId(t.id);
                              setIsWizardOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                          >
                            <Layers size={15} className="text-red-600" />
                            <span>Setup & Pipeline Studio</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setOpenMenuTestId(null);
                              setSelectedTestId(t.id);
                              setAddQuestionForm(prev => ({ ...prev, testId: t.id }));
                              setActiveModal("addQuestion");
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                          >
                            <HelpCircle size={15} className="text-emerald-600" />
                            <span>Add Question Item</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuTestId(null);
                              setSelectedTestId(t.id);
                              setSettingsForm(prev => ({ ...prev, testId: t.id }));
                              setActiveModal("settings");
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                          >
                            <Settings size={15} className="text-amber-600" />
                            <span>Proctoring & Policy Rules</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuTestId(null);
                              setSelectedTestId(t.id);
                              setScheduleForm({
                                testId: t.id,
                                startAt: t.schedule?.startAt ? formatForDateTimeLocal(t.schedule.startAt) : formatForDateTimeLocal(new Date()),
                                endAt: t.schedule?.endAt ? formatForDateTimeLocal(t.schedule.endAt) : formatForDateTimeLocal(new Date(Date.now() + 3600000))
                              });
                              setActiveModal("schedule");
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors cursor-pointer"
                          >
                            <Calendar size={15} className="text-indigo-600" />
                            <span>Schedule Timestamp Window</span>
                          </button>

                          {t.status === "Published" && (
                            <button
                              onClick={() => {
                                setOpenMenuTestId(null);
                                setMonitorTestId(t.id);
                                setMonitorTestTitle(t.title);
                                setLiveMonitorOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-50 flex items-center gap-2.5 text-amber-900 border-t border-slate-100 transition-colors cursor-pointer"
                            >
                              <ShieldAlert size={15} className="text-amber-600" />
                              <span>Live Proctoring Stream</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Modals */}
        {activeModal === "addQuestion" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Add Question Item</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddQuestion} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Exam *</label>
                  <select
                    value={addQuestionForm.testId || selectedTestId}
                    onChange={(e) => setAddQuestionForm({ ...addQuestionForm, testId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  >
                    <option value="">-- Select Exam --</option>
                    {adminTests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Question Prompt *</label>
                  <textarea
                    required
                    rows="3"
                    value={addQuestionForm.questionText}
                    onChange={(e) => setAddQuestionForm({ ...addQuestionForm, questionText: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700">Answer Options & Correct Choice</label>
                  {addQuestionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={addQuestionForm.correctAnswerIndex === idx}
                        onChange={() => setAddQuestionForm({ ...addQuestionForm, correctAnswerIndex: idx })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...addQuestionForm.options];
                          updated[idx] = e.target.value;
                          setAddQuestionForm({ ...addQuestionForm, options: updated });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Add Question</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "settings" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Edit Security Settings</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateSettings} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Tab Switch Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.tabSwitchLimit}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tabSwitchLimit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-700">Strict Proctoring Mode</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.proctoringEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, proctoringEnabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Save Settings</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "schedule" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Schedule & Publish Exam</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleScheduleTest} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.startAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.endAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700">Schedule & Publish</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= STUDENT ASSIGNED EXAMS VIEW =================
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Exams & Assessments
      </h1>
      <p className="text-gray-500 mt-1 mb-6">All assigned aptitude tests, practice modules, and upcoming scheduled exams</p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="font-medium">Loading assigned exams...</p>
        </div>
      ) : assignedExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: FONT_DISPLAY }}>
            No exams assigned yet
          </h3>
          <p className="text-sm text-gray-500">
            You don't have any assigned tests right now. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {assignedExams.map((e) => {
            const now = new Date();
            const isUpcoming = e.startAt ? now < new Date(e.startAt) : false;
            const isExpired = e.endAt ? now > new Date(e.endAt) : false;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full ${
                        isUpcoming ? "bg-amber-100 text-amber-800" : e.live ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isUpcoming ? "UPCOMING" : e.live ? "LIVE NOW" : e.category.toUpperCase()}
                    </span>
                    {e.proctoring && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        <ShieldAlert size={12} /> Proctoring Enabled
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: FONT_DISPLAY }}>
                    {e.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-5">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} /> {e.questions} questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {e.minutes} minutes
                    </span>
                  </div>
                </div>

                {["Submitted", "Auto Submitted", "Disqualified", "Time Expired", "Completed"].includes(e.attemptStatus) ? (
                  <button
                    onClick={() => navigate(`/exams/${e.id}/result`, { state: { attemptId: e.attemptId, disqualified: e.attemptStatus === "Auto Submitted" || e.attemptStatus === "Disqualified" } })}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold py-3 rounded-xl hover:bg-slate-900 transition-opacity"
                  >
                    View Result <ArrowRight size={15} />
                  </button>
                ) : e.attemptStatus === "Started" ? (
                  <button
                    onClick={() => handleStartExam(e.id)}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                    style={{ background: BRAND }}
                  >
                    Resume Exam <ArrowRight size={15} />
                  </button>
                ) : isUpcoming ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 text-amber-900 bg-amber-100 font-semibold py-3 rounded-xl cursor-not-allowed text-xs"
                  >
                    Starts at {new Date(e.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ) : isExpired ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 text-slate-500 bg-slate-100 font-semibold py-3 rounded-xl cursor-not-allowed text-xs"
                  >
                    Exam Schedule Ended
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartExam(e.id)}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                    style={{ background: INK }}
                  >
                    {e.live ? "Take Exam" : "Start Practice"} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExamsPage;
