import React, { useEffect, useState } from "react";
import { Trophy, FileText, User, Mail, Hash, Building2, Calendar, Layers, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
import StatCard from "../components/common/StatCard";
import { BRAND, INK, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!localStorage.getItem("admin");

  useEffect(() => {
    const fetchProfileAndProgress = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const localAdmin = localStorage.getItem("admin");
          if (localAdmin) {
            setUser(JSON.parse(localAdmin));
          }
        } else {
          const [profileRes, progressRes] = await Promise.all([
            api.get("/auth/student/profile").catch(() => null),
            api.get("/auth/student/progress").catch(() => null)
          ]);

          if (profileRes?.data?.student) {
            setUser(profileRes.data.student);
          } else {
            const localStudent = localStorage.getItem("student");
            if (localStudent) setUser(JSON.parse(localStudent));
          }

          if (progressRes?.data) {
            setProgress(progressRes.data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndProgress();
  }, [isAdmin]);

  const displayName = user?.username || (isAdmin ? "Admin User" : "Student");
  const displayEmail = user?.email || "N/A";
  const displayRoll = user?.rollno || user?.adminid || "N/A";
  const displayDept = user?.department || "General";
  const displayBatch = user?.batch || "N/A";
  const displaySection = user?.section || "N/A";
  const displayPhone = user?.phone || "N/A";
  const displayStatus = user?.status || "active";
  const initial = displayName ? displayName[0].toUpperCase() : (isAdmin ? "A" : "S");

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            {isAdmin ? "Admin Profile" : "Student Profile"}
          </h1>
          <p className="text-gray-500 mt-1">Complete account information and performance details</p>
        </div>
        <span
          className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border uppercase"
          style={{
            background: isAdmin ? "#EEF2FF" : "#ECFDF5",
            color: isAdmin ? "#4F46E5" : "#059669",
            borderColor: isAdmin ? "#C7D2FE" : "#A7F3D0"
          }}
        >
          {isAdmin ? "System Administrator" : "Verified Student"}
        </span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm mb-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm"
          style={{ background: isAdmin ? INK : BRAND, fontFamily: FONT_DISPLAY }}
        >
          {initial}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
              {displayName}
            </h2>
            <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck size={14} /> Status: {displayStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">{displayEmail}</p>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            {isAdmin ? `Admin ID: ${displayRoll}` : `Roll Number: ${displayRoll}`}
          </p>
        </div>
      </div>

      {/* Detailed Student Information Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY }}>
          <User size={18} className="text-gray-500" /> Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
              <User size={14} /> Full Name
            </div>
            <div className="font-bold text-gray-900 text-base">{displayName}</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
              <Hash size={14} /> {isAdmin ? "Admin ID" : "Roll Number"}
            </div>
            <div className="font-bold text-gray-900 text-base font-mono">{displayRoll}</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
              <Mail size={14} /> Email Address
            </div>
            <div className="font-bold text-gray-900 text-base truncate">{displayEmail}</div>
          </div>

          {!isAdmin && (
            <>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Building2 size={14} /> Department / Branch
                </div>
                <div className="font-bold text-gray-900 text-base">{displayDept || "N/A"}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Calendar size={14} /> Batch / Academic Year
                </div>
                <div className="font-bold text-gray-900 text-base">{displayBatch || "N/A"}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <Layers size={14} /> Section
                </div>
                <div className="font-bold text-gray-900 text-base">{displaySection || "N/A"}</div>
              </div>
            </>
          )}

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
              <Phone size={14} /> Contact Phone
            </div>
            <div className="font-bold text-gray-900 text-base">{displayPhone || "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Student Academic Stats (if not admin) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Exams Completed"
            value={progress?.examsCompleted ?? 0}
            icon={<FileText size={18} />}
            iconBg="#DBEAFE"
            iconColor="#2563EB"
          />
          <StatCard
            label="Average Score"
            value={progress?.avgScore ?? "0%"}
            icon={<CheckCircle2 size={18} />}
            iconBg="#D1FAE5"
            iconColor="#059669"
          />
          <StatCard
            label="Best Score"
            value={progress?.bestScore ?? "0%"}
            icon={<Trophy size={18} />}
            iconBg="#FCE7E9"
            iconColor={BRAND}
          />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
