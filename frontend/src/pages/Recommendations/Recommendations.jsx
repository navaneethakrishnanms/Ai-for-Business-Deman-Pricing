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

  // Edit / Reject action modal state
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
      notifySuccess(`Recommendation ${rec.rec_id} approved and applied to menu.`);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-neutral">
              Part E · POST /recommend & POST /overrides
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Layer 4/5 Multi-Objective Optimizer</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Policy Recommendations & Pilot Gatekeeper
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* KPI Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <MetricCard
            title="Total Daily Profit Delta (Expected)"
            range={summary?.profit_delta}
            isCurrency={true}
            subtext="Net system gain across proposed menu"
            color="var(--accent-emerald)"
          />

          <div className="panel" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Student Affordability Guarantee
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Baseline Reach:</span>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatRatioAsPct(summary?.coverage_before || 0.74)}
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>→</div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Optimized Reach:</span>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {formatRatioAsPct(summary?.coverage_after || guardrails.coverage_target)}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Contract guarantee: ≥{Math.round(guardrails.coverage_target * 100)}% of campus students can afford a complete meal under budget.
            </p>
          </div>
        </div>

        {/* Pareto Frontier Curve Panel */}
        <div className="panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-secondary)' }}>
              Profit vs Affordability Frontier Curve
            </h4>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
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
                color: filterStatus === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: filterStatus === tab.id ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: filterStatus === tab.id ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Changes require owner confirmation via Owner Token
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredRecs.map((rec) => {
          const targetName = getItemOrComboName(rec.item_id || rec.combo_id);
          const unitSymbol = rec.kind === 'price' ? '₹' : rec.kind === 'portion' ? 'g' : '%';

          return (
            <div
              key={rec.rec_id}
              className="panel"
              style={{
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                borderLeft: rec.status === 'apply'
                  ? '3px solid var(--accent-emerald)'
                  : rec.status === 'pilot'
                  ? '3px solid var(--accent-amber)'
                  : '3px solid var(--accent-rose)'
              }}
            >
              {/* Row 1: Status, Rec ID, Kind, Target Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusTag status={rec.status} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {rec.rec_id}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)'
                      }}>
                        {rec.kind}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                      {targetName}
                    </h4>
                  </div>
                </div>

                {/* Expected Profit Delta Badge */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Expected Daily Delta</span>
                  <RangeBadge range={rec.expected_profit_delta} isCurrency={true} />
                </div>
              </div>

              {/* Row 2: Value Transition & Guardrails Met */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Current → Proposed</span>
                  <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rec.kind === 'price' ? formatINR(rec.current) : `${rec.current}${unitSymbol}`}
                    {' '}→{' '}
                    <span style={{ color: 'var(--accent-emerald)' }}>
                      {rec.kind === 'price' ? formatINR(rec.proposed) : `${rec.proposed}${unitSymbol}`}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Confidence Score</span>
                  <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: rec.prob_improves >= 0.8 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                    {formatRatioAsPct(rec.prob_improves)} probability of profit gain
                  </div>
                </div>

                {rec.guardrails_met && rec.guardrails_met.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Guardrails Satisfied</span>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {rec.guardrails_met.map((gm, gIdx) => (
                        <span
                          key={gIdx}
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--accent-emerald)',
                            backgroundColor: 'var(--accent-emerald-subtle)',
                            border: '1px solid var(--accent-emerald-border)',
                            borderRadius: 'var(--radius-xs)',
                            padding: '1px 4px'
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: '1.45' }}>
                {rec.reason}
              </p>

              {/* Pilot Plan Arms (if pilot) */}
              {rec.pilot_plan && <PilotPlanCard pilotPlan={rec.pilot_plan} />}

              {/* Row 4: Owner Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleOpenActionModal(rec, 'reject')}
                  className="btn-danger"
                  disabled={submitting}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  <X size={12} />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleOpenActionModal(rec, 'edit')}
                  className="btn-secondary"
                  disabled={submitting}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  <Edit3 size={12} />
                  <span>Edit Value</span>
                </button>

                <button
                  onClick={() => handleQuickApprove(rec)}
                  className="btn-primary"
                  disabled={submitting}
                  style={{ fontSize: '0.75rem', padding: '3px 10px' }}
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
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
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
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
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
