'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
  };

  const borderStyles = {
    success: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-950/30 text-rose-100',
    info: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-100'
  };

  return (
    <div className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border glass-panel shadow-2xl backdrop-blur-xl font-sans text-xs animate-fade-in ${borderStyles[toast.type]}`}>
      <div className="flex items-center space-x-2.5">
        {icons[toast.type]}
        <span className="font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-white ml-3 p-1 rounded-lg hover:bg-white/10 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
