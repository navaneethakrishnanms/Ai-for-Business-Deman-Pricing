import React from 'react';
import { RangeBadge } from './RangeBadge';

export const MetricCard = ({
  title,
  value,
  range = null,
  isCurrency = true,
  unit = '',
  delta = null,
  icon: Icon = null,
  badge = null,
  color = null,
  subtext = ''
}) => {
  return (
    <div className="bento-card" style={{
      padding: '1.2rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.65rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {badge}
          {Icon && (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color || 'var(--text-secondary)'
            }}>
              <Icon size={15} />
            </div>
          )}
        </div>
      </div>

      <div>
        {range ? (
          <RangeBadge range={range} isCurrency={isCurrency} unit={unit} />
        ) : (
          <div className="mono" style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: color || 'var(--text-primary)',
            lineHeight: '1.2'
          }}>
            {value}
          </div>
        )}
      </div>

      {(delta !== null || subtext) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.5rem'
        }}>
          {delta !== null && (
            <span style={{
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)'
            }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
