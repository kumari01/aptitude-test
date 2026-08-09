import React from "react";
import { BRAND, FONT_DISPLAY } from "../../constants/theme";

export const Logo = ({ dark }) => (
  <div className="flex items-center gap-2.5">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
      style={{ background: BRAND, fontFamily: FONT_DISPLAY }}
    >
      A
    </div>
    <span
      className="text-xl font-bold"
      style={{
        fontFamily: FONT_DISPLAY,
        color: dark ? "#fff" : "#111827",
      }}
    >
      Aptitude
    </span>
  </div>
);

export default Logo;
