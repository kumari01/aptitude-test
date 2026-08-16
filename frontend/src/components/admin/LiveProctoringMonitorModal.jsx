import React, { useState, useEffect } from "react";
import { X, ShieldAlert, AlertTriangle, User, RefreshCw, StopCircle, Clock, CheckCircle2 } from "lucide-react";
import { BRAND, INK, FONT_DISPLAY } from "../../constants/theme";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function LiveProctoringMonitorModal({ isOpen, onClose, testId, testTitle }) {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (isOpen && testId) {
      fetchLiveSessions();
      const interval = setInterval(fetchLiveSessions, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, testId]);

  const fetchLiveSessions = async () => {
    try {
      setRefreshing(true);
      const res = await api.get(`/proctoring/sessions/live/${testId}`);
      if (res.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.warn("Could not fetch live proctoring sessions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleForceTerminate = async (sessionId, studentName) => {
    if (!window.confirm(`Are you sure you want to terminate & disqualify ${studentName}'s attempt?`)) {
      return;
    }
    try {
      const res = await api.post("/proctoring/sessions/admin/terminate", {
        sessionId,
        reason: "Terminated manually by Administrator",
      });
      toast.success(res.data?.message || `Terminated attempt for ${studentName}`);
      fetchLiveSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate session");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: FONT_DISPLAY }}>
                Live Proctoring Command Center
              </h2>
              <p className="text-xs text-gray-500">
                Monitoring active sessions for: <span className="font-semibold text-gray-700">{testTitle || testId}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLiveSessions}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              title="Refresh Sessions"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-gray-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={28} />
              <p className="text-sm font-medium">Connecting to live proctoring stream...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center bg-gray-50 rounded-xl border border-gray-200">
              <ShieldAlert size={40} className="mx-auto mb-3 text-gray-300" />
              <h3 className="font-bold text-gray-800 text-base" style={{ fontFamily: FONT_DISPLAY }}>
                No active student sessions
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No students are currently taking this exam or proctoring tracking is quiet.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_300px] gap-6">
              {/* Sessions Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-gray-400 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">STUDENT</th>
                      <th className="px-4 py-3">TAB SWITCHES</th>
                      <th className="px-4 py-3">RISK SCORE</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((s) => (
                      <tr
                        key={s.sessionId}
                        onClick={() => setSelectedSession(s)}
                        className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${
                          selectedSession?.sessionId === s.sessionId ? "bg-indigo-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            {s.studentName}
                          </div>
                          <div className="text-xs text-gray-400 ml-5.5">{s.rollNumber}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              s.tabSwitchCount >= 3 ? "bg-red-100 text-red-700 font-bold" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {s.tabSwitchCount} switches
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.riskScore > 60
                                    ? "bg-red-500"
                                    : s.riskScore > 30
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, s.riskScore)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{s.riskScore}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              s.status === "TERMINATED"
                                ? "bg-red-100 text-red-700"
                                : s.status === "FLAGGED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.status !== "TERMINATED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleForceTerminate(s.sessionId, s.studentName);
                              }}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 underline flex items-center gap-1 ml-auto"
                            >
                              <StopCircle size={13} /> Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selected Session Details & Events */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3" style={{ fontFamily: FONT_DISPLAY }}>
                    Session Event Stream
                  </h4>
                  {selectedSession ? (
                    <div>
                      <div className="mb-3 text-xs bg-white p-3 rounded-lg border border-gray-200">
                        <div className="font-bold text-gray-800">{selectedSession.studentName}</div>
                        <div className="text-gray-500">Roll: {selectedSession.rollNumber}</div>
                        <div className="text-gray-500 mt-1">Status: <span className="font-semibold text-indigo-600">{selectedSession.attemptStatus || selectedSession.status}</span></div>
                      </div>

                      <div className="text-xs font-semibold text-gray-500 mb-2">Recent Proctoring Events:</div>
                      {selectedSession.events && selectedSession.events.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedSession.events.map((ev, i) => (
                            <div key={i} className="p-2 rounded bg-white border border-gray-200 text-xs flex items-start justify-between">
                              <div>
                                <span className="font-bold text-red-600 block">{ev.eventType}</span>
                                <span className="text-[10px] text-gray-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-700 font-semibold">{ev.severity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No proctoring violations recorded for this session.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-6 text-center italic">
                      Click on any student row to view live event logs.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>Auto-refreshing live proctoring stream every 5 seconds</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
}
