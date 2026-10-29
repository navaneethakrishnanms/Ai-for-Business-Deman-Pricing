import React from 'react';
import { formatINR, formatPct } from '../../utils/formatters';
import { StatusTag } from '../../components/common/StatusTag';
import { ArrowRight } from 'lucide-react';

export const ItemDetailsCard = ({ item, onSelectForDemandLab }) => {
  if (!item) return null;

  return (
    <div className="bento-card" style={{
      padding: '1.2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    }}>
      {/* Title & Kind */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: item.kind === 'main' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: item.kind === 'main' ? '#34d399' : '#38bdf8',
              border: item.kind === 'main' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              {item.kind}
            </span>
            <span className="mono" style={{ fontSize: '0.7rem', color: '#8a94a6' }}>
              {item.item_id}
            </span>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            {item.name}
          </h4>
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {item.flags && item.flags.map((flag, idx) => (
            <StatusTag key={idx} status={flag} size="small" />
          ))}
        </div>
      </div>

      {/* Financials & Portion Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        padding: '10px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-surface-inset)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Unit Price</span>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {formatINR(item.price)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Unit Cost</span>
          <div className="mono" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {formatINR(item.cost)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Gross Margin</span>
          <div className="mono" style={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: item.margin_pct < 22 ? 'var(--accent-rose)' : 'var(--accent-green)'
          }}>
            {formatINR(item.margin_abs)} ({formatPct(item.margin_pct)})
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Portion / Sales</span>
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
            {item.portion_size_g}g · {Math.round(item.units_per_day)}/d
          </div>
        </div>
      </div>

      {/* Portion Tiers */}
      {item.portion_tiers && item.portion_tiers.length > 0 && (
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Portion Tiers:
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.portion_tiers.map((tier, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>{tier.tier}</strong>: {tier.portion_size_g}g — <span className="mono" style={{ color: 'var(--accent-green)' }}>{formatINR(tier.price)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => onSelectForDemandLab && onSelectForDemandLab(item.item_id)}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
        >
          <span>Simulate in Demand Lab</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
