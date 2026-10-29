import React from 'react';
import { formatINR, formatPct } from '../../utils/formatters';
import { StatusTag } from '../../components/common/StatusTag';
import { ArrowRight } from 'lucide-react';

export const ItemDetailsCard = ({ item, onSelectForDemandLab }) => {
  if (!item) return null;

  return (
    <div className="panel" style={{
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
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: item.kind === 'main' ? 'var(--accent-blue-subtle)' : 'rgba(56, 189, 248, 0.1)',
              color: item.kind === 'main' ? 'var(--accent-blue)' : '#38bdf8',
              border: item.kind === 'main' ? '1px solid var(--accent-blue-border)' : '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              {item.kind}
            </span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {item.item_id}
            </span>
          </div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Unit Price</span>
          <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {formatINR(item.price)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Unit Cost</span>
          <div className="mono" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            {formatINR(item.cost)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Gross Margin</span>
          <div className="mono" style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: item.margin_pct < 22 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
          }}>
            {formatINR(item.margin_abs)} ({formatPct(item.margin_pct)})
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Portion / Sales</span>
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {item.portion_size_g}g · {Math.round(item.units_per_day)}/d
          </div>
        </div>
      </div>

      {/* Portion Tiers */}
      {item.portion_tiers && item.portion_tiers.length > 0 && (
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Portion Tiers:
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.portion_tiers.map((tier, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>{tier.tier}</strong>: {tier.portion_size_g}g — <span className="mono">{formatINR(tier.price)}</span>
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
          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
        >
          <span>Simulate Elasticity</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
