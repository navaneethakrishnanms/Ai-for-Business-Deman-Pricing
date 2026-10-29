import React from 'react';
import { formatINR } from '../../utils/formatters';

export const RangeBadge = ({ range, isCurrency = true, unit = '' }) => {
  if (!range || range.mean === undefined) {
    return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
  }

  const { mean, p10, p90 } = range;
  const formattedMean = isCurrency ? formatINR(mean, 0) : `${Number(mean).toFixed(1)}${unit}`;
  const formattedP10 = isCurrency ? formatINR(p10, 0) : `${Number(p10).toFixed(1)}${unit}`;
  const formattedP90 = isCurrency ? formatINR(p90, 0) : `${Number(p90).toFixed(1)}${unit}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span className="mono" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
        {formattedMean}
      </span>
      <span style={{
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--bg-surface-inset)',
        border: '1px solid var(--border-subtle)',
        padding: '1px 6px',
        borderRadius: 'var(--radius-pill)',
        marginTop: '3px'
      }}>
        CI [{formattedP10} — {formattedP90}]
      </span>
    </div>
  );
};
