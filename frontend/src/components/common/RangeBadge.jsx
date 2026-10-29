import React from 'react';
import { formatINR } from '../../utils/formatters';

export const RangeBadge = ({ range, isCurrency = true, unit = '' }) => {
  if (!range || range.mean === undefined) {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }

  const { mean, p10, p90 } = range;
  const formattedMean = isCurrency ? formatINR(mean, 0) : `${Number(mean).toFixed(1)}${unit}`;
  const formattedP10 = isCurrency ? formatINR(p10, 0) : `${Number(p10).toFixed(1)}${unit}`;
  const formattedP90 = isCurrency ? formatINR(p90, 0) : `${Number(p90).toFixed(1)}${unit}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
        {formattedMean}
      </span>
      <span style={{
        fontSize: '0.68rem',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-subtle)',
        padding: '1px 5px',
        borderRadius: 'var(--radius-xs)',
        marginTop: '2px'
      }}>
        CI [{formattedP10} — {formattedP90}]
      </span>
    </div>
  );
};
