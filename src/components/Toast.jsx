import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'info', message } = toast;

  const icons = {
    success: <CheckCircle2 size={20} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />,
    error: <AlertCircle size={20} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />,
    info: <Info size={20} style={{ color: 'var(--accent-info)', flexShrink: 0 }} />
  };

  return (
    <div className={`toast toast-${type}`}>
      {icons[type]}
      <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.4 }}>
        {message}
      </div>
      <button 
        onClick={onClose}
        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
        aria-label="Tutup notifikasi"
      >
        <X size={16} />
      </button>
    </div>
  );
}
