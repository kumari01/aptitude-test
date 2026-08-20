import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  BarChart3, 
  UserCircle2, 
  ShieldCheck, 
  X, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Logo from "../common/Logo";
import { INK, BRAND, FONT_DISPLAY } from "../../constants/theme";

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }) {
  const isAdmin = !!localStorage.getItem("admin");

  const navItems = isAdmin
    ? [
        { to: "/admin", icon: <ShieldCheck size={19} />, label: "Admin Console", badge: "Admin" },
        { to: "/exams", icon: <BookOpenCheck size={19} />, label: "Exams Studio" },
        { to: "/results", icon: <BarChart3 size={19} />, label: "Student Telemetry" },
        { to: "/profile", icon: <UserCircle2 size={19} />, label: "Settings & Profile" },
      ]
    : [
        { to: "/dashboard", icon: <LayoutDashboard size={19} />, label: "Dashboard" },
        { to: "/exams", icon: <BookOpenCheck size={19} />, label: "Assessments" },
        { to: "/results", icon: <BarChart3 size={19} />, label: "Results & History" },
        { to: "/profile", icon: <UserCircle2 size={19} />, label: "My Profile" },
      ];

  // ---- Desktop/tablet sidebar (collapsible) ----
  const desktopSidebar = (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } shrink-0 select-none`}
    >
      {/* Top Brand / Logo & Toggle area */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 py-5 border-b border-gray-100 min-h-[73px]`}>
        {collapsed ? (
          <button
            onClick={onToggleCollapsed}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <Menu size={20} />
          </button>
        ) : (
          <>
            <Logo />
            <button
              onClick={onToggleCollapsed}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-6">
        <div>
          {!collapsed && (
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              {isAdmin ? "Admin Management" : "Main Navigation"}
            </div>
          )}

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    collapsed ? "justify-center" : "justify-start gap-3.5"
                  } px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* Consistent icon bounding box */}
                    <div
                      className={`w-6 h-6 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Label & Optional Badge */}
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Floating Tooltip in Collapsed Mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Status / Mode Pill */}
      <div className="p-3 border-t border-gray-100">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
            <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? "bg-amber-500" : "bg-emerald-500"} shrink-0 animate-pulse`} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 truncate">
                {isAdmin ? "Admin Portal" : "Student Portal"}
              </div>
              <div className="text-[10px] text-gray-400 font-medium">v1.0 • Online</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={`w-3 h-3 rounded-full ${isAdmin ? "bg-amber-500" : "bg-emerald-500"} ring-4 ring-gray-100`}
              title={isAdmin ? "Admin Portal Online" : "Student Portal Online"}
            />
          </div>
        )}
      </div>
    </aside>
  );

  // ---- Mobile overlay drawer ----
  const mobileDrawer = (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Drawer panel - overlays on top of content */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
            <Logo />
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-3 py-4">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
              {isAdmin ? "Admin Management" : "Main Navigation"}
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Drawer Bottom Tag */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
            <span className="text-xs font-semibold text-gray-700">
              {isAdmin ? "Admin System Active" : "Student Session Active"}
            </span>
          </div>
        </div>
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