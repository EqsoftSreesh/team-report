'use client';

import { createContext, useContext, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const containerRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (!containerRef.current) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💡' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
    containerRef.current.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-wrap" ref={containerRef} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
