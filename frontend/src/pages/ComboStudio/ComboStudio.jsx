import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useComboStudio } from '../../hooks/useComboStudio';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusTag } from '../../components/common/StatusTag';
import { DayTypeSelector } from '../../components/common/DayTypeSelector';
import { SuggestionsDrawer } from './SuggestionsDrawer';
import { formatINR, formatPct, formatRatioAsPct } from '../../utils/formatters';
import { 
  Layers, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight
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
    if (mains.length && !mainId) setMainId(mains[0].item_id);
    if (addons.length && !addonId) setAddonId(addons[0].item_id);
  }, [items]);

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

  const standaloneFullPrice = (selectedMain?.price || 0) + (selectedAddon?.price || 0);
  const bundlePrice = standaloneFullPrice * (1 - discountPct / 100);

  const handleSelectSuggestion = (sugg) => {
    setMainId(sugg.main_item_id);
    setAddonId(sugg.addon_item_id);
    setDiscountPct(sugg.best_discount_pct);
  };

  const isCannibalisationRisk = (evaluation?.cannibalised_share || 0) > 0.55;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-neutral">
            Part D · POST /combos/evaluate
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8a94a6' }}>Layer 2 Combo Cannibalisation & Cross-Sell Model</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
          Combo Studio & Cannibalisation Guard
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8a94a6', marginTop: '3px' }}>
          Test meal pairing discounts while preventing the <strong>Cannibalisation Trap</strong> — where discounts erode gross margin on students who would have purchased both items at standard prices.
        </p>
      </div>

      {/* Main Grid: Controls on Left, Analysis on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Left Column: Pairing Configuration */}
        <div className="bento-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <Layers size={16} color="#34d399" />
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: 0 }}>Combo Pairing Inputs</h3>
          </div>

          {/* Main Item Select */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#8a94a6', display: 'block', marginBottom: '6px' }}>
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
            <label style={{ fontSize: '0.78rem', color: '#8a94a6', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>Combo Bundle Discount (%)</label>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8a94a6', marginTop: '2px' }}>
              <span>0% (Standalone)</span>
              <span>Guardrail Cap: {guardrails.combo_discount_cap_pct}%</span>
            </div>
          </div>

          {/* Day Context */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#8a94a6', display: 'block', marginBottom: '6px' }}>
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
            padding: '12px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface-inset)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Standalone Sum:</span>
              <span className="mono" style={{ textDecoration: 'line-through' }}>{formatINR(standaloneFullPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>Combo Offering Price:</span>
              <span className="mono" style={{ color: 'var(--accent-green)', fontSize: '1.05rem', fontWeight: 800 }}>{formatINR(bundlePrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <span>Student Savings:</span>
              <span className="mono">{formatINR(standaloneFullPrice - bundlePrice)} ({discountPct}%)</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Cannibalisation Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* Decision Status Panel */}
          {evaluation && (
            <div className="bento-card" style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderLeft: evaluation.status === 'apply'
                ? '4px solid var(--accent-green)'
                : evaluation.status === 'pilot'
                ? '4px solid var(--accent-amber)'
                : '4px solid var(--accent-rose)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusTag status={evaluation.status} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Gatekeeper Recommendation
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Probability Profit Improves: <strong className="mono" style={{ color: 'var(--accent-green)' }}>{formatRatioAsPct(evaluation.prob_profit_improves)}</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                {evaluation.reason}
              </p>
            </div>
          )}

          {/* Key Output Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
            <MetricCard
              title="Incremental Profit"
              range={evaluation?.incremental_profit_per_day}
              isCurrency={true}
              subtext="₹ / day net gain"
              color="var(--accent-green)"
            />

            <MetricCard
              title="Predicted Take Rate"
              range={evaluation?.take_rate}
              isCurrency={false}
              subtext="Share of main buyers"
              color="var(--accent-blue)"
            />

            <MetricCard
              title="Cannibalised Share"
              value={formatRatioAsPct(evaluation?.cannibalised_share || 0)}
              subtext="Would buy both anyway"
              color={isCannibalisationRisk ? 'var(--accent-rose)' : 'var(--text-primary)'}
              badge={isCannibalisationRisk ? <ShieldAlert size={14} color="var(--accent-rose)" /> : null}
            />

            <MetricCard
              title="Break-Even Take Rate"
              value={formatRatioAsPct(evaluation?.break_even_take_rate || 0)}
              subtext="Minimum threshold"
            />
          </div>

          {/* Volume Dynamics Breakdown */}
          <div className="bento-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.92rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
              <TrendingUp size={15} color="var(--accent-green)" />
              <span>Volume Dynamics & Cross-Sell Lift Drivers</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.78rem' }}>
              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-inset)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Incremental Add-On Lift</span>
                <strong className="mono" style={{ fontSize: '1.15rem', color: 'var(--accent-green)' }}>
                  +{evaluation?.addon_lift || 0} units/day
                </strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Additional snack units sold due to bundle incentive.
                </p>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-inset)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Main Traffic Spillover</span>
                <strong className="mono" style={{ fontSize: '1.15rem', color: 'var(--accent-blue)' }}>
                  +{evaluation?.main_traffic_lift || 0} units/day
                </strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Incremental student visits attracted by combo value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Affinity Suggestions Grid */}
      <div className="bento-card" style={{ padding: '1.25rem' }}>
        <SuggestionsDrawer
          suggestions={suggestions}
          items={items}
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>
    </div>
  );
};
