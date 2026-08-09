import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function StatusPill({ status }) {
  const passed = status === "Passed";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      }`}
    >
      {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {status}
    </span>
  );
}

export default StatusPill;
