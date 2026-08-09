import React from "react";
import { FONT_DISPLAY } from "../../constants/theme";

export function StatCard({ label, value, delta, deltaTone = "green", icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: FONT_DISPLAY }}>
        {value}
      </div>
      {delta && (
        <div
          className={`text-xs mt-2 font-medium ${
            deltaTone === "green" ? "text-emerald-600" : "text-gray-500"
          }`}
        >
          {deltaTone === "green" ? "↑ " : ""}
          {delta}
        </div>
      )}
    </div>
  );
}

export default StatCard;
