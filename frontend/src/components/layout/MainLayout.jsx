import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { FONT_BODY } from "../../constants/theme";

export function MainLayout() {
  // Desktop/tablet: expanded vs collapsed sidebar (icon-only)
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: slide-in overlay drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer when the viewport grows to md+ so the desktop
  // sidebar takes over cleanly.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden" style={{ fontFamily: FONT_BODY }}>
      {/* Desktop/tablet sidebar (collapsible & fixed to screen height) + Mobile overlay drawer */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />

      {/* Right Content Area - independently scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;