import React from 'react';
import { formatINR } from '../../utils/formatters';
import { Clock, Beaker, CheckCircle } from 'lucide-react';

export const PilotPlanCard = ({ pilotPlan }) => {
  if (!pilotPlan) return null;

  const { duration_days = 7, arms = [] } = pilotPlan;

  return (
    <div style={{
      marginTop: '8px',
      padding: '10px 12px',
      borderRadius: '8px',
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
          <Beaker size={14} />
          <span>7-Day A/B Pilot Test Plan</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Duration: <strong>{duration_days} days</strong>
        </span>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0 }}>
        Tests consumer reaction across experimental cohorts before broad roll-out to avoid demand shocks.
      </p>

      {arms && arms.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          {arms.map((arm, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface-inset)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.72rem'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {arm.label || `Arm ${idx + 1}`}
              </div>
              <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                Price: {formatINR(arm.price, 0)} {arm.portion_size_g ? `· ${arm.portion_size_g}g` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

