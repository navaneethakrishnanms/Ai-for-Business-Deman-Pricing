import React from 'react';
import { formatINR } from '../../utils/formatters';

export const PriceSensitivityTable = ({ curveData = [], currentPrice, proposedPrice }) => {
  if (!curveData || curveData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        No sensitivity data available for this item.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-surface-inset)', borderBottom: '1px solid var(--border-medium)' }}>
            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Simulated Price</th>
            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Expected Units</th>
            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Expected Daily Profit</th>
            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>90% Profit Interval [p10 — p90]</th>
            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {curveData.map((row, idx) => {
            const isCurrent = currentPrice && Math.abs(row.price - currentPrice) < 0.5;
            const isProposed = proposedPrice && Math.abs(row.price - proposedPrice) < 0.5;

            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: isProposed 
                    ? 'var(--accent-blue-subtle)' 
                    : isCurrent 
                    ? 'var(--accent-green-subtle)' 
                    : 'transparent',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <td className="mono" style={{ padding: '9px 14px', fontWeight: isProposed ? 800 : 600, color: isProposed ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                  {formatINR(row.price, 0)}
                </td>
                <td className="mono" style={{ padding: '9px 14px', color: 'var(--text-primary)' }}>
                  {Math.round(row.units_mean)} units/day
                </td>
                <td className="mono" style={{ padding: '9px 14px', fontWeight: 700, color: row.profit_mean < 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                  {formatINR(row.profit_mean, 0)}
                </td>
                <td className="mono" style={{ padding: '9px 14px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  [{formatINR(row.profit_p10, 0)} — {formatINR(row.profit_p90, 0)}]
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  {isProposed ? (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--accent-blue)',
                      color: '#ffffff'
                    }}>
                      Simulated
                    </span>
                  ) : isCurrent ? (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--accent-green)',
                      color: '#ffffff'
                    }}>
                      Current
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
