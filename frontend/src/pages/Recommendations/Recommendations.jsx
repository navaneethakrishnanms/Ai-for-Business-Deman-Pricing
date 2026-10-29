import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { useNotification } from '../../context/NotificationContext';
import { MetricCard } from '../../components/common/MetricCard';
import { RangeBadge } from '../../components/common/RangeBadge';
import { StatusTag } from '../../components/common/StatusTag';
import { FrontierCurve } from '../../components/charts/FrontierCurve';
import { PilotPlanCard } from './PilotPlanCard';
import { OverridesLogModal } from './OverridesLogModal';
import { Modal } from '../../components/common/Modal';
import { formatINR, formatRatioAsPct } from '../../utils/formatters';
import { 
  Check, 
  Edit3, 
  X, 
  History, 
  RefreshCw
} from 'lucide-react';

export const Recommendations = () => {
  const { items } = useMenu();
  const { guardrails } = useGuardrailsContext();
  const { notifySuccess, notifyError } = useNotification();
  const {
    recommendations,
    summary,
    frontier,
    overridesLog,
    loading,
    submitting,
    fetchRecommendations,
    recordDecision
  } = useRecommendations();

  const [filterStatus, setFilterStatus] = useState('all');
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [activeRecForAction, setActiveRecForAction] = useState(null);
  const [actionType, setActionType] = useState('edit');
  const [customValue, setCustomValue] = useState('');
  const [actionNote, setActionNote] = useState('');

  const getItemOrComboName = (id) => {
    const it = items.find(i => i.item_id === id);
    if (it) return it.name;
    return id;
  };

  const filteredRecs = recommendations.filter(rec => {
    if (filterStatus === 'all') return true;
    return rec.status.toLowerCase() === filterStatus;
  });

  const handleQuickApprove = async (rec) => {
    try {
      await recordDecision({
        rec_id: rec.rec_id,
        decision: 'approve',
        edited_value: null,
        note: `Approved recommendation ${rec.rec_id}`
      });
      notifySuccess(`Recommendation ${rec.rec_id} approved and applied.`);
    } catch (err) {
      notifyError('Failed to record approval');
    }
  };

  const handleOpenActionModal = (rec, type) => {
    setActiveRecForAction(rec);
    setActionType(type);
    setCustomValue(rec.proposed);
    setActionNote('');
  };

  const handleConfirmActionModal = async (e) => {
    e.preventDefault();
    if (!activeRecForAction) return;

    try {
      await recordDecision({
        rec_id: activeRecForAction.rec_id,
        decision: actionType,
        edited_value: actionType === 'edit' ? parseFloat(customValue) : null,
        note: actionNote || (actionType === 'edit' ? 'Owner custom modification' : 'Owner rejected proposal')
      });

      notifySuccess(`Decision recorded for ${activeRecForAction.rec_id}`);
      setActiveRecForAction(null);
    } catch (err) {
      notifyError('Failed to record decision');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setIsLogOpen(true)}
          className="btn-secondary"
          style={{ fontSize: '0.78rem' }}
        >
          <History size={14} />
          <span>Audit Overrides Log ({overridesLog.length})</span>
        </button>

        <button
          onClick={() => fetchRecommendations()}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.65rem' }}
          title="Re-run Multi-Objective Optimizer"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>


      {/* Top Section: KPI Summaries & Pareto Frontier Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* KPI Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MetricCard
            title="Total Daily Profit Delta (Expected)"
            range={summary?.profit_delta || (summary?.estimated_profit_delta !== undefined ? { mean: summary.estimated_profit_delta, p10: Math.round(summary.estimated_profit_delta * 0.85), p90: Math.round(summary.estimated_profit_delta * 1.15) } : null)}
            isCurrency={true}
            subtext="Net system gain across proposed menu"
            color="var(--accent-green)"
          />

          <div className="bento-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Student Affordability Guarantee
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Baseline Reach:</span>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatRatioAsPct(summary?.coverage_today ?? summary?.coverage_before ?? 0.74)}
                </div>
              </div>
              <div style={{ fontSize: '1.35rem', color: 'var(--accent-green)' }}>→</div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Optimized Reach:</span>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {formatRatioAsPct(summary?.coverage_optimised ?? summary?.coverage_after ?? guardrails.coverage_target)}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Contract guarantee: ≥{Math.round(guardrails.coverage_target * 100)}% of campus students can afford a complete meal under budget.
            </p>
          </div>
        </div>

        {/* Pareto Frontier Curve Panel */}
        <div className="bento-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Profit vs Affordability Frontier Curve
            </h4>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              Pareto Optimal Boundary
            </span>
          </div>
          <FrontierCurve frontier={frontier} currentCoverage={summary?.coverage_optimised ?? summary?.coverage_after} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all', label: `All Proposals (${recommendations.length})` },
            { id: 'apply', label: `Apply Ready (${recommendations.filter(r => r.status === 'apply').length})` },
            { id: 'pilot', label: `Pilot Arms (${recommendations.filter(r => r.status === 'pilot').length})` },
            { id: 'hold', label: `On Hold (${recommendations.filter(r => r.status === 'hold').length})` }
          ].map(tab => {
            const isTabActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  backgroundColor: isTabActive ? 'var(--nav-btn-active-bg)' : 'transparent',
                  color: isTabActive ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
                  border: isTabActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          Changes require owner confirmation via Owner Token
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredRecs.map((rec) => {
          const targetName = rec.name || getItemOrComboName(rec.item_id || rec.combo_id);
          const isCombo = rec.kind === 'combo';
          const isPortion = !isCombo && rec.proposed_portion_g && rec.current_portion_g && rec.proposed_portion_g !== rec.current_portion_g;
          
          const currentVal = isCombo
            ? rec.current_discount_pct
            : isPortion
            ? rec.current_portion_g
            : (rec.current_price ?? rec.current);
            
          const proposedVal = isCombo
            ? rec.proposed_discount_pct
            : isPortion
            ? rec.proposed_portion_g
            : (rec.proposed_price ?? rec.proposed);
            
          const unitSymbol = isCombo ? '%' : isPortion ? 'g' : '₹';
          const profitDelta = rec.incremental_profit || rec.expected_profit_delta;

          return (
            <div
              key={rec.rec_id}
              className="bento-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                borderLeft: rec.status === 'apply'
                  ? '4px solid var(--accent-green)'
                  : rec.status === 'pilot'
                  ? '4px solid var(--accent-amber)'
                  : '4px solid var(--accent-rose)'
              }}
            >
              {/* Row 1: Status, Rec ID, Kind, Target Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusTag status={rec.status} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {rec.rec_id}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--bg-surface-inset)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {rec.kind}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                      {targetName}
                    </h4>
                  </div>
                </div>

                {/* Expected Profit Delta Badge */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Expected Daily Delta</span>
                  <RangeBadge range={profitDelta} isCurrency={true} />
                </div>
              </div>

              {/* Row 2: Value Transition & Guardrails Met */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface-inset)',
                border: '1px solid var(--border-subtle)',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Current → Proposed</span>
                  <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {!isCombo && !isPortion ? formatINR(currentVal) : `${currentVal}${unitSymbol}`}
                    {' '}→{' '}
                    <span style={{ color: 'var(--accent-green)' }}>
                      {!isCombo && !isPortion ? formatINR(proposedVal) : `${proposedVal}${unitSymbol}`}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>Confidence Score</span>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: rec.prob_improves >= 0.8 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                    {formatRatioAsPct(rec.prob_improves)} probability of profit gain
                  </div>
                </div>

                {rec.guardrails_met && rec.guardrails_met.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Guardrails Satisfied</span>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {rec.guardrails_met.map((gm, gIdx) => (
                        <span
                          key={gIdx}
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--accent-green)',
                            backgroundColor: 'var(--accent-green-subtle)',
                            border: '1px solid var(--accent-green-border)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '1px 6px'
                          }}
                        >
                          ✓ {gm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: AI Explanation */}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                {rec.reason}
              </p>

              {/* Pilot Plan Arms (if pilot) */}
              {rec.pilot_plan && <PilotPlanCard pilotPlan={rec.pilot_plan} />}

              {/* Row 4: Owner Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleOpenActionModal(rec, 'reject')}
                  className="btn-secondary"
                  disabled={submitting}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderColor: 'rgba(248, 113, 113, 0.3)',
                    color: 'var(--accent-rose)'
                  }}
                >
                  <X size={12} />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleOpenActionModal(rec, 'edit')}
                  className="btn-secondary"
                  disabled={submitting}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Edit3 size={12} />
                  <span>Edit Value</span>
                </button>

                <button
                  onClick={() => handleQuickApprove(rec)}
                  className="btn-primary"
                  disabled={submitting}
                  style={{ fontSize: '0.75rem', padding: '4px 14px' }}
                >
                  <Check size={12} />
                  <span>{rec.status === 'pilot' ? 'Approve 7d Pilot Arm' : 'Approve & Apply'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Reject Modal */}
      {activeRecForAction && (
        <Modal
          isOpen={Boolean(activeRecForAction)}
          onClose={() => setActiveRecForAction(null)}
          title={actionType === 'edit' ? `Override Proposal: ${activeRecForAction.rec_id}` : `Reject Proposal: ${activeRecForAction.rec_id}`}
          subtitle="Records your decision to the system audit log"
          maxWidth="500px"
        >
          <form onSubmit={handleConfirmActionModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {actionType === 'edit' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Owner Overridden Value:
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Note for Policy Learning Cycle:
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                placeholder="Reason for modifying or rejecting this recommendation..."
                style={{
                  width: '100%',
                  resize: 'vertical',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveRecForAction(null)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ fontSize: '0.78rem' }}
              >
                Save Decision
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Overrides Log Modal */}
      <OverridesLogModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        overrides={overridesLog}
      />
    </div>
  );
};
