/**
 * CampusPrice High-Fidelity Mock Dataset
 * Strictly matches the API Contract types and structures.
 */

export const INITIAL_ITEMS = [
  {
    item_id: 'item_biryani',
    name: 'Hyderabadi Chicken Biryani',
    kind: 'main',
    price: 120.0,
    cost: 72.0,
    portion_size_g: 380,
    units_per_day: 145.0,
    margin_abs: 48.0,
    margin_pct: 40.0,
    flags: ['star'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 380, price: 120.0 },
      { tier: 'mini', portion_size_g: 260, price: 85.0 },
      { tier: 'jumbo', portion_size_g: 520, price: 160.0 }
    ]
  },
  {
    item_id: 'item_veg_thali',
    name: 'Executive Deluxe Veg Thali',
    kind: 'main',
    price: 95.0,
    cost: 68.0,
    portion_size_g: 450,
    units_per_day: 110.0,
    margin_abs: 27.0,
    margin_pct: 28.42,
    flags: [],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 450, price: 95.0 },
      { tier: 'economy', portion_size_g: 320, price: 70.0 }
    ]
  },
  {
    item_id: 'item_paneer_roll',
    name: 'Spicy Paneer Tikka Kathi Roll',
    kind: 'main',
    price: 80.0,
    cost: 54.0,
    portion_size_g: 240,
    units_per_day: 92.0,
    margin_abs: 26.0,
    margin_pct: 32.5,
    flags: ['star'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 240, price: 80.0 },
      { tier: 'double', portion_size_g: 360, price: 120.0 }
    ]
  },
  {
    item_id: 'item_masala_dosa',
    name: 'Crispy Butter Masala Dosa',
    kind: 'main',
    price: 65.0,
    cost: 53.0,
    portion_size_g: 280,
    units_per_day: 78.0,
    margin_abs: 12.0,
    margin_pct: 18.46,
    flags: ['loss_maker'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 280, price: 65.0 }
    ]
  },
  {
    item_id: 'item_chicken_fried_rice',
    name: 'Schezwan Chicken Fried Rice',
    kind: 'main',
    price: 110.0,
    cost: 62.0,
    portion_size_g: 400,
    units_per_day: 85.0,
    margin_abs: 48.0,
    margin_pct: 43.64,
    flags: ['star'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 400, price: 110.0 },
      { tier: 'half', portion_size_g: 250, price: 75.0 }
    ]
  },
  {
    item_id: 'item_veg_sandwich',
    name: 'Grilled Cheese Corn Sandwich',
    kind: 'main',
    price: 60.0,
    cost: 48.0,
    portion_size_g: 210,
    units_per_day: 35.0,
    margin_abs: 12.0,
    margin_pct: 20.0,
    flags: ['poor_seller', 'loss_maker'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 210, price: 60.0 }
    ]
  },
  // Addons
  {
    item_id: 'addon_cold_coffee',
    name: 'Thick Cold Coffee Frappe',
    kind: 'addon',
    price: 45.0,
    cost: 19.0,
    portion_size_g: 250,
    units_per_day: 120.0,
    margin_abs: 26.0,
    margin_pct: 57.78,
    flags: ['star'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 250, price: 45.0 },
      { tier: 'large', portion_size_g: 380, price: 65.0 }
    ]
  },
  {
    item_id: 'addon_gulab_jamun',
    name: 'Warm Gulab Jamun (2 pcs)',
    kind: 'addon',
    price: 35.0,
    cost: 14.0,
    portion_size_g: 100,
    units_per_day: 70.0,
    margin_abs: 21.0,
    margin_pct: 60.0,
    flags: ['star'],
    portion_tiers: [
      { tier: 'pair', portion_size_g: 100, price: 35.0 }
    ]
  },
  {
    item_id: 'addon_samosa',
    name: 'Punjabi Aloo Samosa (2 pcs)',
    kind: 'addon',
    price: 30.0,
    cost: 16.0,
    portion_size_g: 140,
    units_per_day: 130.0,
    margin_abs: 14.0,
    margin_pct: 46.67,
    flags: ['star'],
    portion_tiers: [
      { tier: 'pair', portion_size_g: 140, price: 30.0 }
    ]
  },
  {
    item_id: 'addon_fresh_lime',
    name: 'Fresh Mint Lime Soda',
    kind: 'addon',
    price: 25.0,
    cost: 8.0,
    portion_size_g: 300,
    units_per_day: 95.0,
    margin_abs: 17.0,
    margin_pct: 68.0,
    flags: ['star'],
    portion_tiers: [
      { tier: 'regular', portion_size_g: 300, price: 25.0 }
    ]
  },
  {
    item_id: 'addon_masala_chai',
    name: 'Kadak Adrak Masala Chai',
    kind: 'addon',
    price: 15.0,
    cost: 6.0,
    portion_size_g: 150,
    units_per_day: 220.0,
    margin_abs: 9.0,
    margin_pct: 60.0,
    flags: ['star'],
    portion_tiers: [
      { tier: 'cup', portion_size_g: 150, price: 15.0 }
    ]
  }
];

