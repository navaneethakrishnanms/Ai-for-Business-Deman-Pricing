import React from 'react';
import { formatINR } from '../../utils/formatters';
import { Check, Utensils } from 'lucide-react';

export const OfferCard = ({ offer }) => {
  if (!offer) return null;

  const title = offer.title || offer.name || 'Curated Meal Combo';
  const price = offer.offer_price ?? offer.combo_price ?? offer.price ?? 0;
  const originalPrice = offer.original_price ?? offer.list_price ?? (price + (offer.savings || offer.savings_rs || 0));
  const savings = offer.savings ?? offer.savings_rs ?? (originalPrice > price ? originalPrice - price : 0);
  const totalGrams = offer.portion_total_g ?? offer.portion_size_g ?? 450;

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-medium)',
      padding: '0.9rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* Header & Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <span className="badge badge-star" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 'var(--radius-pill)' }}>
            {offer.tag || (savings > 0 ? 'Value Combo' : 'Student Special')}
          </span>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
            {title}
          </h4>
        </div>

        {/* Pricing Pill */}
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {formatINR(price, 0)}
          </div>
          {savings > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              <span className="mono" style={{ textDecoration: 'line-through' }}>{formatINR(originalPrice, 0)}</span>
              {' '}<strong className="mono" style={{ color: 'var(--accent-emerald)' }}>Save {formatINR(savings, 0)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-surface-inset)',
        border: '1px solid var(--border-subtle)'
      }}>
        {offer.items && offer.items.map((it, idx) => {
          const itemName = typeof it === 'string' ? it : (it?.name || 'Item');
          const portionText = typeof it === 'object' && it?.portion ? it.portion : '';

          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={12} color="var(--accent-emerald)" />
                <span style={{ color: 'var(--text-primary)' }}>{itemName}</span>
              </span>
              {portionText && (
                <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                  {portionText}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Portion Total Grams */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Utensils size={13} color="var(--accent-blue)" />
          <span>Total: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{totalGrams}g</strong></span>
        </span>

        <button
          className="btn-primary"
          style={{
            padding: '4px 10px',
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
