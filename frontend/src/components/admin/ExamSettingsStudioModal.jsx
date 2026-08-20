import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldCheck, 
  Settings, 
  Building2, 
  Calendar, 
  Clock, 
  Check, 
  AlertTriangle, 
  Lock, 
  Sparkles, 
  Layers, 
  Save, 
  CheckCircle2, 
  Sliders, 
  RefreshCw,
  Eye,
  Plus
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

const formatForDateTimeLocal = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ExamSettingsStudioModal({
  isOpen,
  onClose,
  testData,
  onSaved,
  initialTab = "proctoring"
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Unified Form State
  const [form, setForm] = useState({
    title: "",
    category: "Aptitude",
    durationMinutes: 30,
    maxAttempts: 1,
    status: "Draft",
    // Proctoring
    proctoringEnabled: true,
    tabSwitchLimit: 3,
    autoSubmit: true,
    // Targeting
    targetType: "All",
    departments: [],
    customDeptInput: "",
    // Schedule
    startAt: formatForDateTimeLocal(new Date(Date.now() + 300000)),
    endAt: formatForDateTimeLocal(new Date(Date.now() + 86400000))
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Load existing test details when modal opens
  useEffect(() => {
    if (!isOpen || !testData?.id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/test-management/${testData.id}`);
        if (res.data?.test) {
          const t = res.data.test;
          const s = res.data.setting;
          const tg = res.data.target;
          const sc = res.data.schedule;

          setForm({
            title: t.title || testData.title || "",
            category: t.category || t.testType || testData.category || "Aptitude",
            durationMinutes: t.durationMinutes || t.duration_minutes || testData.durationMinutes || 30,
            maxAttempts: t.maxAttempts || testData.maxAttempts || 1,
            status: t.status || testData.status || "Draft",
            // Proctoring
            proctoringEnabled: s?.proctoringEnabled ?? testData.setting?.proctoringEnabled ?? true,
            tabSwitchLimit: s?.tabSwitchLimit ?? testData.setting?.tabSwitchLimit ?? 3,
            autoSubmit: s?.autoSubmit ?? testData.setting?.autoSubmit ?? true,
            // Targeting
            targetType: tg?.targetType || "All",
            departments: tg?.departments || [],
            customDeptInput: "",
            // Schedule
            startAt: sc?.startAt ? formatForDateTimeLocal(sc.startAt) : (testData.schedule?.startAt ? formatForDateTimeLocal(testData.schedule.startAt) : formatForDateTimeLocal(new Date())),
            endAt: sc?.endAt ? formatForDateTimeLocal(sc.endAt) : (testData.schedule?.endAt ? formatForDateTimeLocal(testData.schedule.endAt) : formatForDateTimeLocal(new Date(Date.now() + 86400000)))
          });
        }
      } catch (err) {
        console.error("Failed to load exam settings details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, testData?.id]);

  if (!isOpen || !testData) return null;

  const handleToggleDepartment = (dept) => {
    setForm(prev => {
      const exists = prev.departments.includes(dept);
      return {
        ...prev,
        departments: exists
          ? prev.departments.filter(d => d !== dept)
          : [...prev.departments, dept]
      };
    });
  };

  const handleAddCustomDepartment = () => {
    if (!form.customDeptInput.trim()) return;
    const clean = form.customDeptInput.trim();
    if (!form.departments.includes(clean)) {
      setForm(prev => ({
        ...prev,
        departments: [...prev.departments, clean],
        customDeptInput: ""
      }));
    } else {
      setForm(prev => ({ ...prev, customDeptInput: "" }));
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        title: form.title,
        category: form.category,
        testType: form.category,
        durationMinutes: Number(form.durationMinutes) || 30,
        maxAttempts: Number(form.maxAttempts) || 1,
        status: form.status,
        proctoringEnabled: form.proctoringEnabled,
        tabSwitchLimit: Number(form.tabSwitchLimit) || 3,
        autoSubmit: form.autoSubmit,
        targetType: form.targetType,
        departments: form.targetType === "All" ? [] : form.departments,
        startAt: form.startAt,
        endAt: form.endAt
      };

      await api.put(`/test-management/${testData.id}/full-update`, payload);
      toast.success("Exam configuration & security settings saved successfully!");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to update test configuration:", err);
      toast.error(err.response?.data?.message || "Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
              <Sliders size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate" style={{ fontFamily: FONT_DISPLAY }}>
                  {form.title || testData.title || "Exam Configuration Studio"}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  form.status === "Published" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {form.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Configure enterprise policies, audience targeting, timing & proctoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("proctoring")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "proctoring"
                ? "border-amber-600 text-amber-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={16} className={activeTab === "proctoring" ? "text-amber-600" : "text-slate-400"} />
            <span>Anti-Cheat & Proctoring</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("examRules")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "examRules"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings size={16} className={activeTab === "examRules" ? "text-indigo-600" : "text-slate-400"} />
            <span>General Rules & Scoring</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("targeting")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "targeting"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 size={16} className={activeTab === "targeting" ? "text-emerald-600" : "text-slate-400"} />
            <span>Department Targeting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "schedule"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar size={16} className={activeTab === "schedule" ? "text-blue-600" : "text-slate-400"} />
            <span>Schedule & Lifecycle</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw className="animate-spin mb-3" size={28} />
              <p className="text-sm font-medium">Loading configuration properties...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROCTORING */}
              {activeTab === "proctoring" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-3">
                    <ShieldCheck size={22} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-1">
                      <p className="font-bold text-sm text-amber-950">Enterprise Integrity Policy</p>
                      <p>Active proctoring tracks tab switches, browser blurs, fullscreen exit attempts, and devtools access in real time.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-900">Strict Anti-Cheat Proctoring</div>
                        <div className="text-xs text-slate-500">Enforce browser fullscreen locking, blur detection, and violation logging</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.proctoringEnabled}
                          onChange={(e) => setForm({ ...form, proctoringEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {/* Tab Switch Limit */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">Max Tab Switch Limit</div>
                          <div className="text-xs text-slate-500">Number of allowed window/tab departures before auto-disqualification</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={form.tabSwitchLimit}
                            onChange={(e) => setForm({ ...form, tabSwitchLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-16 px-3 py-1.5 border border-slate-300 rounded-xl text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-xs font-semibold text-slate-500">Switches</span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setForm({ ...form, tabSwitchLimit: num })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              form.tabSwitchLimit === num
                                ? "bg-amber-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {num} {num === 1 ? "Switch" : "Switches"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Submit */}
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-900">Auto-Submit on Disqualification</div>
                        <div className="text-xs text-slate-500">Instantly locks and submits candidate's response when limits are breached</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.autoSubmit}
                          onChange={(e) => setForm({ ...form, autoSubmit: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Security Feature Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700">Fullscreen Lock</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700">Copy/Paste Block</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700">Live Telemetry</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXAM RULES & SCORING */}
              {activeTab === "examRules" && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Exam Assessment Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Week 4 - Advanced Quantitative & Logical Aptitude"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Domain Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Aptitude">Aptitude & Quantitative</option>
                        <option value="Logical Reasoning">Logical Reasoning</option>
                        <option value="Technical Assessment">Technical & CS Fundamentals</option>
                        <option value="Coding Assessment">Coding Assessment</option>
                        <option value="Verbal Ability">Verbal & Communication</option>
                        <option value="General Knowledge">General Knowledge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Duration (Minutes) *
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 30 })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Duration Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Quick Presets:</span>
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setForm({ ...form, durationMinutes: mins })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          form.durationMinutes === mins
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {mins} Mins
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Max Allowed Attempts
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={form.maxAttempts}
                          onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })}
                          className="w-20 px-3 py-2 border border-slate-300 rounded-xl text-center font-bold text-slate-900 text-sm"
                        />
                        <span className="text-xs text-slate-500 font-medium">Attempt(s) per student</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center">
                      <div className="text-xs font-bold text-slate-700">Passing Criteria</div>
                      <div className="text-xs text-slate-500 mt-0.5">Automatic pass benchmark set at 40% of total exam score</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TARGETING */}
              {activeTab === "targeting" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, targetType: "All" })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        form.targetType === "All"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900">All Students</div>
                      <div className="text-xs text-slate-500 mt-1">Available to every registered student across all branches</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, targetType: "Department" })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        form.targetType === "Department"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900">Target Specific Departments</div>
                      <div className="text-xs text-slate-500 mt-1">Restricted only to students belonging to chosen departments</div>
                    </button>
                  </div>

                  {form.targetType === "Department" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div>
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                          Select Allowed Departments ({form.departments.length} Selected)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_DEPARTMENTS.map((dept) => {
                            const selected = form.departments.includes(dept);
                            return (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => handleToggleDepartment(dept)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  selected
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                                }`}
                              >
                                {selected && <Check size={13} />}
                                {dept}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Department Adder */}
                      <div className="pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Add Custom Department Branch
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={form.customDeptInput}
                            onChange={(e) => setForm({ ...form, customDeptInput: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomDepartment();
                              }
                            }}
                            placeholder="e.g. Artificial Intelligence & ML"
                            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomDepartment}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SCHEDULE & LIFECYCLE */}
              {activeTab === "schedule" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Status Toggle Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">Publishing Status</div>
                      <div className="text-xs text-slate-500">
                        {form.status === "Published" ? "Assessment is active and accessible during schedule window" : "Assessment is saved as draft and hidden from candidates"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, status: "Draft" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          form.status === "Draft"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, status: "Published" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          form.status === "Published"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Published
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Schedule Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={form.startAt}
                        onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Schedule End Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={form.endAt}
                        onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
                    <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Access Window Guard</p>
                      <p className="mt-0.5">Students can only start or resume this exam when current server time falls between the scheduled start and end timestamps.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            {form.title ? <span className="font-semibold text-slate-700">{form.title}</span> : "Ready to update"}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ background: BRAND }}
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={15} /> Saving...
                </>
              ) : (
                <>
                  <Save size={15} /> Save & Apply Changes
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
