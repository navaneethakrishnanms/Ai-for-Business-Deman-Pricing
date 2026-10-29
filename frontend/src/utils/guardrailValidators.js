/**
 * Guardrail Validation Helpers
 * Matches the API Contract guardrail warnings & rules
 */

export const validateItemPriceChange = (originalItem, proposedPrice, guardrails) => {
  const flags = [];
  if (!originalItem || !proposedPrice || !guardrails) return flags;

  // 1. Margin Floor Check
  const marginAbs = proposedPrice - originalItem.cost;
  const marginPct = (marginAbs / proposedPrice) * 100;
  if (marginPct < guardrails.margin_floor_pct) {
    flags.push('below_margin_floor');
  }

  // 2. Student Price Cap Check (for main items)
  if (originalItem.kind === 'main' && proposedPrice > guardrails.student_price_cap) {
    flags.push('above_student_cap');
  }

  // 3. Weekly Max Change Check
  const changePct = Math.abs((proposedPrice - originalItem.price) / originalItem.price) * 100;
  if (changePct > guardrails.max_weekly_change_pct) {
    flags.push('change_too_large');
  }

  return {
    flags,
    marginPct,
    marginAbs,
    changePct,
    isValid: flags.length === 0
  };
};

export const getFlagColor = (flag) => {
  switch (flag) {
    case 'loss_maker':
    case 'below_margin_floor':
      return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)', label: 'Margin Floor Breached' };
    case 'above_student_cap':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', label: 'Above Student Cap' };
    case 'change_too_large':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)', label: 'Exceeds Weekly Cap' };
    case 'poor_seller':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', label: 'Poor Seller' };
    case 'star':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', label: 'Star Performer' };
    default:
      return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)', label: flag };
  }
};

