import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { BRAND, BRAND_DARK } from "../../constants/theme";

export function TopBar({ onMenuClick }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 md:px-10 py-5 border-b border-gray-100 bg-white">
      <button
        onClick={onMenuClick}
        className="text-gray-700 hover:bg-gray-100 rounded-lg px-2.5 py-2 transition-colors cursor-pointer md:hidden"
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors cursor-pointer"
        style={{ background: BRAND }}
        onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_DARK)}
        onMouseLeave={(e) => (e.currentTarget.style.background = BRAND)}
      >
        Logout <LogOut size={15} />
      </button>
    </div>
  );
}

export default TopBar;