import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  FileText, 
  Settings, 
  Building2, 
  Globe, 
  HelpCircle, 
  Calendar, 
  CheckCircle2, 
  Upload, 
  FileCode, 
  Trash2, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";
import { BRAND, FONT_DISPLAY } from "../../constants/theme";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const PRESET_DEPARTMENTS = [
  "Computer Science (CS)",
  "Information Technology (IT)",
  "Electronics & Communication (ECE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Electrical Engineering (EE)",
  "Business Administration (MBA)",
  "Data Science & AI"
];

const SAMPLE_JSON_BANK = [
  {
    "question_text": "What is the time complexity of searching in a balanced Binary Search Tree?",
    "options": ["O(N)", "O(log N)", "O(N^2)", "O(1)"],
    "correct_answer": 1,
    "marks": 2
  },
  {
    "question_text": "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
    "options": ["Queue", "Stack", "Array", "Linked List"],
    "correct_answer": 1,
    "marks": 1
  },
  {
    "question_text": "What does HTTP stand for in web technologies?",
    "options": [
      "HyperText Transfer Protocol",
      "HighText Transfer Path",
      "HyperTerminal Transfer Program",
      "HyperText Transmission Process"
    ],
    "correct_answer": 0,
    "marks": 1
  }
];

const formatForDateTimeLocal = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CreateTestWizardModal({ isOpen, onClose, onTestPublished, initialTestId = null }) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdTestId, setCreatedTestId] = useState(initialTestId || "");

  // Form State Step 1: Create Test
  const [testForm, setTestForm] = useState({
    title: "",
    testType: "Aptitude",
    durationMinutes: 30,
    maxAttempts: 1
  });

  // Form State Step 2: Settings & Department Target
  const [settingsForm, setSettingsForm] = useState({
    tabSwitchLimit: 3,
    proctoringEnabled: true,
    autoSubmit: true,
    targetType: "All", // "All" | "Department"
    selectedDepartments: [],
    customDeptInput: ""
  });

  // Form State Step 3: Questions (Manual + JSON Bank)
  const [questionMode, setQuestionMode] = useState("json"); // "json" | "manual"
  const [questionsList, setQuestionsList] = useState([]);
  
  // Single Question Manual Form
  const [manualQuestion, setManualQuestion] = useState({
    question_text: "",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correct_answer: 0,
    marks: 1
  });

  // Form State Step 4: Schedule
  const [scheduleForm, setScheduleForm] = useState({
    startAt: formatForDateTimeLocal(new Date(Date.now() + 300000)), // 5 mins from now
    endAt: formatForDateTimeLocal(new Date(Date.now() + 3900000)) // +1 hr 5 mins
  });

  // Published Test Summary for Step 5
  const [publishedSummary, setPublishedSummary] = useState(null);

  useEffect(() => {
    if (initialTestId) {
      setCreatedTestId(initialTestId);
      loadExistingTestData(initialTestId);
    }
  }, [initialTestId]);

  const loadExistingTestData = async (tId) => {
    try {
      const res = await api.get(`/test-management/${tId}`);
      if (res.data?.test) {
        const t = res.data.test;
        setTestForm({
          title: t.title || "",
          testType: t.testType || "Aptitude",
          durationMinutes: t.duration_minutes || t.durationMinutes || 30,
          maxAttempts: t.maxAttempts || 1
        });
        if (res.data.setting) {
          setSettingsForm(prev => ({
            ...prev,
            tabSwitchLimit: res.data.setting.tabSwitchLimit ?? 3,
            proctoringEnabled: res.data.setting.proctoringEnabled ?? true,
            autoSubmit: res.data.setting.autoSubmit ?? true
          }));
        }
        if (res.data.target) {
          setSettingsForm(prev => ({
            ...prev,
            targetType: res.data.target.targetType || "All",
            selectedDepartments: res.data.target.departments || []
          }));
        }
        if (res.data.schedule) {
          setScheduleForm({
            startAt: formatForDateTimeLocal(res.data.schedule.startAt),
            endAt: formatForDateTimeLocal(res.data.schedule.endAt)
          });
        }
      }
    } catch (err) {
      console.error("Failed to load existing test data", err);
    }
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // STEP 1 HANDLER: Create Test Initial Record
  // -------------------------------------------------------------
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!testForm.title.trim()) {
      toast.warning("Please enter an exam title");
      return;
    }
    setLoading(true);
    try {
      if (!createdTestId) {
        // Create new test API
        const res = await api.post("/test-management/create", {
          title: testForm.title,
          testType: testForm.testType,
          durationMinutes: Number(testForm.durationMinutes),
          maxAttempts: Number(testForm.maxAttempts)
        });
        const tId = res.data?.test?._id || res.data?.test?.id;
        if (tId) {
          setCreatedTestId(tId);
          toast.success("Exam draft created successfully!");
          setCurrentStep(2);
        } else {
          toast.error("Could not retrieve created test ID");
        }
      } else {
        // Moving forward with existing test ID
        setCurrentStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create test draft");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2 HANDLER: Update Test Settings & Department Scope
  // -------------------------------------------------------------
  const handleToggleDepartment = (dept) => {
    setSettingsForm(prev => {
      const exists = prev.selectedDepartments.includes(dept);
      if (exists) {
        return { ...prev, selectedDepartments: prev.selectedDepartments.filter(d => d !== dept) };
      } else {
        return { ...prev, selectedDepartments: [...prev.selectedDepartments, dept] };
      }
    });
  };

  const handleAddCustomDept = (e) => {
    e.preventDefault();
    const val = settingsForm.customDeptInput.trim();
    if (val && !settingsForm.selectedDepartments.includes(val)) {
      setSettingsForm(prev => ({
        ...prev,
        selectedDepartments: [...prev.selectedDepartments, val],
        customDeptInput: ""
      }));
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!createdTestId) {
      toast.error("Test ID missing. Please return to Step 1.");
      return;
    }
    if (settingsForm.targetType === "Department" && settingsForm.selectedDepartments.length === 0) {
      toast.warning("Please select at least one department or switch to All Departments");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Proctoring & Evaluation Settings
      await api.put(`/test-management/${createdTestId}/settings`, {
        tabSwitchLimit: Number(settingsForm.tabSwitchLimit),
        proctoringEnabled: settingsForm.proctoringEnabled,
        autoSubmit: settingsForm.autoSubmit
      });

      // 2. Update Target Group (All Departments vs Selected Departments)
      await api.put(`/test-management/${createdTestId}/target`, {
        targetType: settingsForm.targetType,
        departments: settingsForm.targetType === "Department" ? settingsForm.selectedDepartments : [],
        batches: [],
        studentRollNumbers: []
      });

      toast.success("Settings & Department Scope saved!");
      setCurrentStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update test settings");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3 HANDLER: Questions (JSON Question Bank Upload + Manual)
  // -------------------------------------------------------------
  const handleJsonFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a valid .json file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        let items = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          items = parsed.questions;
        } else {
          toast.error("Invalid JSON structure: Expected an array of questions or { questions: [] }");
          return;
        }

        // Normalize JSON structure
        const normalized = items.map((q, idx) => {
          const rawOptions = q.options || q.choices || [];
          const formattedOptions = rawOptions.map(opt => {
            if (typeof opt === "string") return { text: opt };
            if (typeof opt === "object" && opt.text) return { text: opt.text };
            return { text: String(opt) };
          });

          let correctIdx = 0;
          if (typeof q.correct_answer === "number") correctIdx = q.correct_answer;
          else if (typeof q.correctAnswer === "number") correctIdx = q.correctAnswer;
          else if (typeof q.correct_answer_index === "number") correctIdx = q.correct_answer_index;
          else if (typeof q.correct_option === "number") correctIdx = q.correct_option;

          return {
            id: `json_${Date.now()}_${idx}`,
            question_text: q.question_text || q.questionText || q.question || `Question ${idx + 1}`,
            topicName: q.topicName || q.topic_name || q.topic || "General",
            options: formattedOptions.length >= 2 ? formattedOptions : [{ text: "Option A" }, { text: "Option B" }],
            correct_answer: correctIdx,
            marks: Number(q.marks) || 1
          };
        });

        setQuestionsList(prev => [...prev, ...normalized]);
        toast.success(`Successfully imported ${normalized.length} questions from JSON bank!`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse JSON file. Check format syntax.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!manualQuestion.question_text.trim()) {
      toast.warning("Please enter question text");
      return;
    }
    const newQ = {
      id: `manual_${Date.now()}`,
      question_text: manualQuestion.question_text,
      topicName: manualQuestion.topicName || "General",
      options: manualQuestion.options.map(t => ({ text: t })),
      correct_answer: Number(manualQuestion.correct_answer),
      marks: Number(manualQuestion.marks)
    };
    setQuestionsList(prev => [...prev, newQ]);
    setManualQuestion({
      question_text: "",
      topicName: "General",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correct_answer: 0,
      marks: 1
    });
    toast.success("Question added to list");
  };

  const handleRemoveQuestion = (id) => {
    setQuestionsList(prev => prev.filter(q => q.id !== id));
  };

  const handleDownloadSampleJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SAMPLE_JSON_BANK, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "sample_question_bank.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!createdTestId) {
      toast.error("Test ID missing. Please return to Step 1.");
      return;
    }
    if (questionsList.length === 0) {
      toast.warning("Please add or upload at least 1 question to proceed");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const q of questionsList) {
        await api.post(`/exams/${createdTestId}/questions`, {
          question_text: q.question_text,
          topicName: q.topicName,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks
        });
        successCount++;
      }
      toast.success(`Saved ${successCount} questions to the test!`);
      setCurrentStep(4);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || `Saved ${successCount}/${questionsList.length} questions before error occurred`);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 4 HANDLER: Schedule & Publish Test
  // -------------------------------------------------------------
  const handleStep4Submit = async (e) => {
    e.preventDefault();
    if (!createdTestId) return;
    if (!scheduleForm.startAt || !scheduleForm.endAt) {
      toast.warning("Please select both start and end timestamps");
      return;
    }

    const startTime = new Date(scheduleForm.startAt);
    const endTime = new Date(scheduleForm.endAt);

    if (endTime <= startTime) {
      toast.warning("End timestamp must be later than start timestamp");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/test-management/${createdTestId}/schedule`, {
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString()
      });

      const totalMarksSum = questionsList.reduce((acc, q) => acc + (q.marks || 1), 0);

      setPublishedSummary({
        id: createdTestId,
        title: testForm.title,
        testType: testForm.testType,
        durationMinutes: testForm.durationMinutes,
        questionsCount: questionsList.length,
        totalMarks: totalMarksSum,
        targetType: settingsForm.targetType,
        departments: settingsForm.selectedDepartments,
        startAt: scheduleForm.startAt,
        endAt: scheduleForm.endAt
      });

      toast.success(res.data.message || "TEST PUBLISHED SUCCESSFULLY!");
      setCurrentStep(5);
      if (onTestPublished) onTestPublished();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule and publish test");
    } finally {
      setLoading(false);
    }
  };

  const totalCalculatedMarks = questionsList.reduce((acc, q) => acc + Number(q.marks || 1), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header & Progress Stepper */}
        <div className="bg-slate-900 text-white p-6 shrink-0 relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/30">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>
                  Assessment Setup & Provisioning Pipeline
                </h3>
                <p className="text-xs text-slate-400">Step {currentStep} of 5 — {
                  currentStep === 1 ? "Create Test Details" :
                  currentStep === 2 ? "Test Settings & Scope" :
                  currentStep === 3 ? "Import/Create Questions" :
                  currentStep === 4 ? "Schedule Timestamps" : "TEST PUBLISHED"
                }</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className={`flex flex-col gap-1 ${currentStep >= 1 ? "text-red-400 font-bold" : "text-slate-500"}`}>
              <div className={`h-1.5 rounded-full ${currentStep >= 1 ? "bg-red-500" : "bg-slate-800"}`} />
              <span>1. Test</span>
            </div>
            <div className={`flex flex-col gap-1 ${currentStep >= 2 ? "text-red-400 font-bold" : "text-slate-500"}`}>
              <div className={`h-1.5 rounded-full ${currentStep >= 2 ? "bg-red-500" : "bg-slate-800"}`} />
              <span>2. Settings</span>
            </div>
            <div className={`flex flex-col gap-1 ${currentStep >= 3 ? "text-red-400 font-bold" : "text-slate-500"}`}>
              <div className={`h-1.5 rounded-full ${currentStep >= 3 ? "bg-red-500" : "bg-slate-800"}`} />
              <span>3. Questions</span>
            </div>
            <div className={`flex flex-col gap-1 ${currentStep >= 4 ? "text-red-400 font-bold" : "text-slate-500"}`}>
              <div className={`h-1.5 rounded-full ${currentStep >= 4 ? "bg-red-500" : "bg-slate-800"}`} />
              <span>4. Schedule</span>
            </div>
            <div className={`flex flex-col gap-1 ${currentStep >= 5 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
              <div className={`h-1.5 rounded-full ${currentStep >= 5 ? "bg-emerald-500" : "bg-slate-800"}`} />
              <span>5. Publish</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800">
          
          {/* STEP 1: CREATE TEST */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <FileText className="text-red-700 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-slate-600">
                  Enter the primary details for your assessment. A draft record will be created in the system to hold questions and settings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms End-Semester Assessment"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category / Type
                  </label>
                  <select
                    value={testForm.testType}
                    onChange={(e) => setTestForm({ ...testForm, testType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Technical">Technical</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Verbal">Verbal</option>
                    <option value="Coding">Coding</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Exam">Exam</option>
                    <option value="Practice">Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={testForm.durationMinutes}
                    onChange={(e) => setTestForm({ ...testForm, durationMinutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none text-sm font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={testForm.maxAttempts}
                    onChange={(e) => setTestForm({ ...testForm, maxAttempts: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none text-sm font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-95 transition-opacity shadow-md text-sm cursor-pointer"
                  style={{ background: BRAND }}
                >
                  <span>{loading ? "Creating..." : "Next: Test Settings"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: TEST SETTINGS & DEPARTMENT TARGETING */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              
              {/* Proctoring Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY }}>
                      <Settings size={18} className="text-red-600" />
                      Proctoring & Security Policy Rules
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure automated violation triggers, full-screen locks, and tab-switch allowances.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    Security Policy
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tab Switch Limit Control */}
                  <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Max Tab Switches
                        </label>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {settingsForm.tabSwitchLimit} Max
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Maximum allowed browser tab switch events before auto-submitting.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setSettingsForm(prev => ({ ...prev, tabSwitchLimit: Math.max(0, Number(prev.tabSwitchLimit) - 1) }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.tabSwitchLimit}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tabSwitchLimit: Math.max(0, Number(e.target.value)) })}
                        className="w-full text-center text-sm font-bold text-slate-800 bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setSettingsForm(prev => ({ ...prev, tabSwitchLimit: Number(prev.tabSwitchLimit) + 1 }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Strict Proctoring Toggle Card */}
                  <div
                    onClick={() => setSettingsForm(prev => ({ ...prev, proctoringEnabled: !prev.proctoringEnabled }))}
                    className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      settingsForm.proctoringEnabled
                        ? "bg-red-50/40 border-red-200/80 ring-2 ring-red-500/10"
                        : "bg-slate-50/80 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Strict Proctoring
                        </span>
                        {/* Custom Modern Toggle Switch */}
                        <div
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                            settingsForm.proctoringEnabled ? "bg-red-600 justify-end" : "bg-slate-300 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Enforces fullscreen mode, blocks window blur & copy-paste actions.
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider self-start px-2 py-0.5 rounded-full mt-3 ${
                      settingsForm.proctoringEnabled ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                    }`}>
                      {settingsForm.proctoringEnabled ? "Active Policy" : "Disabled"}
                    </span>
                  </div>

                  {/* Auto-Submit On Violation Toggle Card */}
                  <div
                    onClick={() => setSettingsForm(prev => ({ ...prev, autoSubmit: !prev.autoSubmit }))}
                    className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      settingsForm.autoSubmit
                        ? "bg-amber-50/40 border-amber-200/80 ring-2 ring-amber-500/10"
                        : "bg-slate-50/80 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Auto-Submit Exam
                        </span>
                        {/* Custom Modern Toggle Switch */}
                        <div
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                            settingsForm.autoSubmit ? "bg-amber-600 justify-end" : "bg-slate-300 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Automatically lock and disqualify attempt when violations limit is breached.
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider self-start px-2 py-0.5 rounded-full mt-3 ${
                      settingsForm.autoSubmit ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {settingsForm.autoSubmit ? "Auto Lock On" : "Manual Lock"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department Target Flowchart Branch */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY }}>
                  <Building2 size={18} className="text-indigo-600" />
                  Target Department Selection
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  According to workflow requirements, choose whether this test is open to all departments or restricted to selected departments.
                </p>

                {/* Flowchart Choice Radio Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, targetType: "All" })}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      settingsForm.targetType === "All"
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${settingsForm.targetType === "All" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Globe size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">All Departments</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Accessible to all registered students across every branch.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, targetType: "Department" })}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      settingsForm.targetType === "Department"
                        ? "border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${settingsForm.targetType === "Department" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">Selected Departments</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Restricted only to specific chosen academic departments.</p>
                    </div>
                  </button>
                </div>

                {/* Selected Departments Multi-Select Area */}
                {settingsForm.targetType === "Department" && (
                  <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900">
                      Select Eligible Departments ({settingsForm.selectedDepartments.length} Selected)
                    </label>

                    {/* Presets Badges */}
                    <div className="flex flex-wrap gap-2">
                      {PRESET_DEPARTMENTS.map((dept) => {
                        const selected = settingsForm.selectedDepartments.includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => handleToggleDepartment(dept)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              selected
                                ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-amber-400"
                            }`}
                          >
                            {selected ? "✓ " : "+ "}{dept}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Dept Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add custom department name..."
                        value={settingsForm.customDeptInput}
                        onChange={(e) => setSettingsForm({ ...settingsForm, customDeptInput: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomDept}
                        className="px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-xl"
                      >
                        Add Dept
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-95 transition-opacity shadow-md text-sm cursor-pointer"
                  style={{ background: BRAND }}
                >
                  <span>{loading ? "Saving..." : "Next: Create Questions"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CREATE QUESTIONS (JSON BANK UPLOAD + MANUAL) */}
          {currentStep === 3 && (
            <div className="space-y-5">
              
              {/* Question Mode Switcher */}
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setQuestionMode("json")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    questionMode === "json"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload size={16} />
                  Upload Question Bank (JSON File)
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    questionMode === "manual"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Plus size={16} />
                  Manual Question Form
                </button>
              </div>

              {/* JSON FILE UPLOAD TAB */}
              {questionMode === "json" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-red-200 bg-red-50/20 hover:bg-red-50/40 transition-colors rounded-2xl p-6 text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileCode size={36} className="mx-auto text-red-600 mb-2" />
                    <h5 className="text-sm font-bold text-slate-900">
                      Upload Question Bank (.json)
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag & drop your JSON question file here or click to browse
                    </p>
                  </div>

                  {/* Download Sample JSON button */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                      <Sparkles size={14} className="text-amber-500" />
                      Need a sample JSON schema format?
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadSampleJSON}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                    >
                      <Download size={14} /> Download Sample JSON
                    </button>
                  </div>
                </div>
              )}

              {/* MANUAL QUESTION FORM TAB */}
              {questionMode === "manual" && (
                <form onSubmit={handleAddManualQuestion} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      rows="2"
                      required
                      placeholder="Enter the question prompt..."
                      value={manualQuestion.question_text}
                      onChange={(e) => setManualQuestion({ ...manualQuestion, question_text: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Options & Radio Selector for Correct Answer
                    </label>
                    {manualQuestion.options.map((optText, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="manualCorrectAnswer"
                          checked={manualQuestion.correct_answer === idx}
                          onChange={() => setManualQuestion({ ...manualQuestion, correct_answer: idx })}
                          className="w-4 h-4 text-red-600"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          value={optText}
                          onChange={(e) => {
                            const updated = [...manualQuestion.options];
                            updated[idx] = e.target.value;
                            setManualQuestion({ ...manualQuestion, options: updated });
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Marks:</span>
                      <input
                        type="number"
                        min="1"
                        value={manualQuestion.marks}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, marks: e.target.value })}
                        className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                    >
                      + Add Question to Bank
                    </button>
                  </div>
                </form>
              )}

              {/* PARSED / POPULATED QUESTIONS PREVIEW */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle size={16} className="text-red-400" />
                    Question Bank ({questionsList.length} Questions)
                  </span>
                  <span className="text-xs font-extrabold bg-red-600 px-2.5 py-0.5 rounded-full">
                    Total Marks: {totalCalculatedMarks}
                  </span>
                </div>

                {questionsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                    No questions added yet. Upload a JSON file above or add questions manually.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto p-2">
                    {questionsList.map((q, index) => (
                      <div key={q.id || index} className="p-3 hover:bg-slate-50 rounded-xl flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              Q{index + 1}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {q.marks || 1} {q.marks === 1 ? "Mark" : "Marks"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{q.question_text}</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 mt-1.5">
                            {q.options?.map((opt, oIdx) => (
                              <span key={oIdx} className={oIdx === q.correct_answer ? "text-emerald-700 font-semibold" : ""}>
                                {oIdx === q.correct_answer ? "✓ " : "• "}{opt.text}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  type="button"
                  onClick={handleStep3Submit}
                  disabled={loading}
                  className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-95 transition-opacity shadow-md text-sm cursor-pointer"
                  style={{ background: BRAND }}
                >
                  <span>{loading ? "Saving Questions..." : "Next: Schedule Test"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE TEST */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <Calendar className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Schedule Assessment Window</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set the exact start and end timestamps. Submitting this form will transition the test status to <strong className="text-emerald-700">Published</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.startAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.endAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Pre-Publishing Summary Verification Card */}
              <div className="bg-gradient-to-r from-slate-900 to-red-950 text-white rounded-2xl p-5 shadow-inner">
                <h5 className="text-xs font-bold uppercase tracking-widest text-red-300 mb-3">
                  Pre-Publishing Verification Checklist
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Title</span>
                    <strong className="truncate block">{testForm.title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Scope</span>
                    <strong>{settingsForm.targetType === "All" ? "All Depts" : `${settingsForm.selectedDepartments.length} Depts`}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Questions</span>
                    <strong>{questionsList.length} Items</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Marks</span>
                    <strong>{totalCalculatedMarks} Marks</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 text-white font-bold px-7 py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] text-sm cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 size={18} />
                  <span>{loading ? "Publishing Test..." : "Schedule & Publish Test"}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: TEST PUBLISHED SUCCESS BANNER */}
          {currentStep === 5 && publishedSummary && (
            <div className="text-center py-6 space-y-6">
              
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                <CheckCircle2 size={44} />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  Status: Published
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-2" style={{ fontFamily: FONT_DISPLAY }}>
                  TEST PUBLISHED!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Your assessment has been scheduled and published according to your specified workflow settings. Eligible students can now view and access this test.
                </p>
              </div>

              {/* Published Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-lg mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Exam Title:</span>
                  <strong className="text-slate-900">{publishedSummary.title}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Category:</span>
                  <strong className="text-slate-900">{publishedSummary.testType} ({publishedSummary.durationMinutes} mins)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Target Scope:</span>
                  <strong className="text-slate-900">
                    {publishedSummary.targetType === "All" ? "All Departments" : publishedSummary.departments.join(", ")}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Questions & Marks:</span>
                  <strong className="text-slate-900">{publishedSummary.questionsCount} Questions ({publishedSummary.totalMarks} Total Marks)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Period:</span>
                  <strong className="text-slate-900">
                    {new Date(publishedSummary.startAt).toLocaleString()} to {new Date(publishedSummary.endAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedTestId("");
                    setQuestionsList([]);
                    setTestForm({ title: "", testType: "Aptitude", durationMinutes: 30, maxAttempts: 1 });
                    setCurrentStep(1);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Create Another Exam
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md"
                  style={{ background: BRAND }}
                >
                  Done & Return to Dashboard
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
