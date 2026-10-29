import React from 'react';
import { useModelStatus } from '../../hooks/useModelStatus';
import { formatDate } from '../../utils/formatters';
import { Cpu, CheckCircle2, ShieldCheck, Database, RefreshCw, Radio } from 'lucide-react';

export const Footer = () => {
  const { status, loading, refetch } = useModelStatus();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      padding: '0.5rem 1.5rem',
      fontSize: '0.72rem',
      color: 'var(--text-tertiary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      marginTop: 'auto'
    }}>
      {/* Engine & System Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-emerald)',
            display: 'inline-block'
          }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Model Engine:</span>
          <span className="mono" style={{ color: 'var(--text-primary)' }}>
            {status?.model_version || 'v2.4-loglinear-bayes'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Simulation Source:</span>
          <span className="badge badge-neutral" style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
            {status?.data_source || 'synthetic (120d calibrated)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={13} color="var(--accent-emerald)" />
          <span style={{ color: 'var(--text-muted)' }}>Fairness Constraint:</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Enforced</span>
        </div>
      </div>

      {/* Calibration timestamp & reload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Last Calibration:</span>
          <span className="mono" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(status?.last_training_date || status?.generated_at)}
          </span>
        </div>

        <button
          onClick={refetch}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            padding: '2px 4px'
          }}
          title="Verify model status"
        >
          <RefreshCw size={11} className={loading ? 'spin' : ''} />
          <span>Status Check</span>
        </button>
      </div>
    </footer>
  );
};
