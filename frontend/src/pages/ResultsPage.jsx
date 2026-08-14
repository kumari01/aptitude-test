import React, { useState, useEffect } from "react";
import { Search, Clock, Calendar, CheckCircle2, TrendingUp, Trophy, AlertCircle } from "lucide-react";
import StatCard from "../components/common/StatCard";
import StatusPill from "../components/common/StatusPill";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import axios from "axios";

export function ResultsPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [resultsList, setResultsList] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    passed: 0,
    avgScore: "0%",
    best: "0%",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get("http://localhost:3000/api/auth/student/progress", {
          withCredentials: true,
          headers,
        });

        if (res.data) {
          const attempts = res.data.recentAttempts || [];
          const passedCount = attempts.filter((a) => a.status === "Passed").length;

          setStats({
            totalAttempts: res.data.examsCompleted || attempts.length,
            passed: passedCount,
            avgScore: res.data.avgScore || "0%",
            best: res.data.bestScore || "0%",
          });

          const formatted = attempts.map((a, idx) => ({
            id: a.id || idx,
            title: a.title,
            category: "Exam Attempt",
            detail: a.marks,
            date: a.date,
            score: a.score,
            fraction: a.marks,
            time: "Completed",
            status: a.status,
          }));

          setResultsList(formatted);
        }
      } catch (err) {
        console.warn("Error fetching student results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const rows = resultsList.filter((r) => {
    if (filter !== "All" && r.status !== filter) return false;
    if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Results
      </h1>
      <p className="text-gray-500 mt-1 mb-6">Your examination history and performance</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Attempts"
          value={stats.totalAttempts}
          icon={<Calendar size={17} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
        <StatCard
          label="Passed"
          value={stats.passed}
          icon={<CheckCircle2 size={17} />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          label="Average Score"
          value={stats.avgScore}
          icon={<TrendingUp size={17} />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Best Score"
          value={stats.best}
          icon={<Trophy size={17} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search results..."
            className="w-full outline-none text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {["All", "Passed", "Failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? "text-white" : "text-gray-500 hover:text-gray-900"
              }`}
              style={filter === f ? { background: INK } : {}}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading results...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <AlertCircle size={24} />
            </div>
            <h4 className="font-bold text-gray-800 mb-1">No Results Found</h4>
            <p className="text-xs text-gray-500">You haven't completed any exam attempts yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs tracking-wide border-b border-gray-100">
                <th className="font-semibold px-6 py-3">EXAM</th>
                <th className="font-semibold px-6 py-3">DATE</th>
                <th className="font-semibold px-6 py-3">SCORE</th>
                <th className="font-semibold px-6 py-3">TIME</th>
                <th className="font-semibold px-6 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-400">
                      {r.category} · {r.detail}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{r.score}</div>
                    <div className="text-xs text-gray-400">{r.fraction}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400" /> {r.time}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
