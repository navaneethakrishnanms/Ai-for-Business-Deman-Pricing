import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { useNotification } from '../../context/NotificationContext';
import { GUARDRAIL_DESCRIPTIONS } from '../../constants/guardrailDefaults';
import { Save } from 'lucide-react';

export const GuardrailsModal = ({ isOpen, onClose }) => {
  const { guardrails, updateGuardrails, isLoading } = useGuardrailsContext();
  const { notifySuccess, notifyError } = useNotification();

  const [form, setForm] = useState(guardrails);

  useEffect(() => {
    setForm(guardrails);
  }, [guardrails, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const result = await updateGuardrails(form);
    if (result && result.success) {
      notifySuccess('Owner guardrails saved successfully');
      onClose();
    } else {
      notifyError('Failed to save guardrails');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Owner Guardrails Configuration"
      subtitle="Defines hard algorithmic bounds that the pricing and combo models must respect"
      maxWidth="620px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Margin Floor % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Gross Margin Floor (%)</label>
            <span className="mono" style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
              {form.margin_floor_pct}%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {GUARDRAIL_DESCRIPTIONS.margin_floor_pct}
          </p>
          <input
            type="range"
            min="10"
            max="40"
            step="0.5"
            value={form.margin_floor_pct}
            onChange={(e) => handleChange('margin_floor_pct', parseFloat(e.target.value))}
          />
        </div>

        {/* Max Weekly Change % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Maximum Weekly Price Delta (%)</label>
            <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.9rem' }}>
              {form.max_weekly_change_pct}%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {GUARDRAIL_DESCRIPTIONS.max_weekly_change_pct}
          </p>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={form.max_weekly_change_pct}
            onChange={(e) => handleChange('max_weekly_change_pct', parseFloat(e.target.value))}
          />
        </div>

        {/* Student Price Cap ₹ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Student Single Meal Cap (₹)</label>
            <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem' }}>
              ₹{form.student_price_cap}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {GUARDRAIL_DESCRIPTIONS.student_price_cap}
          </p>
          <input
            type="number"
            min="50"
            max="200"
            value={form.student_price_cap}
            onChange={(e) => handleChange('student_price_cap', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Coverage Target (0 to 1) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Student Affordability Reach Target</label>
            <span className="mono" style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
              {Math.round(form.coverage_target * 100)}%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {GUARDRAIL_DESCRIPTIONS.coverage_target}
          </p>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.01"
            value={form.coverage_target}
            onChange={(e) => handleChange('coverage_target', parseFloat(e.target.value))}
          />
        </div>

        {/* Combo Discount Cap % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Combo Discount Ceiling (%)</label>
            <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.9rem' }}>
              {form.combo_discount_cap_pct}%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {GUARDRAIL_DESCRIPTIONS.combo_discount_cap_pct}
          </p>
          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={form.combo_discount_cap_pct}
            onChange={(e) => handleChange('combo_discount_cap_pct', parseFloat(e.target.value))}
          />
        </div>

        {/* Fairness Mode Toggle */}
        <div style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Fairness Policy (Anti-Surge on Exam/Event Days)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {GUARDRAIL_DESCRIPTIONS.fairness_mode}
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.fairness_mode}
            onChange={(e) => handleChange('fairness_mode', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.4rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ fontSize: '0.8rem' }}
          >
            <Save size={14} />
            <span>{isLoading ? 'Saving...' : 'Apply Guardrails'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
