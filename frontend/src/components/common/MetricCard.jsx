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
    <div className="panel" style={{
      padding: '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.65rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {badge}
          {Icon && <Icon size={15} color="var(--text-muted)" />}
        </div>
      </div>

      <div>
        {range ? (
          <RangeBadge range={range} isCurrency={isCurrency} unit={unit} />
        ) : (
          <div className="kpi-value" style={{
            fontSize: '1.5rem',
            fontWeight: 700,
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
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.45rem'
        }}>
          {delta !== null && (
            <span style={{
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: delta > 0 ? 'var(--accent-emerald)' : delta < 0 ? 'var(--accent-rose)' : 'var(--text-tertiary)'
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
