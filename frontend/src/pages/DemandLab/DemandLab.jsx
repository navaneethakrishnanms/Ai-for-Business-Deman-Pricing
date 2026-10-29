import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useDemandPredict } from '../../hooks/useDemandPredict';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { MetricCard } from '../../components/common/MetricCard';
import { RangeBadge } from '../../components/common/RangeBadge';
import { StatusTag } from '../../components/common/StatusTag';
import { DayTypeSelector } from '../../components/common/DayTypeSelector';
import { DemandProfitCurve } from '../../components/charts/DemandProfitCurve';
import { PriceSensitivityTable } from './PriceSensitivityTable';
import { formatINR, formatPct } from '../../utils/formatters';
import { 
  Sliders, 
  TrendingUp, 
  ShieldAlert
} from 'lucide-react';

export const DemandLab = ({ preselectedItemId }) => {
  const { items } = useMenu();
  const { guardrails } = useGuardrailsContext();
  const { prediction, loading, runPrediction } = useDemandPredict();

  // Selected item state
  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || (items[0]?.item_id || 'item_biryani'));
  const [price, setPrice] = useState(120);
  const [portionSizeG, setPortionSizeG] = useState(380);
  const [discountPct, setDiscountPct] = useState(0);
  const [dayType, setDayType] = useState('regular');
  const [activeTab, setActiveTab] = useState('chart');

  const currentItem = items.find(i => i.item_id === selectedItemId) || items[0];

  useEffect(() => {
    if (currentItem) {
      setPrice(currentItem.price);
      setPortionSizeG(currentItem.portion_size_g);
      setDiscountPct(0);
    }
  }, [selectedItemId]);

  useEffect(() => {
    if (selectedItemId && price) {
      runPrediction({
        item_id: selectedItemId,
        price: parseFloat(price),
        portion_size_g: parseInt(portionSizeG, 10),
        discount_pct: parseFloat(discountPct),
        day_type: dayType
      });
    }
  }, [selectedItemId, price, portionSizeG, discountPct, dayType, runPrediction]);

  // Delta calculations vs baseline
  const baselineProfit = prediction?.baseline?.profit || (currentItem ? currentItem.units_per_day * (currentItem.price - currentItem.cost) : 0);
  const currentPredProfit = prediction?.profit?.mean || baselineProfit;
  const profitDelta = currentPredProfit - baselineProfit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-neutral">
            Part B · POST /predict
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Layer 1 Demand Modeling & Elasticity</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Demand Lab & Elasticity Simulator
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
          Simulate single-dish price & portion variations with posterior uncertainty bounds [p10, p90] and guardrail enforcement.
        </p>
      </div>

      {/* Main Grid: Controls on Left, Visualizations & Metrics on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Left Column: Interactive Simulation Controls */}
        <div className="panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <Sliders size={15} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Simulation Parameters</h3>
          </div>

          {/* Item Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Selected Menu Item:
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{ width: '100%' }}
            >
              {items.map(item => (
                <option key={item.item_id} value={item.item_id}>
                  {item.name} ({item.kind.toUpperCase()}) — Current: {formatINR(item.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Slider & Number Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Proposed Unit Price</label>
              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINR(price, 0)}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(10, Math.round((currentItem?.cost || 20) * 0.9))}
              max={Math.round((currentItem?.price || 100) * 1.8)}
              step="1"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>Base: {formatINR(currentItem?.price || 0, 0)}</span>
              <span>Unit Cost: {formatINR(currentItem?.cost || 0, 0)}</span>
              <span>Cap: {formatINR(guardrails.student_price_cap, 0)}</span>
            </div>
          </div>

          {/* Portion Size Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Portion Size (grams)</label>
              <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {portionSizeG}g
              </span>
            </div>
            <input
              type="range"
              min={Math.round((currentItem?.portion_size_g || 200) * 0.6)}
              max={Math.round((currentItem?.portion_size_g || 200) * 1.5)}
              step="10"
              value={portionSizeG}
              onChange={(e) => setPortionSizeG(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>Default: {currentItem?.portion_size_g || 0}g</span>
              <span>Delta: {portionSizeG > (currentItem?.portion_size_g || 0) ? `+${portionSizeG - (currentItem?.portion_size_g || 0)}g` : `${portionSizeG - (currentItem?.portion_size_g || 0)}g`}</span>
            </div>
          </div>

          {/* Offer Discount % */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Promotion / Offer Discount (%)</label>
              <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {discountPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={discountPct}
              onChange={(e) => setDiscountPct(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Day Type Selector */}
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

          {/* Guardrail Violation Alerts */}
          {prediction?.flags && prediction.flags.length > 0 && (
            <div style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-rose-subtle)',
              border: '1px solid var(--accent-rose-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 600 }}>
                <ShieldAlert size={14} />
                <span>Active Guardrail Alerts</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {prediction.flags.map((flag, idx) => (
                  <StatusTag key={idx} status={flag} size="small" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Output Metrics & Demand Curve */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Key Output Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <MetricCard
              title="Predicted Demand"
              range={prediction?.units}
              isCurrency={false}
              unit=" units/d"
              subtext={`Baseline: ${prediction?.baseline?.units || 0} /day`}
            />

            <MetricCard
              title="Expected Revenue"
              range={prediction?.revenue}
              isCurrency={true}
              subtext={`Baseline: ${formatINR(prediction?.baseline?.revenue || 0, 0)}`}
              color="var(--accent-blue)"
            />

            <MetricCard
              title="Expected Profit"
              range={prediction?.profit}
              isCurrency={true}
              delta={Math.round(profitDelta)}
              subtext="vs Current Menu"
              color="var(--accent-emerald)"
            />

            <MetricCard
              title="Simulated Margin %"
              value={formatPct(prediction?.margin_pct || 0)}
              subtext={`Floor: ${guardrails.margin_floor_pct}%`}
              color={prediction?.margin_pct < guardrails.margin_floor_pct ? 'var(--accent-rose)' : 'var(--accent-emerald)'}
            />
          </div>

          {/* Elasticity Metadata Header */}
          <div className="panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={14} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Price Elasticity (price_effect):</span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {prediction?.price_effect?.mean ? Number(prediction.price_effect.mean).toFixed(2) : '-1.35'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                [90% CI: {prediction?.price_effect?.p10 ? Number(prediction.price_effect.p10).toFixed(2) : '-1.55'} to {prediction?.price_effect?.p90 ? Number(prediction.price_effect.p90).toFixed(2) : '-1.15'}]
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('chart')}
                style={{
                  backgroundColor: activeTab === 'chart' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: activeTab === 'chart' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === 'chart' ? '1px solid var(--border-medium)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                Chart View
              </button>
              <button
                onClick={() => setActiveTab('table')}
                style={{
                  backgroundColor: activeTab === 'table' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: activeTab === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === 'table' ? '1px solid var(--border-medium)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                Sensitivity Table
              </button>
            </div>
          </div>

          {/* Visualization or Sensitivity Table Panel */}
          <div className="panel" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h4 style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-secondary)' }}>
                Demand & Profit Response Curve across Allowed Price Band
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Posterior distribution with 90% confidence envelope
              </span>
            </div>

            {activeTab === 'chart' ? (
              <DemandProfitCurve
                curveData={prediction?.curve}
                currentPrice={currentItem?.price}
                proposedPrice={price}
              />
            ) : (
              <PriceSensitivityTable
                curveData={prediction?.curve}
                currentPrice={currentItem?.price}
                proposedPrice={price}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
