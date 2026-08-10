import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 3000) => {
      const id =
        Date.now() + Math.random().toString(36).substring(2, 9);

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    show: addToast,
    success: (msg, duration) =>
      addToast(msg, "success", duration),
    error: (msg, duration) =>
      addToast(msg, "error", duration),
    warning: (msg, duration) =>
      addToast(msg, "warning", duration),
    info: (msg, duration) =>
      addToast(msg, "info", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within a ToastProvider"
    );
  }

  return context;
}

/* ---------------- Toast Container ---------------- */

function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div
      className="
        fixed
        top-7
        right-7
        z-[9999]
        w-[340px]
        flex
        flex-col
        gap-3
        pointer-events-none
      "
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/* ---------------- Toast Item ---------------- */

function ToastItem({ toast, onClose }) {
  const styles = {
    success: {
      container: "bg-emerald-50 border-emerald-200",
      accent: "border-l-4 border-l-emerald-500",
      icon: "bg-emerald-500 text-white",
      title: "text-emerald-600",
      Icon: CheckCircle2,
    },

    error: {
      container: "bg-red-50 border-red-200",
      accent: "border-l-4 border-l-red-500",
      icon: "bg-red-500 text-white",
      title: "text-red-600",
      Icon: XCircle,
    },

    warning: {
      container: "bg-amber-50 border-amber-200",
      accent: "border-l-4 border-l-amber-500",
      icon: "bg-amber-500 text-white",
      title: "text-amber-600",
      Icon: AlertTriangle,
    },

    info: {
      container: "bg-blue-50 border-blue-200",
      accent: "border-l-4 border-l-blue-500",
      icon: "bg-blue-500 text-white",
      title: "text-blue-600",
      Icon: Info,
    },
  };

  const style = styles[toast.type] || styles.info;

  const titles = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
  };

  const Icon = style.Icon;

  return (
    <div
      className={`
        pointer-events-auto
        relative
        flex
        items-start
        gap-3
        w-full
        px-3.5
        py-3
        rounded-r-lg
        rounded-l-none
        border
        ${style.accent}
        ${style.container}
        shadow-md
        animate-toast-in
      `}
      role="alert"
    >
      {/* Icon */}
      <div
        className={`
          flex
          items-center
          justify-center
          shrink-0
          w-7
          h-7
          rounded-full
          ${style.icon}
        `}
      >
        <Icon size={15} strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5">
        <h4
          className={`
            text-sm
            font-semibold
            leading-5
            ${style.title}
          `}
        >
          {titles[toast.type]}
        </h4>

        <p className="mt-0.5 text-[13px] leading-[18px] text-slate-600">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="
          absolute
          top-3
          right-3
          text-slate-500
          hover:text-slate-800
          transition-colors
          cursor-pointer
        "
        aria-label="Close notification"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}