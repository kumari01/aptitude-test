import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  Settings, 
  Calendar, 
  HelpCircle, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User, 
  X,
  Send,
  Lock,
  ListOrdered
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import AdminWorkflowVisualizer from "../components/admin/AdminWorkflowVisualizer";
import CreateTestWizardModal from "../components/admin/CreateTestWizardModal";
import LiveProctoringMonitorModal from "../components/admin/LiveProctoringMonitorModal";

export function AdminDashboardPage() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overview metrics
  const [overviewStats, setOverviewStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    draftExams: 0,
    totalSchedules: 0,
    totalAttempts: 0,
    disqualifiedAttempts: 0,
    totalStudents: 0,
  });

  // Wizard modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialTestId, setWizardInitialTestId] = useState("");

  // Live Proctoring Monitor modal state
  const [liveMonitorOpen, setLiveMonitorOpen] = useState(false);
  const [monitorTestId, setMonitorTestId] = useState("");
  const [monitorTestTitle, setMonitorTestTitle] = useState("");

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'createTest' | 'addQuestion' | 'settings' | 'target' | 'schedule' | 'createSection' | 'addSectionQuestion'
  const [selectedTestId, setSelectedTestId] = useState("");

  // Form states
  const [createTestForm, setCreateTestForm] = useState({
    title: "",
    testType: "Aptitude",
    durationMinutes: 30,
    maxAttempts: 1
  });

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

  const [targetForm, setTargetForm] = useState({
    testId: "",
    targetType: "All", // "All" | "Department" | "Batch" | "SpecificStudents"
    departments: "",
    batches: "",
    studentRollNumbers: ""
  });

  const [scheduleForm, setScheduleForm] = useState({
    testId: "",
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  });

  const [createSectionForm, setCreateSectionForm] = useState({
    testId: "",
    name: "Section A: Aptitude",
    displayOrder: 1,
    totalMarks: 10
  });

  const [addSectionQuestionForm, setAddSectionQuestionForm] = useState({
    sectionId: "",
    questionId: "",
    displayOrder: 1,
    marks: 1
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

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
        setTests(formatted);
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

  // 1. Create Test
  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!createTestForm.title) {
      toast.warning("Please provide a test title");
      return;
    }
    try {
      const res = await api.post("/test-management/create", {
        title: createTestForm.title,
        testType: createTestForm.testType,
        durationMinutes: Number(createTestForm.durationMinutes),
        maxAttempts: Number(createTestForm.maxAttempts)
      });
      toast.success(res.data.message || "Test created successfully!");
      setActiveModal(null);
      setCreateTestForm({ title: "", testType: "Aptitude", durationMinutes: 30, maxAttempts: 1 });
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create test");
    }
  };

  // 2. Add Question to Exam
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const tId = addQuestionForm.testId || selectedTestId;
    if (!tId || !addQuestionForm.questionText) {
      toast.warning("Please select a test and enter question text");
      return;
    }
    try {
      const res = await api.post(`/exams/${tId}/questions`, {
        question_text: addQuestionForm.questionText,
        options: addQuestionForm.options.map(text => ({ text })),
        correct_answer: Number(addQuestionForm.correctAnswerIndex),
        marks: Number(addQuestionForm.marks)
      });
      toast.success(res.data.message || "Question created successfully!");
      setActiveModal(null);
      setAddQuestionForm({
        testId: "",
        questionText: "",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswerIndex: 0,
        marks: 1
      });
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add question");
    }
  };

  // 3. Update Settings
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const tId = settingsForm.testId || selectedTestId;
    if (!tId) {
      toast.warning("Please select a test");
      return;
    }
    try {
      const res = await api.put(`/test-management/${tId}/settings`, {
        tabSwitchLimit: Number(settingsForm.tabSwitchLimit),
        proctoringEnabled: settingsForm.proctoringEnabled,
        autoSubmit: settingsForm.autoSubmit
      });
      toast.success(res.data.message || "Settings updated successfully!");
      setActiveModal(null);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    }
  };

  // 4. Update Target
  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    const tId = targetForm.testId || selectedTestId;
    if (!tId) return;
    try {
      const depts = targetForm.departments ? targetForm.departments.split(",").map(s => s.trim()) : [];
      const batches = targetForm.batches ? targetForm.batches.split(",").map(s => s.trim()) : [];
      const rolls = targetForm.studentRollNumbers ? targetForm.studentRollNumbers.split(",").map(s => s.trim()) : [];

      const res = await api.put(`/test-management/${tId}/target`, {
        targetType: targetForm.targetType,
        departments: depts,
        batches: batches,
        studentRollNumbers: rolls
      });
      toast.success(res.data.message || "Targeting group updated!");
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update target group");
    }
  };

  // 5. Schedule Test
  const handleScheduleTest = async (e) => {
    e.preventDefault();
    const tId = scheduleForm.testId || selectedTestId;
    if (!tId) return;
    try {
      const res = await api.post(`/test-management/${tId}/schedule`, {
        startAt: new Date(scheduleForm.startAt).toISOString(),
        endAt: new Date(scheduleForm.endAt).toISOString()
      });
      toast.success(res.data.message || "Test scheduled and published!");
      setActiveModal(null);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule test");
    }
  };

  // 6. Create Section
  const handleCreateSection = async (e) => {
    e.preventDefault();
    const tId = createSectionForm.testId || selectedTestId;
    if (!tId || !createSectionForm.name) return;
    try {
      const res = await api.post(`/test-management/${tId}/sections`, {
        name: createSectionForm.name,
        displayOrder: Number(createSectionForm.displayOrder),
        totalMarks: Number(createSectionForm.totalMarks)
      });
      toast.success(res.data.message || "Section created successfully!");
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create section");
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            Admin Management Console
          </h1>
          <p className="text-gray-500 mt-1">Create exams, add questions, set proctoring rules, and schedule assessments</p>
        </div>
        <button
          onClick={() => {
            setWizardInitialTestId("");
            setIsWizardOpen(true);
          }}
          className="flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-sm shrink-0 cursor-pointer"
          style={{ background: BRAND }}
        >
          <Plus size={18} /> Launch Test Workflow Wizard
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

      {/* Admin Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Managed Exams"
          value={overviewStats.totalExams || tests.length}
          icon={<FileText size={18} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Published & Live"
          value={overviewStats.publishedExams || tests.filter(t => t.status === "Published").length}
          icon={<CheckCircle2 size={18} />}
          iconBg="#D1FAE5"
          iconColor="#059669"
        />
        <StatCard
          label="Total Student Attempts"
          value={overviewStats.totalAttempts || 0}
          icon={<Clock size={18} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Disqualified Attempts"
          value={overviewStats.disqualifiedAttempts || 0}
          icon={<ShieldAlert size={18} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
      </div>

      {/* Quick Action Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_DISPLAY }}>
          Quick Admin Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            onClick={() => {
              setWizardInitialTestId("");
              setIsWizardOpen(true);
            }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-center cursor-pointer"
          >
            <Plus size={20} className="mb-2 text-indigo-600" />
            <span className="text-xs font-bold">New Exam Wizard</span>
          </button>
          <button
            onClick={() => setActiveModal("addQuestion")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-center"
          >
            <HelpCircle size={20} className="mb-2 text-emerald-600" />
            <span className="text-xs font-bold">Add Question</span>
          </button>
          <button
            onClick={() => setActiveModal("settings")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-center"
          >
            <Settings size={20} className="mb-2 text-amber-600" />
            <span className="text-xs font-bold">Settings & Rules</span>
          </button>
          <button
            onClick={() => setActiveModal("schedule")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-center"
          >
            <Calendar size={20} className="mb-2 text-blue-600" />
            <span className="text-xs font-bold">Schedule Exam</span>
          </button>
          <button
            onClick={() => setActiveModal("createSection")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-center col-span-2 sm:col-span-1"
          >
            <Layers size={20} className="mb-2 text-purple-600" />
            <span className="text-xs font-bold">Create Section</span>
          </button>
        </div>
      </div>

      {/* Managed Exams List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            Managed Examinations
          </h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {tests.length} Total Exams
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No exams created yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Create New Exam" above to create your first assessment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((t) => (
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

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                  {t.status === "Published" && (
                    <button
                      onClick={() => {
                        setMonitorTestId(t.id);
                        setMonitorTestTitle(t.title);
                        setLiveMonitorOpen(true);
                      }}
                      className="flex-1 md:flex-none text-xs font-bold px-3.5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert size={13} /> Live Proctoring
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setWizardInitialTestId(t.id);
                      setIsWizardOpen(true);
                    }}
                    className="flex-1 md:flex-none text-xs font-bold px-3.5 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Workflow Wizard
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTestId(t.id);
                      setAddQuestionForm(prev => ({ ...prev, testId: t.id }));
                      setActiveModal("addQuestion");
                    }}
                    className="flex-1 md:flex-none text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  >
                    + Question
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTestId(t.id);
                      setSettingsForm(prev => ({ ...prev, testId: t.id }));
                      setActiveModal("settings");
                    }}
                    className="flex-1 md:flex-none text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTestId(t.id);
                      setScheduleForm(prev => ({ ...prev, testId: t.id }));
                      setActiveModal("schedule");
                    }}
                    className="flex-1 md:flex-none text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. Create Test Modal */}
      {activeModal === "createTest" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Create New Exam</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms Midterm"
                  value={createTestForm.title}
                  onChange={(e) => setCreateTestForm({ ...createTestForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category / Type</label>
                  <select
                    value={createTestForm.testType}
                    onChange={(e) => setCreateTestForm({ ...createTestForm, testType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Technical">Technical</option>
                    <option value="Logical">Logical</option>
                    <option value="Verbal">Verbal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={createTestForm.durationMinutes}
                    onChange={(e) => setCreateTestForm({ ...createTestForm, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Create Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Question Modal */}
      {activeModal === "addQuestion" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Add Question</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddQuestion} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Exam *</label>
                <select
                  value={addQuestionForm.testId}
                  onChange={(e) => setAddQuestionForm({ ...addQuestionForm, testId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Exam --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Text *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter the question prompt..."
                  value={addQuestionForm.questionText}
                  onChange={(e) => setAddQuestionForm({ ...addQuestionForm, questionText: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">Options & Correct Answer</label>
                {addQuestionForm.options.map((optText, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={addQuestionForm.correctAnswerIndex === idx}
                      onChange={() => setAddQuestionForm({ ...addQuestionForm, correctAnswerIndex: idx })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={optText}
                      onChange={(e) => {
                        const newOpts = [...addQuestionForm.options];
                        newOpts[idx] = e.target.value;
                        setAddQuestionForm({ ...addQuestionForm, options: newOpts });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Marks</label>
                <input
                  type="number"
                  min="1"
                  value={addQuestionForm.marks}
                  onChange={(e) => setAddQuestionForm({ ...addQuestionForm, marks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Settings & Proctoring Rules Modal */}
      {activeModal === "settings" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Proctoring & Settings</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSettings} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tab Switch Limit</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.tabSwitchLimit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tabSwitchLimit: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold text-gray-700">Enable Proctoring Restrictions</span>
                <input
                  type="checkbox"
                  checked={settingsForm.proctoringEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, proctoringEnabled: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold text-gray-700">Auto-Submit on Time Limit</span>
                <input
                  type="checkbox"
                  checked={settingsForm.autoSubmit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoSubmit: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Update Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Schedule Exam Modal */}
      {activeModal === "schedule" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Schedule & Publish Exam</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleTest} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Start Timestamp *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.startAt}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">End Timestamp *</label>
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
                <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Schedule & Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Section Modal */}
      {activeModal === "createSection" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>Create Section</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSection} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Exam *</label>
                <select
                  value={createSectionForm.testId}
                  onChange={(e) => setCreateSectionForm({ ...createSectionForm, testId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                >
                  <option value="">-- Select Exam --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section A: Logical Reasoning"
                  value={createSectionForm.name}
                  onChange={(e) => setCreateSectionForm({ ...createSectionForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={createSectionForm.displayOrder}
                    onChange={(e) => setCreateSectionForm({ ...createSectionForm, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={createSectionForm.totalMarks}
                    onChange={(e) => setCreateSectionForm({ ...createSectionForm, totalMarks: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: BRAND }}>Save Section</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
