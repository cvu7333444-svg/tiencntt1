"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success", options = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type, position: options.position || "top-right" }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const renderToasts = (position) => toasts
    .filter((toast) => toast.position === position)
    .map((toast) => (
      <div
        key={toast.id}
        className={`pointer-events-auto mx-auto w-fit max-w-[min(24rem,calc(100vw-2rem))] rounded-lg px-5 py-3 text-center text-sm text-white shadow-lg ${
          toast.type === "error" ? "bg-red-600" : toast.type === "info" ? "bg-gray-800" : "bg-green-600"
        }`}
      >
        {toast.message}
      </div>
    ));
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] space-y-2">{renderToasts("top-right")}</div>
      <div className="pointer-events-none fixed left-1/2 top-4 z-[100] w-full -translate-x-1/2 space-y-2 px-4">{renderToasts("top-center")}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return () => {};
  return ctx;
}
