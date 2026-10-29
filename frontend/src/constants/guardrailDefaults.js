/**
 * Default Guardrails Configuration
 * Matches Contract Part A: GET /config, PUT /config
 */

export const DEFAULT_GUARDRAILS = {
  margin_floor_pct: 22.0,           // Lowest margin the optimiser may leave (e.g. 22%)
  max_weekly_change_pct: 12.0,      // Largest price change allowed per week (e.g. 12%)
  student_price_cap: 110.0,         // Student price cap in ₹ (raises above_student_cap flag)
  coverage_target: 0.78,            // Share of students who can afford a complete meal (0 to 1, e.g. 78%)
  combo_discount_cap_pct: 25.0,     // Largest combo discount allowed (e.g. 25%)
  fairness_mode: true               // No surge pricing on exam or event days
};

export const GUARDRAIL_DESCRIPTIONS = {
  margin_floor_pct: 'Minimum allowable gross margin percentage on any single item or bundle.',
  max_weekly_change_pct: 'Maximum allowable weekly percentage increase or decrease on prices.',
  student_price_cap: 'Hard upper ceiling for single standard meal items to protect campus student affordability.',
  coverage_target: 'Target fraction of the student body capable of purchasing a full meal under budget constraints.',
  combo_discount_cap_pct: 'Safety cap to prevent margin erosion when pairing high-volume mains and add-ons.',
  fairness_mode: 'Guarantees prices do not surge opportunistically on exam or special campus event days.'
};

