import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import api from "../../api/axios";

export function TopBar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(() => {
    const savedStudent = localStorage.getItem("student");
    const savedAdmin = localStorage.getItem("admin");
    if (savedStudent) {
      try {
        return JSON.parse(savedStudent).username;
      } catch (e) {}
    }
    if (savedAdmin) {
      try {
        return JSON.parse(savedAdmin).username;
      } catch (e) {}
    }
    return "";
  });

  useEffect(() => {
    const savedAdmin = localStorage.getItem("admin");
    if (savedAdmin) return; // Admin profile comes from localStorage

    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/auth/student/profile");

        if (response.data?.student?.username) {
          setUserName(response.data.student.username);
        }
      } catch (error) {
        console.error("TopBar user profile fetch error:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-end gap-6 px-6 md:px-10 py-5 border-b border-gray-100 bg-white">
      <span className="text-sm text-gray-700 font-semibold">{userName || "Student"}</span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-black transition-colors cursor-pointer"
      >
        Logout <LogOut size={15} />
      </button>
    </div>
  );
}

export default TopBar;
