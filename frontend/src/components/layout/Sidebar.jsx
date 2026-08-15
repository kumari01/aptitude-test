import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, FileText, BarChart2, User, Shield } from "lucide-react";
import Logo from "../common/Logo";
import { INK } from "../../constants/theme";

export function Sidebar() {
  const isAdmin = !!localStorage.getItem("admin");

  const navItems = isAdmin
    ? [
        { to: "/admin", icon: <Shield size={18} />, label: "Admin Console" },
        { to: "/exams", icon: <FileText size={18} />, label: "Exams" },
        { to: "/results", icon: <BarChart2 size={18} />, label: "Results" },
        { to: "/profile", icon: <User size={18} />, label: "Profile" },
      ]
    : [
        { to: "/dashboard", icon: <LayoutGrid size={18} />, label: "Dashboard" },
        { to: "/exams", icon: <FileText size={18} />, label: "Exams" },
        { to: "/results", icon: <BarChart2 size={18} />, label: "Results" },
        { to: "/profile", icon: <User size={18} />, label: "Profile" },
      ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen px-4 py-6 hidden md:block">
      <div className="px-2 mb-8">
        <Logo />
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
              }`
            }
            style={({ isActive }) => (isActive ? { background: INK } : {})}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
