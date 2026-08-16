import React, { useEffect, useState } from "react";
import { Trophy, FileText } from "lucide-react";
import StatCard from "../components/common/StatCard";
import { USER, STATS } from "../data/mockData";
import { BRAND, FONT_DISPLAY } from "../constants/theme";
import api from "../api/axios";

export function ProfilePage() {
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, progressRes] = await Promise.all([
          api.get("/auth/student/profile"),
          api.get("/auth/student/progress").catch(() => null),
        ]);

        if (profileRes?.data?.student) {
          setStudent(profileRes.data.student);
        }
        if (progressRes?.data) {
          setProgress(progressRes.data);
        }
      } catch (error) {
        console.error("Profile error:", error);
        const localStudent = localStorage.getItem("student");
        if (localStudent) {
          try {
            setStudent(JSON.parse(localStudent));
          } catch (e) {
            console.error("Failed to parse stored student data", e);
          }
        }
      }
    };

    fetchProfile();
  }, []);

  const displayName = student?.username || student?.name || USER.name;
  const displayRoll = student?.rollno || student?.roll || USER.roll;
  const displayEmail = student?.email || "student@sasi.ac.in";
  const initial = displayName ? displayName[0].toUpperCase() : "S";

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        Profile
      </h1>
      <p className="text-gray-500 mt-1 mb-6">Your account details</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex items-center gap-5 shadow-sm">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
          style={{ background: BRAND, fontFamily: FONT_DISPLAY }}
        >
          {initial}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
            {displayName}
          </div>
          <div className="text-gray-500 text-sm mt-1">Roll Number: {displayRoll}</div>
          <div className="text-gray-500 text-sm">{displayEmail}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard
          label="Best Score"
          value={progress ? progress.bestScore : "0%"}
          icon={<Trophy size={17} />}
          iconBg="#FCE7E9"
          iconColor={BRAND}
        />
        <StatCard
          label="Exams Completed"
          value={progress ? progress.examsCompleted : 0}
          icon={<FileText size={17} />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
      </div>
    </div>
  );
}

export default ProfilePage;
