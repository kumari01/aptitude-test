import React from "react";
import { 
  UserCheck, 
  PlusCircle, 
  Settings, 
  Globe, 
  Building2, 
  FileCode, 
  Calendar, 
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react";
import { BRAND, FONT_DISPLAY } from "../../constants/theme";

export default function AdminWorkflowVisualizer({ onStartWorkflow, currentStep = null }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-stone-900 to-red-950 text-white rounded-2xl p-6 shadow-xl mb-8 border border-white/10 overflow-hidden relative">
      {/* Background Glow Overlay */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              Admin Standard Operating Workflow
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>
            Assessment Creation Lifecycle
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Create exams, set proctoring & department rules, import JSON question banks, schedule timestamps, and publish tests.
          </p>
        </div>

        <button
          onClick={onStartWorkflow}
          className="flex items-center justify-center gap-2 font-semibold text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-red-900/40 hover:scale-[1.02] transition-all shrink-0 cursor-pointer text-sm"
          style={{ background: BRAND }}
        >
          <Play size={16} className="fill-white" />
          <span>Launch Assessment Pipeline</span>
        </button>
      </div>

      {/* Visual Flowchart Diagram */}
      <div className="relative z-10 overflow-x-auto py-2">
        <div className="min-w-[820px] flex items-center justify-between gap-2">
          
          {/* Admin Start Node */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner mb-2">
              <UserCheck size={20} />
            </div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">ADMIN</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 1: Create Test */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              currentStep === 1 
                ? "bg-red-600 text-white border-red-400 ring-4 ring-red-500/30" 
                : "bg-slate-800/90 text-slate-200 border-slate-700"
            }`}>
              <PlusCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">1. Create Test</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 2: Test Settings */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              currentStep === 2 
                ? "bg-red-600 text-white border-red-400 ring-4 ring-red-500/30" 
                : "bg-slate-800/90 text-slate-200 border-slate-700"
            }`}>
              <Settings size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">2. Test Settings</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 3: Department Branch (All vs Selected) */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2 flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-md">
                <Globe size={12} />
                <span>All Depts</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">OR</span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-md">
                <Building2 size={12} />
                <span>Selected Depts</span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1">Target Scope</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 4: Create Questions (JSON Bank Upload) */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              currentStep === 3 
                ? "bg-red-600 text-white border-red-400 ring-4 ring-red-500/30" 
                : "bg-slate-800/90 text-slate-200 border-slate-700"
            }`}>
              <FileCode size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">3. Create Questions</span>
            <span className="text-[10px] text-emerald-400 font-medium">(JSON Bank Upload)</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 5: Schedule Test */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              currentStep === 4 
                ? "bg-red-600 text-white border-red-400 ring-4 ring-red-500/30" 
                : "bg-slate-800/90 text-slate-200 border-slate-700"
            }`}>
              <Calendar size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">4. Schedule Test</span>
          </div>

          <ArrowRight size={16} className="text-slate-600 shrink-0" />

          {/* Step 6: Test Published */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white border border-emerald-400 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400 mt-1.5 uppercase tracking-wider">TEST PUBLISHED</span>
          </div>

        </div>
      </div>
    </div>
  );
}
