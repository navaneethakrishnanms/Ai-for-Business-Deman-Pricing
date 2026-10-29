import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px'
    }}>
      {toasts.map((toast) => {
        let border = 'var(--border-subtle)';
        let Icon = Info;
        let iconColor = 'var(--accent-primary)';

        if (toast.type === 'success') {
          border = 'rgba(16, 185, 129, 0.4)';
          Icon = CheckCircle2;
          iconColor = '#34d399';
        } else if (toast.type === 'warning') {
          border = 'rgba(245, 158, 11, 0.4)';
          Icon = AlertTriangle;
          iconColor = '#fbbf24';
        } else if (toast.type === 'error') {
          border = 'rgba(244, 63, 94, 0.4)';
          Icon = AlertCircle;
          iconColor = '#fb7185';
        }

        return (
          <div
            key={toast.id}
            className="glass-panel"
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              border,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              background: 'rgba(17, 24, 39, 0.95)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

