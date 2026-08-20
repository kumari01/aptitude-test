import React from "react";

/**
 * BaseSkeleton primitive component
 * Offers smooth gradient shimmer animation with customizable dimensions and styles.
 */
export function BaseSkeleton({ className = "", dark = false, style = {} }) {
  return (
    <div
      className={`rounded-xl ${dark ? "animate-shimmer-dark bg-slate-800" : "animate-shimmer bg-gray-200"} ${className}`}
      style={style}
    />
  );
}

export default BaseSkeleton;
