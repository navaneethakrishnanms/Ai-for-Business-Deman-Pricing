import React from 'react';
import { StatusTag } from '../../components/common/StatusTag';
import { RangeBadge } from '../../components/common/RangeBadge';
import { formatPct } from '../../utils/formatters';
import { Sparkles, ArrowRight } from 'lucide-react';

export const SuggestionsDrawer = ({ suggestions = [], items = [], onSelectSuggestion }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        No suggested pairings available.
      </div>
    );
  }

  const getItemName = (id) => {
    const item = items.find(i => i.item_id === id);
    return item ? item.name : id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Sparkles size={16} color="var(--accent-primary)" />
        <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-main)' }}>
          AI High-Affinity Combo Suggestions (GET /combos/suggestions)
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {suggestions.map((sugg, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusTag status={sugg.status} size="small" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                Best: {formatPct(sugg.best_discount_pct)} off
              </span>
            </div>

            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f9fafb' }}>
              {getItemName(sugg.main_item_id)} + {getItemName(sugg.addon_item_id)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Expected Incremental Profit:</span>
              <RangeBadge range={sugg.incremental_profit_per_day} isCurrency={true} />
            </div>

            {sugg.reason && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0 }}>
                {sugg.reason}
              </p>
            )}

            <button
              onClick={() => onSelectSuggestion(sugg)}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>Load into Studio</span>
              <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

