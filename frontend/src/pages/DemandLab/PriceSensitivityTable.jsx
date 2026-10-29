import React from 'react';
import { formatINR } from '../../utils/formatters';

export const PriceSensitivityTable = ({ curveData = [], currentPrice, proposedPrice }) => {
  if (!curveData || curveData.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Simulated Price</th>
            <th>Expected Units</th>
            <th>Expected Daily Profit</th>
            <th>90% Profit Interval [p10 — p90]</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {curveData.map((row, idx) => {
            const isCurrent = Math.abs(row.price - currentPrice) < 0.5;
            const isProposed = Math.abs(row.price - proposedPrice) < 0.5;

            return (
              <tr
                key={idx}
                style={{
                  backgroundColor: isProposed ? 'var(--accent-blue-subtle)' : isCurrent ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                }}
              >
                <td style={{ fontWeight: isProposed ? 700 : 500, color: isProposed ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                  {formatINR(row.price, 0)}
                </td>
                <td>
                  {row.units_mean} units/day
                </td>
                <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                  {formatINR(row.profit_mean, 0)}
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  [{formatINR(row.profit_p10, 0)} — {formatINR(row.profit_p90, 0)}]
                </td>
                <td>
                  {isProposed ? (
                    <span className="badge" style={{ backgroundColor: 'var(--accent-blue)', color: '#ffffff' }}>
                      Simulated
                    </span>
                  ) : isCurrent ? (
                    <span className="badge badge-neutral">
                      Current
                    </span>
                  ) : (
                    '—'
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