export const INITIAL_COMBOS = [
  {
    combo_id: 'combo_biryani_coffee',
    name: 'Biryani + Cold Coffee Power Combo',
    combo_items: ['item_biryani', 'addon_cold_coffee'],
    discount_pct: 12.0
  },
  {
    combo_id: 'combo_thali_jamun',
    name: 'Deluxe Thali + Sweet Finish',
    combo_items: ['item_veg_thali', 'addon_gulab_jamun'],
    discount_pct: 15.0
  },
  {
    combo_id: 'combo_roll_lime',
    name: 'Paneer Roll + Fresh Lime Cooler',
    combo_items: ['item_paneer_roll', 'addon_fresh_lime'],
    discount_pct: 10.0
  }
];

export const INITIAL_COMBO_SUGGESTIONS = [
  {
    main_item_id: 'item_biryani',
    addon_item_id: 'addon_gulab_jamun',
    best_discount_pct: 14.0,
    incremental_profit_per_day: { mean: 680.0, p10: 520.0, p90: 840.0 },
    status: 'apply',
    reason: 'High complementary affinity without cannibalising standalone biryani orders.'
  },
  {
    main_item_id: 'item_paneer_roll',
    addon_item_id: 'addon_cold_coffee',
    best_discount_pct: 10.0,
    incremental_profit_per_day: { mean: 490.0, p10: 380.0, p90: 610.0 },
    status: 'pilot',
    reason: 'Promising afternoon snack lift, test across 7 days during regular semester week.'
  },
  {
    main_item_id: 'item_chicken_fried_rice',
    addon_item_id: 'addon_fresh_lime',
    best_discount_pct: 18.0,
    incremental_profit_per_day: { mean: 410.0, p10: 290.0, p90: 530.0 },
    status: 'apply',
    reason: 'Beverage margin is high (68%), so 18% discount unlocks higher dinner volume.'
  },
  {
    main_item_id: 'item_masala_dosa',
    addon_item_id: 'addon_masala_chai',
    best_discount_pct: 8.0,
    incremental_profit_per_day: { mean: 120.0, p10: -40.0, p90: 260.0 },
    status: 'hold',
    reason: 'High cannibalisation risk: 72% of buyers already buy chai together at full price.'
  }
];

export const INITIAL_RECOMMENDATIONS = [
  {
    rec_id: 'rec_dosa_reposition',
    kind: 'portion',
    item_id: 'item_masala_dosa',
    current: 65.0,
    proposed: 72.0,
    expected_profit_delta: { mean: 546.0, p10: 420.0, p90: 672.0 },
    prob_improves: 0.94,
    status: 'apply',
    reason: 'Current 18.4% margin violates 22% floor. Repositioning to ₹72 restores healthy 26.4% margin with minimal student backlash.',
    guardrails_met: ['margin_floor_pct', 'student_price_cap', 'max_weekly_change_pct'],
    pilot_plan: null
  },
  {
    rec_id: 'rec_biryani_elasticity',
    kind: 'price',
    item_id: 'item_biryani',
    current: 120.0,
    proposed: 125.0,
    expected_profit_delta: { mean: 725.0, p10: 450.0, p90: 1010.0 },
    prob_improves: 0.84,
    status: 'pilot',
    reason: 'Strong inelastic brand equity; pilot ₹125 test arm over 7 days to verify student volume retention.',
    guardrails_met: ['margin_floor_pct', 'max_weekly_change_pct'],
    pilot_plan: {
      duration_days: 7,
      arms: [
        { price: 125.0, portion_size_g: 380, label: 'Arm A (Slight Price Adjustment)' },
        { price: 120.0, portion_size_g: 360, label: 'Arm B (Portion Optimization)' }
      ]
    }
  },
  {
    rec_id: 'rec_sandwich_bundle',
    kind: 'combo',
    combo_id: 'combo_sandwich_coffee',
    current: 0.0,
    proposed: 15.0,
    expected_profit_delta: { mean: 310.0, p10: 180.0, p90: 440.0 },
    prob_improves: 0.81,
    status: 'pilot',
    reason: 'Reactivates slow-moving Veg Sandwich by pairing with high-margin Cold Coffee at 15% discount.',
    guardrails_met: ['margin_floor_pct', 'combo_discount_cap_pct', 'coverage_target'],
    pilot_plan: {
      duration_days: 7,
      arms: [
        { price: 89.0, portion_size_g: 460, label: 'Bundle A (₹89 Special Combo)' }
      ]
    }
  },
  {
    rec_id: 'rec_surge_exam_week',
    kind: 'price',
    item_id: 'item_cold_coffee',
    current: 45.0,
    proposed: 55.0,
    expected_profit_delta: { mean: 410.0, p10: -150.0, p90: 920.0 },
    prob_improves: 0.61,
    status: 'hold',
    reason: 'Violates fairness_mode: Price surges during exam periods are strictly blocked by owner ethical guardrails.',
    guardrails_met: ['margin_floor_pct'],
    pilot_plan: null
  }
];

export const INITIAL_MODEL_STATUS = {
  model_version: 'v2.4-loglinear-bayes-calibrated',
  data_source: 'synthetic',
  generated_at: new Date().toISOString(),
  last_training_date: '2026-10-28T18:30:00Z',
  simulation_days: 120,
  validation_rmse: 0.048,
  coverage_status: 'Compliant (81.2% meal reach)',
  fairness_status: 'Enforced (No Exam Surge)',
  guardrail_state: 'Active'
};

