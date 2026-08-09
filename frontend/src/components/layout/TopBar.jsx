import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { USER } from "../../data/mockData";

export function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-end gap-6 px-6 md:px-10 py-5 border-b border-gray-100 bg-white">
      <span className="text-sm text-gray-500 font-medium">{USER.name}</span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-black transition-colors"
      >
        Logout <LogOut size={15} />
      </button>
    </div>
  );
}

export default TopBar;
