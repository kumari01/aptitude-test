import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, FileText, BarChart2, User, Shield, X, Menu } from "lucide-react";
import Logo from "../common/Logo";
import { INK } from "../../constants/theme";

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }) {
  const isAdmin = !!localStorage.getItem("admin");

  const navItems = isAdmin
    ? [
        { to: "/admin", icon: <Shield size={20} />, label: "Admin Console" },
        { to: "/exams", icon: <FileText size={20} />, label: "Exams" },
        { to: "/results", icon: <BarChart2 size={20} />, label: "Results" },
        { to: "/profile", icon: <User size={20} />, label: "Profile" },
      ]
    : [
        { to: "/dashboard", icon: <LayoutGrid size={20} />, label: "Dashboard" },
        { to: "/exams", icon: <FileText size={20} />, label: "Exams" },
        { to: "/results", icon: <BarChart2 size={20} />, label: "Results" },
        { to: "/profile", icon: <User size={20} />, label: "Profile" },
      ];

  // ---- Desktop/tablet sidebar (collapsible) ----
  const desktopSidebar = (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } shrink-0`}
    >
      {/* Logo area */}
      <div className={`flex items-center justify-between gap-2 px-4 py-6 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
          /* When collapsed, show only the hamburger icon centered */
          <button
            onClick={onToggleCollapsed}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <Menu size={20} />
          </button>
        ) : (
          <>
            <Logo />
            {/* Hamburger toggle button */}
            <button
              onClick={onToggleCollapsed}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <Menu size={20} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
              } ${collapsed ? "justify-center" : ""}`
            }
            style={({ isActive }) => (isActive ? { background: INK } : {})}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );

  // ---- Mobile overlay drawer ----
  const mobileDrawer = (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Drawer panel - overlays on top of content */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
          <Logo />
          <button
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1 px-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`
              }
              style={({ isActive }) => (isActive ? { background: INK } : {})}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}

export default Sidebar;