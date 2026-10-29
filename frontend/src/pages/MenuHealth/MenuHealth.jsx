import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { ItemDetailsCard } from './ItemDetailsCard';
import { GuardrailsModal } from './GuardrailsModal';
import { MetricCard } from '../../components/common/MetricCard';
import { formatINR, formatPct } from '../../utils/formatters';
import { 
  Activity, 
  ShieldAlert, 
  Flame, 
  ShoppingBag, 
  Search, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

export const MenuHealth = ({ onNavigateToDemandLab }) => {
  const { items, combos, loading, refetch } = useMenu();
  const { guardrails } = useGuardrailsContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);

  // Compute summary stats
  const totalItems = items.length;
  const mainsCount = items.filter(i => i.kind === 'main').length;
  const addonsCount = items.filter(i => i.kind === 'addon').length;
  const lossMakersCount = items.filter(i => (i.flags && i.flags.includes('loss_maker')) || i.margin_pct < guardrails.margin_floor_pct).length;
  const starsCount = items.filter(i => i.flags && i.flags.includes('star')).length;

  const avgMargin = items.length > 0
    ? items.reduce((acc, i) => acc + i.margin_pct, 0) / items.length
    : 0;

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.item_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterKind === 'main') return item.kind === 'main';
    if (filterKind === 'addon') return item.kind === 'addon';
    if (filterKind === 'loss_maker') return (item.flags && item.flags.includes('loss_maker')) || item.margin_pct < guardrails.margin_floor_pct;
    if (filterKind === 'star') return item.flags && item.flags.includes('star');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-neutral">
              Part A · GET /items
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Owner System of Record</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Menu Health & Cost Structure
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            Unit cost, margin percentages, portion tiers, and margin floor violations across cafeteria inventory.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsGuardrailsOpen(true)}
            className="btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <SlidersHorizontal size={14} />
            <span>Configure Guardrails</span>
          </button>

          <button
            onClick={refetch}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.65rem' }}
            title="Reload Menu Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <MetricCard
          title="Average Menu Margin"
          value={formatPct(avgMargin)}
          subtext={`Margin Floor: ${guardrails.margin_floor_pct}%`}
          icon={Activity}
          color="var(--accent-blue)"
        />

        <MetricCard
          title="Loss-Maker Breaches"
          value={lossMakersCount}
          subtext="Items below margin floor"
          icon={ShieldAlert}
          color="var(--accent-rose)"
        />

        <MetricCard
          title="Star Margin Performers"
          value={starsCount}
          subtext="Healthy margin & velocity"
          icon={Flame}
          color="var(--accent-emerald)"
        />

        <MetricCard
          title="Active Combos"
          value={combos.length}
          subtext="Current menu pairings"
          icon={ShoppingBag}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="panel" style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 10px',
          minWidth: '260px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search dish name or item ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              width: '100%',
              padding: '2px'
            }}
          />
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${totalItems})` },
            { id: 'main', label: `Mains (${mainsCount})` },
            { id: 'addon', label: `Add-ons (${addonsCount})` },
            { id: 'loss_maker', label: `Margin Violations (${lossMakersCount})` },
            { id: 'star', label: `Stars (${starsCount})` }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterKind(btn.id)}
              style={{
                backgroundColor: filterKind === btn.id ? 'var(--bg-surface-elevated)' : 'transparent',
                color: filterKind === btn.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: filterKind === btn.id ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: filterKind === btn.id ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            Inventory Catalog ({filteredItems.length})
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Showing items with portion tiers and margin economics
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No items matched your filter criteria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '0.85rem' }}>
            {filteredItems.map(item => (
              <ItemDetailsCard
                key={item.item_id}
                item={item}
                onSelectForDemandLab={onNavigateToDemandLab}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Active Combos Section */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
          <ShoppingBag size={16} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '0.98rem', margin: 0 }}>Current Active Combos ({combos.length})</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
          {combos.map(combo => (
            <div
              key={combo.combo_id}
              style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{combo.combo_id}</span>
                <span className="badge badge-star" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>
                  {combo.discount_pct}% Discount
                </span>
              </div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{combo.name || combo.combo_id}</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Items: {combo.combo_items.join(' + ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails Configuration Modal */}
      <GuardrailsModal
        isOpen={isGuardrailsOpen}
        onClose={() => setIsGuardrailsOpen(false)}
      />
    </div>
  );
};
