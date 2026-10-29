import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useComboStudio } from '../../hooks/useComboStudio';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { MetricCard } from '../../components/common/MetricCard';
import { RangeBadge } from '../../components/common/RangeBadge';
import { StatusTag } from '../../components/common/StatusTag';
import { DayTypeSelector } from '../../components/common/DayTypeSelector';
import { SuggestionsDrawer } from './SuggestionsDrawer';
import { formatINR, formatPct, formatRatioAsPct } from '../../utils/formatters';
import { 
  ShoppingBag, 
  TrendingUp, 
  ShieldAlert
} from 'lucide-react';

export const ComboStudio = () => {
  const { items } = useMenu();
  const { guardrails } = useGuardrailsContext();
  const { evaluation, suggestions, evalLoading, evaluate } = useComboStudio();

  const mains = items.filter(i => i.kind === 'main');
  const addons = items.filter(i => i.kind === 'addon');

  const [mainId, setMainId] = useState(mains[0]?.item_id || 'item_biryani');
  const [addonId, setAddonId] = useState(addons[0]?.item_id || 'addon_cold_coffee');
  const [discountPct, setDiscountPct] = useState(12.0);
  const [dayType, setDayType] = useState('regular');

  const selectedMain = items.find(i => i.item_id === mainId) || mains[0];
  const selectedAddon = items.find(i => i.item_id === addonId) || addons[0];

  useEffect(() => {
    if (mains.length && (!mainId || !mains.some(m => m.item_id === mainId))) {
      setMainId(mains[0].item_id);
    }
    if (addons.length && (!addonId || !addons.some(a => a.item_id === addonId))) {
      setAddonId(addons[0].item_id);
    }
  }, [items, mainId, addonId]);

  useEffect(() => {
    if (mainId && addonId) {
      evaluate({
        main_item_id: mainId,
        addon_item_id: addonId,
        discount_pct: parseFloat(discountPct),
        day_type: dayType
      });
    }
  }, [mainId, addonId, discountPct, dayType, evaluate]);

  // Combined price calculations
  const standaloneFullPrice = (selectedMain?.price || 0) + (selectedAddon?.price || 0);
  const bundlePrice = standaloneFullPrice * (1 - discountPct / 100);
  const totalCost = (selectedMain?.cost || 0) + (selectedAddon?.cost || 0);

  const handleSelectSuggestion = (sugg) => {
    setMainId(sugg.main_item_id);
    setAddonId(sugg.addon_item_id);
    setDiscountPct(sugg.best_discount_pct);
  };

  const isCannibalisationRisk = (evaluation?.cannibalised_share || 0) > 0.55;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-neutral">
            Part D · POST /combos/evaluate
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Layer 2 Combo Cannibalisation & Cross-Sell Model</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Combo Studio & Cannibalisation Governance
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
          Test meal pairing discounts while preventing the <strong>Cannibalisation Trap</strong> — where discounts erode gross margin on students who would have purchased both items at standard prices.
        </p>
      </div>

      {/* Main Grid: Controls on Left, Analysis on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Left Column: Pairing Configuration */}
        <div className="panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <ShoppingBag size={15} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Combo Pairing Inputs</h3>
          </div>

          {/* Main Item Select */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Main Course Selection:
            </label>
            <select
              value={mainId}
              onChange={(e) => setMainId(e.target.value)}
              style={{ width: '100%' }}
            >
              {mains.map(m => (
                <option key={m.item_id} value={m.item_id}>
                  {m.name} — {formatINR(m.price)} (Margin: {formatPct(m.margin_pct)})
                </option>
              ))}
            </select>
          </div>

          {/* Add-on Select */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Add-On / Beverage Selection:
            </label>
            <select
              value={addonId}
              onChange={(e) => setAddonId(e.target.value)}
              style={{ width: '100%' }}
            >
              {addons.map(a => (
                <option key={a.item_id} value={a.item_id}>
                  {a.name} — {formatINR(a.price)} (Margin: {formatPct(a.margin_pct)})
                </option>
              ))}
            </select>
          </div>

          {/* Combo Discount Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Combo Bundle Discount (%)</label>
              <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {discountPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={guardrails.combo_discount_cap_pct}
              step="1"
              value={discountPct}
              onChange={(e) => setDiscountPct(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>0% (Standalone)</span>
              <span>Guardrail Cap: {guardrails.combo_discount_cap_pct}%</span>
            </div>
          </div>

          {/* Day Context */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Day Operating Context:
            </label>
            <DayTypeSelector
              selected={dayType}
              onChange={setDayType}
              fairnessActive={guardrails.fairness_mode}
            />
          </div>

          {/* Pricing Summary Box */}
          <div style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Standalone Sum:</span>
              <span className="mono" style={{ textDecoration: 'line-through' }}>{formatINR(standaloneFullPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>Combo Offering Price:</span>
              <span className="mono" style={{ color: 'var(--accent-emerald)', fontSize: '0.92rem' }}>{formatINR(bundlePrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
              <span>Student Savings:</span>
              <span className="mono">{formatINR(standaloneFullPrice - bundlePrice)} ({discountPct}%)</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Cannibalisation Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Decision Status Panel */}
          {evaluation && (
            <div className="panel" style={{
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderLeft: evaluation.status === 'apply'
                ? '3px solid var(--accent-emerald)'
                : evaluation.status === 'pilot'
                ? '3px solid var(--accent-amber)'
                : '3px solid var(--accent-rose)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusTag status={evaluation.status} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Gatekeeper Recommendation
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Probability Profit Improves: <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>{formatRatioAsPct(evaluation.prob_profit_improves)}</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                {evaluation.reason}
              </p>
            </div>
          )}

          {/* Key Output Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <MetricCard
              title="Incremental Profit"
              range={evaluation?.incremental_profit_per_day}
              isCurrency={true}
              subtext="₹ / day net gain"
              color="var(--accent-emerald)"
            />

            <MetricCard
              title="Predicted Take Rate"
              range={evaluation?.take_rate}
              isCurrency={false}
              subtext="Share of main course buyers"
            />

            <MetricCard
              title="Cannibalised Share"
              value={formatRatioAsPct(evaluation?.cannibalised_share || 0)}
              subtext="Would purchase both anyway"
              color={isCannibalisationRisk ? 'var(--accent-rose)' : 'var(--text-secondary)'}
              badge={isCannibalisationRisk ? <ShieldAlert size={14} color="var(--accent-rose)" /> : null}
            />

            <MetricCard
              title="Break-Even Take Rate"
              value={formatRatioAsPct(evaluation?.break_even_take_rate || 0)}
              subtext="Minimum adoption threshold"
            />
          </div>

          {/* Volume Dynamics Breakdown */}
          <div className="panel" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <TrendingUp size={14} color="var(--accent-blue)" />
              <span>Volume Dynamics & Cross-Sell Lift Drivers</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Incremental Add-On Lift</span>
                <strong className="mono" style={{ fontSize: '0.98rem', color: 'var(--accent-blue)' }}>
                  +{evaluation?.addon_lift || 0} units/day
                </strong>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Additional snack/beverage units sold due to bundle incentive.
                </p>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Main Traffic Spillover</span>
                <strong className="mono" style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  +{evaluation?.main_traffic_lift || 0} units/day
                </strong>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Incremental cafeteria visits attracted by the combo value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Affinity Suggestions Grid */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <SuggestionsDrawer
          suggestions={suggestions}
          items={items}
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>
    </div>
  );
};
