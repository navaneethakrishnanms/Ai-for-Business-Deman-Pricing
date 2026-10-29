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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-neutral">
              Part E · POST /recommend & POST /overrides
            </span>
            <span style={{ fontSize: '0.72rem', color: '#8a94a6' }}>Layer 4/5 Multi-Objective Optimizer</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Policy Recommendations & Pilot Gate
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#8a94a6', marginTop: '3px' }}>
            Confidence-gated actions (Apply ≥ 0.80, Pilot, Hold) optimizing cafeteria margin while maintaining student meal affordability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
      </div>

      {/* Top Section: KPI Summaries & Pareto Frontier Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* KPI Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MetricCard
            title="Total Daily Profit Delta (Expected)"
            range={summary?.profit_delta}
            isCurrency={true}
            subtext="Net system gain across proposed menu"
            color="#34d399"
          />

          <div className="bento-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Student Affordability Guarantee
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#8a94a6' }}>Baseline Reach:</span>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                  {formatRatioAsPct(summary?.coverage_before || 0.74)}
                </div>
              </div>
              <div style={{ fontSize: '1.35rem', color: '#34d399' }}>→</div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#8a94a6' }}>Optimized Reach:</span>
                <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
                  {formatRatioAsPct(summary?.coverage_after || guardrails.coverage_target)}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#8a94a6', margin: '4px 0 0 0' }}>
              Contract guarantee: ≥{Math.round(guardrails.coverage_target * 100)}% of campus students can afford a complete meal under budget.
            </p>
          </div>
        </div>

        {/* Pareto Frontier Curve Panel */}
        <div className="bento-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h4 style={{ fontSize: '0.92rem', margin: 0, color: '#ffffff' }}>
              Profit vs Affordability Frontier Curve
            </h4>
            <span style={{ fontSize: '0.68rem', color: '#8a94a6' }}>
              Pareto Optimal Boundary
            </span>
          </div>
          <FrontierCurve frontier={frontier} currentCoverage={summary?.coverage_after} />
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
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                backgroundColor: filterStatus === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
                color: filterStatus === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: filterStatus === tab.id ? '1px solid var(--border-medium)' : '1px solid transparent',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.72rem', color: '#8a94a6' }}>
          Changes require owner confirmation via Owner Token
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredRecs.map((rec) => {
          const targetName = getItemOrComboName(rec.item_id || rec.combo_id);
          const unitSymbol = rec.kind === 'price' ? '₹' : rec.kind === 'portion' ? 'g' : '%';

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
                  ? '4px solid #34d399'
                  : rec.status === 'pilot'
                  ? '4px solid #fbbf24'
                  : '4px solid #f87171'
              }}
            >
              {/* Row 1: Status, Rec ID, Kind, Target Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusTag status={rec.status} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '0.7rem', color: '#8a94a6' }}>
                        {rec.rec_id}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#8a94a6'
                      }}>
                        {rec.kind}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '2px 0 0 0' }}>
                      {targetName}
                    </h4>
                  </div>
                </div>

                {/* Expected Profit Delta Badge */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: '#8a94a6', display: 'block' }}>Expected Daily Delta</span>
                  <RangeBadge range={rec.expected_profit_delta} isCurrency={true} />
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
                    {rec.kind === 'price' ? formatINR(rec.current) : `${rec.current}${unitSymbol}`}
                    {' '}→{' '}
                    <span style={{ color: 'var(--accent-green)' }}>
                      {rec.kind === 'price' ? formatINR(rec.proposed) : `${rec.proposed}${unitSymbol}`}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', color: '#8a94a6', display: 'block' }}>Confidence Score</span>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: rec.prob_improves >= 0.8 ? '#34d399' : '#fbbf24' }}>
                    {formatRatioAsPct(rec.prob_improves)} probability of profit gain
                  </div>
                </div>

                {rec.guardrails_met && rec.guardrails_met.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#8a94a6', display: 'block', marginBottom: '2px' }}>Guardrails Satisfied</span>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {rec.guardrails_met.map((gm, gIdx) => (
                        <span
                          key={gIdx}
                          style={{
                            fontSize: '0.65rem',
                            color: '#34d399',
                            backgroundColor: 'rgba(52, 211, 153, 0.12)',
                            border: '1px solid rgba(52, 211, 153, 0.25)',
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
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: '1.45' }}>
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
                    color: '#f87171'
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
          subtitle="Records your decision to the system audit trail (/overrides)"
          maxWidth="500px"
        >
          <form onSubmit={handleConfirmActionModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {actionType === 'edit' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                  Owner Overridden Value:
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                Note for Policy Learning Cycle:
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                placeholder="Reason for modifying or rejecting this recommendation..."
                style={{ width: '100%', resize: 'vertical' }}
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
