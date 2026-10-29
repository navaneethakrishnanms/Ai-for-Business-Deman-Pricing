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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
      <div className="bento-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--accent-green)" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Revenue & Profit Benchmarking</h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Baseline (Today) compared against candidate policy shifts
          </span>
        </div>
        <ScenarioComparisonChart results={results} />
      </div>

      {/* Results Comparison Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Evaluated Scenarios ({results.length})
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Posterior confidence intervals, student affordability coverage, and downside risk
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {results.map((res, idx) => {
            const isToday = idx === 0;
            const isLossRisk = res.risk_prob_below_today > 0.25;
            const scenarioTitle = res.name || res.scenario_name || `Scenario #${idx}`;

            return (
              <div
                key={idx}
                className="bento-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  borderTop: isToday ? '3px solid var(--accent-green)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Scenario Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isToday ? 'var(--accent-green-subtle)' : 'var(--bg-surface-inset)',
                      color: isToday ? 'var(--accent-green)' : 'var(--text-secondary)',
                      border: isToday ? '1px solid var(--accent-green-border)' : '1px solid var(--border-subtle)'
                    }}>
                      {isToday ? 'BASELINE (TODAY)' : `CANDIDATE #${idx}`}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 0 0' }}>
                      {scenarioTitle}
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
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-surface-inset)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Daily Profit Range</span>
                    <RangeBadge range={res.profit} isCurrency={true} />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Daily Revenue Range</span>
                    <RangeBadge range={res.revenue} isCurrency={true} />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Demand Units</span>
                    <RangeBadge range={res.units} isCurrency={false} unit="/d" />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Scenario Margin %</span>
                    <div className="mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: res.margin_pct < guardrails.margin_floor_pct ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
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
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: res.delta_vs_today.profit >= 0 ? 'var(--accent-green-subtle)' : 'var(--accent-rose-subtle)',
                    border: res.delta_vs_today.profit >= 0 ? '1px solid var(--accent-green-border)' : '1px solid rgba(248, 113, 113, 0.25)'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Profit Delta vs Today:</span>
                    <span className="mono" style={{
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      color: res.delta_vs_today.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'
                    }}>
                      {formatDelta(res.delta_vs_today.profit, true)}/day
                    </span>
                  </div>
                )}

                {/* Student Coverage Breakdown */}
                {res.coverage && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Student Affordability Coverage:</span>
                      <strong className="mono" style={{ color: 'var(--text-primary)' }}>
                        {Math.round(res.coverage.overall * 100)}% of students
                      </strong>
                    </div>
                    {/* Clean Progress Bar with Pill Style */}
                    <div style={{ height: '7px', width: '100%', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-surface-inset)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${res.coverage.overall * 100}%`,
                        backgroundColor: res.coverage.overall >= guardrails.coverage_target ? 'var(--accent-green)' : 'var(--accent-amber)',
                        borderRadius: 'var(--radius-pill)'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                      <span>Tight: {Math.round((res.coverage.tight || 0.5) * 100)}%</span>
                      <span>Mid: {Math.round((res.coverage.mid || 0.75) * 100)}%</span>
                      <span>Flexible: {Math.round((res.coverage.flexible || 0.95) * 100)}%</span>
                    </div>
                  </div>
                )}

                {/* Risk and Warnings Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>Downside Risk: </span>
                    <strong className="mono" style={{ color: isLossRisk ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
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
