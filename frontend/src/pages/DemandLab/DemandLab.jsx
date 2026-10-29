import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useDemandPredict } from '../../hooks/useDemandPredict';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusTag } from '../../components/common/StatusTag';
import { DayTypeSelector } from '../../components/common/DayTypeSelector';
import { DemandProfitCurve } from '../../components/charts/DemandProfitCurve';
import { PriceSensitivityTable } from './PriceSensitivityTable';
import { formatINR, formatPct } from '../../utils/formatters';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { 
  Sliders, 
  TrendingUp, 
  ShieldAlert,
  Info
} from 'lucide-react';

export const DemandLab = ({ preselectedItemId }) => {
  const { items } = useMenu();
  const { guardrails } = useGuardrailsContext();
  const { prediction, loading, runPrediction } = useDemandPredict();

  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || (items[0]?.item_id || ''));
  const [price, setPrice] = useState(0);
  const [portionSizeG, setPortionSizeG] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [dayType, setDayType] = useState('regular');
  const [activeTab, setActiveTab] = useState('chart');

  // Find currently active dish from live backend items
  const currentItem = items.find(i => i.item_id === selectedItemId) || items[0];

  // Initialize or update parameters when selected item changes
  useEffect(() => {
    if (currentItem) {
      if (!selectedItemId || selectedItemId !== currentItem.item_id) {
        setSelectedItemId(currentItem.item_id);
      }
      setPrice(currentItem.price);
      setPortionSizeG(currentItem.portion_size_g);
      setDiscountPct(0);
    }
  }, [currentItem?.item_id]);

  // Sync if preselectedItemId prop changes from outside
  useEffect(() => {
    if (preselectedItemId && items.length > 0) {
      const match = items.find(i => i.item_id === preselectedItemId);
      if (match) {
        setSelectedItemId(match.item_id);
        setPrice(match.price);
        setPortionSizeG(match.portion_size_g);
        setDiscountPct(0);
      }
    }
  }, [preselectedItemId, items]);

  // Execute live prediction call whenever parameters change
  useEffect(() => {
    if (selectedItemId && price > 0) {
      runPrediction({
        item_id: selectedItemId,
        price: parseFloat(price),
        portion_size_g: parseInt(portionSizeG || currentItem?.portion_size_g || 200, 10),
        discount_pct: parseFloat(discountPct || 0),
        day_type: dayType
      });
    }
  }, [selectedItemId, price, portionSizeG, discountPct, dayType, runPrediction]);

  // Real profit deltas calculated against baseline from AI service or live item
  const baselineProfit = prediction?.baseline?.profit !== undefined
    ? prediction.baseline.profit
    : (currentItem ? (currentItem.units_per_day || 0) * (currentItem.price - currentItem.cost) : 0);

  const currentPredProfit = prediction?.profit?.mean !== undefined ? prediction.profit.mean : baselineProfit;
  const profitDelta = currentPredProfit - baselineProfit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Main Grid: Controls on Left, Visualizations on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

        
        {/* Left Column: Interactive Simulation Controls */}
        <div className="bento-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--accent-green)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Simulation Parameters
              </h3>
            </div>
            {loading && (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                Calculating...
              </span>
            )}
          </div>

          {/* Searchable Item Selector with Dropdown */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Selected Menu Item:
            </label>
            <SearchableSelect
              items={items}
              value={selectedItemId}
              onChange={(newId) => {
                setSelectedItemId(newId);
                const it = items.find(i => i.item_id === newId);
                if (it) {
                  setPrice(it.price);
                  setPortionSizeG(it.portion_size_g);
                  setDiscountPct(0);
                }
              }}
              placeholder="Search or select a dish..."
            />
          </div>

          {/* Price Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Proposed Unit Price</label>
              <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {formatINR(price, 0)}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(5, Math.round((currentItem?.cost || 20) * 0.8))}
              max={Math.round((currentItem?.price || 100) * 1.8)}
              step="1"
              value={price || currentItem?.price || 50}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--accent-green)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              <span>Base: <strong>{formatINR(currentItem?.price || 0, 0)}</strong></span>
              <span>Unit Cost: <strong>{formatINR(currentItem?.cost || 0, 0)}</strong></span>
              <span>Student Cap: <strong>{formatINR(guardrails?.student_price_cap || 100, 0)}</strong></span>
            </div>
          </div>

          {/* Portion Size Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Portion Grammage</label>
              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {portionSizeG}g
              </span>
            </div>
            <input
              type="range"
              min={Math.round((currentItem?.portion_size_g || 200) * 0.5)}
              max={Math.round((currentItem?.portion_size_g || 200) * 1.6)}
              step="10"
              value={portionSizeG || currentItem?.portion_size_g || 200}
              onChange={(e) => setPortionSizeG(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--accent-blue)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              <span>Standard: <strong>{currentItem?.portion_size_g || 0}g</strong></span>
              <span>
                Delta: <strong style={{ color: portionSizeG >= (currentItem?.portion_size_g || 0) ? 'var(--accent-blue)' : 'var(--accent-rose)' }}>
                  {portionSizeG >= (currentItem?.portion_size_g || 0) 
                    ? `+${portionSizeG - (currentItem?.portion_size_g || 0)}g` 
                    : `${portionSizeG - (currentItem?.portion_size_g || 0)}g`}
                </strong>
              </span>
            </div>
          </div>

          {/* Offer Discount % */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Promotional Discount (%)</label>
              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {discountPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={guardrails?.combo_discount_cap_pct || 30}
              step="1"
              value={discountPct}
              onChange={(e) => setDiscountPct(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--accent-amber)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              <span>Zero Discount (0%)</span>
              <span>Discount Cap: <strong>{guardrails?.combo_discount_cap_pct || 20}%</strong></span>
            </div>
          </div>

          {/* Day Type Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Operating Context (Footfall Scenario):
            </label>
            <DayTypeSelector
              selected={dayType}
              onChange={setDayType}
              fairnessActive={guardrails?.fairness_mode}
            />
          </div>

          {/* Guardrail Violation Alerts */}
          {prediction?.flags && prediction.flags.length > 0 && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 700 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* Key Output Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
            <MetricCard
              title="Predicted Demand"
              range={prediction?.units}
              isCurrency={false}
              unit=" units/d"
              subtext={`Baseline: ${Math.round(prediction?.baseline?.units || currentItem?.units_per_day || 0)} /day`}
              color="var(--accent-blue)"
            />

            <MetricCard
              title="Expected Revenue"
              range={prediction?.revenue}
              isCurrency={true}
              subtext={`Baseline: ${formatINR(prediction?.baseline?.revenue || (currentItem ? currentItem.price * currentItem.units_per_day : 0), 0)}`}
              color="var(--text-primary)"
            />

            <MetricCard
              title="Expected Profit"
              range={prediction?.profit}
              isCurrency={true}
              delta={Math.round(profitDelta)}
              subtext="vs Current Menu"
              color="var(--accent-green)"
            />

            <MetricCard
              title="Simulated Margin %"
              value={formatPct(prediction?.margin_pct || 0)}
              subtext={`Floor: ${guardrails?.margin_floor_pct || 20}%`}
              color={prediction?.margin_pct < (guardrails?.margin_floor_pct || 20) ? 'var(--accent-rose)' : 'var(--accent-green)'}
            />
          </div>

          {/* Elasticity Metadata Header */}
          <div className="bento-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <TrendingUp size={15} color="var(--accent-green)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Price Elasticity (price_effect):</span>
              <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '0.92rem' }}>
                {prediction?.price_effect?.mean !== undefined ? Number(prediction.price_effect.mean).toFixed(2) : '—'}
              </span>
              {prediction?.price_effect?.p10 !== undefined && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  [90% CI: {Number(prediction.price_effect.p10).toFixed(2)} to {Number(prediction.price_effect.p90).toFixed(2)}]
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-surface-inset)', padding: '2px', borderRadius: 'var(--radius-pill)' }}>
              <button
                onClick={() => setActiveTab('chart')}
                style={{
                  backgroundColor: activeTab === 'chart' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: activeTab === 'chart' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'chart' ? 'var(--shadow-card)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Chart View
              </button>
              <button
                onClick={() => setActiveTab('table')}
                style={{
                  backgroundColor: activeTab === 'table' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: activeTab === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'table' ? 'var(--shadow-card)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Sensitivity Table
              </button>
            </div>
          </div>

          {/* Visualization or Sensitivity Table Panel */}
          <div className="bento-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '4px' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Demand & Profit Response Curve across Allowed Price Band
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
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
