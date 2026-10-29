import React from 'react';
import { formatINR } from '../../utils/formatters';
import { Check, Utensils } from 'lucide-react';

export const OfferCard = ({ offer }) => {
  if (!offer) return null;

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-medium)',
      padding: '0.9rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      {/* Header & Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <span className="badge badge-star" style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>
            {offer.tag || 'Budget Saver'}
          </span>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
            {offer.title}
          </h4>
        </div>

        {/* Pricing Pill */}
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {formatINR(offer.offer_price, 0)}
          </div>
          {offer.savings > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span className="mono" style={{ textDecoration: 'line-through' }}>{formatINR(offer.original_price, 0)}</span>
              {' '}<strong className="mono" style={{ color: 'var(--accent-emerald)' }}>Save {formatINR(offer.savings, 0)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)'
      }}>
        {offer.items && offer.items.map((it, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Check size={11} color="var(--accent-emerald)" />
              <span>{it.name}</span>
            </span>
            <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {it.portion}
            </span>
          </div>
        ))}
      </div>

      {/* Portion Total Grams */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Utensils size={12} color="var(--accent-blue)" />
          <span>Total: <strong className="mono" style={{ color: 'var(--text-secondary)' }}>{offer.portion_total_g}g</strong></span>
        </span>

        <button
          className="btn-primary"
          style={{
            padding: '3px 9px',
            fontSize: '0.72rem',
            fontWeight: 600
          }}
        >
          Select Meal
        </button>
      </div>
    </div>
  );
};
