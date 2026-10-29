import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useScenarios } from '../../hooks/useScenarios';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { MetricCard } from '../../components/common/MetricCard';
import { RangeBadge } from '../../components/common/RangeBadge';
import { StatusTag } from '../../components/common/StatusTag';
import { ScenarioComparisonChart } from '../../components/charts/ScenarioComparisonChart';
import { ScenarioBuilderModal } from './ScenarioBuilderModal';
import { formatINR, formatPct, formatDelta } from '../../utils/formatters';
import { 
  TrendingUp, 
  Plus, 
  BarChart3
} from 'lucide-react';

export const ScenarioCompare = ({ initialCustomScenario }) => {
  const { items } = useMenu();
  const { guardrails } = useGuardrailsContext();
  const { results, loading, compare } = useScenarios();

  const [scenariosList, setScenariosList] = useState([
    {
      name: 'Affordability & Volume (Student First)',
      item_changes: [
        { item_id: 'item_dosa', price: 38.0, portion_size_g: 250 },
        { item_id: 'item_veg_meals', price: 65.0, portion_size_g: 500 }
      ],
      combo_changes: []
    },
    {
      name: 'Margin Maximization (AI Recommended)',
      item_changes: [
        { item_id: 'item_dosa', price: 44.0, portion_size_g: 250 },
        { item_id: 'item_biryani', price: 95.0, portion_size_g: 400 }
      ],
      combo_changes: []
    }
  ]);

  const [dayTypeMix, setDayTypeMix] = useState({
    regular: 0.60,
    exam: 0.15,
    weekend: 0.20,
    event: 0.05
  });

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  useEffect(() => {
    if (initialCustomScenario && !scenariosList.some(s => s.name === initialCustomScenario.name)) {
      setScenariosList(prev => [initialCustomScenario, ...prev]);
    }
  }, [initialCustomScenario]);

  useEffect(() => {
    compare({
      scenarios: scenariosList,
      day_type_mix: dayTypeMix
    });
  }, [scenariosList, dayTypeMix, compare]);

  const handleAddScenario = (newScenario) => {
    setScenariosList(prev => [...prev, newScenario]);
  };

  const handleRemoveScenario = (index) => {
    setScenariosList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-neutral">
              Part C · POST /scenarios/compare
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-Scenario Comparative Decision Matrix</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Scenario Compare & Trade-Off Analysis
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            Benchmark Today's menu baseline against candidate pricing & combo scenarios across semester footfall distributions.
          </p>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="btn-primary"
          style={{ fontSize: '0.8rem' }}
        >
          <Plus size={15} />
          <span>New Test Scenario</span>
        </button>
      </div>

      {/* Comparison Chart */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Revenue & Profit Benchmarking</h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Baseline (Today) compared against candidate policy shifts
          </span>
        </div>
        <ScenarioComparisonChart results={results} />
      </div>

      {/* Results Comparison Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            Evaluated Scenarios ({results.length})
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Posterior confidence intervals, student affordability coverage, and downside risk
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {results.map((res, idx) => {
            const isToday = idx === 0;
            const isLossRisk = res.risk_prob_below_today > 0.25;

            return (
              <div
                key={idx}
                className={isToday ? 'panel-elevated' : 'panel'}
                style={{
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  borderTop: isToday ? '3px solid var(--accent-blue)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Scenario Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isToday ? 'var(--accent-blue-subtle)' : 'rgba(255, 255, 255, 0.05)',
                      color: isToday ? 'var(--accent-blue)' : 'var(--text-muted)',
                      border: isToday ? '1px solid var(--accent-blue-border)' : '1px solid var(--border-subtle)'
                    }}>
                      {isToday ? 'BASELINE (TODAY)' : `CANDIDATE #${idx}`}
                    </span>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                      {res.scenario_name}
                    </h4>
                  </div>

                  {!isToday && (
                    <button
                      onClick={() => handleRemoveScenario(idx - 1)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Primary Financial Numbers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Daily Profit Range</span>
                    <RangeBadge range={res.profit} isCurrency={true} />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Daily Revenue Range</span>
                    <RangeBadge range={res.revenue} isCurrency={true} />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Demand Units</span>
                    <RangeBadge range={res.units} isCurrency={false} unit="/d" />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Scenario Margin %</span>
                    <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: res.margin_pct < guardrails.margin_floor_pct ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {formatPct(res.margin_pct)}
                    </div>
                  </div>
                </div>

                {/* Delta vs Today */}
                {!isToday && res.delta_vs_today && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: res.delta_vs_today.profit >= 0 ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
                    border: res.delta_vs_today.profit >= 0 ? '1px solid var(--accent-emerald-border)' : '1px solid var(--accent-rose-border)'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Profit Delta vs Today:</span>
                    <span className="mono" style={{
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: res.delta_vs_today.profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                    }}>
                      {formatDelta(res.delta_vs_today.profit, true)}/day
                    </span>
                  </div>
                )}

                {/* Student Coverage Breakdown */}
                {res.coverage && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student Affordability Coverage:</span>
                      <strong className="mono" style={{ color: 'var(--text-primary)' }}>
                        {Math.round(res.coverage.overall * 100)}% of students
                      </strong>
                    </div>
                    {/* Clean Progress Bar */}
                    <div style={{ height: '5px', width: '100%', borderRadius: '2px', backgroundColor: 'var(--bg-canvas)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${res.coverage.overall * 100}%`,
                        backgroundColor: res.coverage.overall >= guardrails.coverage_target ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                      <span>Tight: {Math.round((res.coverage.tight || 0.5) * 100)}%</span>
                      <span>Mid: {Math.round((res.coverage.mid || 0.75) * 100)}%</span>
                      <span>Flexible: {Math.round((res.coverage.flexible || 0.95) * 100)}%</span>
                    </div>
                  </div>
                )}

                {/* Risk and Warnings Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Downside Risk: </span>
                    <strong className="mono" style={{ color: isLossRisk ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {Math.round(res.risk_prob_below_today * 100)}% below Today
                    </strong>
                  </div>

                  {res.flags && res.flags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {res.flags.map((flag, fIdx) => (
                        <StatusTag key={fIdx} status={flag} size="small" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Builder Modal */}
      <ScenarioBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        items={items}
        onAddScenario={handleAddScenario}
      />
    </div>
  );
};
