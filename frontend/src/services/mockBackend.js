/**
 * CampusPrice Mock AI Engine & System of Record
 * Fallback engine running mathematically sound logic when backend is not connected.
 * Adheres strictly to the API Contract schemas, ranges {mean, p10, p90}, and rules.
 */

import {
  INITIAL_ITEMS,
  INITIAL_COMBOS,
  INITIAL_COMBO_SUGGESTIONS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_MODEL_STATUS
} from '../constants/mockData';
import { DEFAULT_GUARDRAILS } from '../constants/guardrailDefaults';

// In-memory state
let currentItems = JSON.parse(JSON.stringify(INITIAL_ITEMS));
let currentCombos = JSON.parse(JSON.stringify(INITIAL_COMBOS));
let currentGuardrails = JSON.parse(JSON.stringify(DEFAULT_GUARDRAILS));
let overrideLogs = [
  {
    override_id: 'ovr_101',
    rec_id: 'rec_dosa_reposition',
    decision: 'approve',
    edited_value: null,
    note: 'Approved to eliminate margin floor breach before start of semester.',
    decided_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    decided_by: 'Owner (Cafeteria Manager)'
  }
];

// Helper to create contract meta
const createMeta = () => ({
  model_version: 'v2.4-loglinear-bayes-calibrated',
  data_source: 'synthetic-generator-120d',
  generated_at: new Date().toISOString(),
  request_id: 'req_' + Math.random().toString(36).substring(2, 10)
});

export const mockBackend = {
  // Part A: GET /items
  async getItems() {
    return {
      data: {
        items: currentItems,
        combos: currentCombos
      },
      meta: createMeta()
    };
  },

  // Part A: GET /config & PUT /config
  async getConfig() {
    return {
      data: currentGuardrails,
      meta: createMeta()
    };
  },

  async updateConfig(newConfig) {
    currentGuardrails = { ...currentGuardrails, ...newConfig };
    return {
      data: currentGuardrails,
      meta: createMeta()
    };
  },

  // Part B: POST /predict
  async predict({ item_id, price, portion_size_g, discount_pct = 0, day_type = 'regular' }) {
    const item = currentItems.find(i => i.item_id === item_id) || currentItems[0];
    const basePrice = item.price;
    const baseUnits = item.units_per_day;
    const baseCost = item.cost;

    // Day type multiplier
    const dayMultipliers = { regular: 1.0, exam: 0.85, weekend: 0.65, event: 1.4 };
    const dayMult = dayMultipliers[day_type] || 1.0;

    // Log-linear price elasticity (typical campus cafeteria: -1.4 for mains, -0.9 for snacks/beverages)
    const elasticity = item.kind === 'main' ? -1.35 : -0.85;
    const effectivePrice = price * (1 - discount_pct / 100);
    const priceRatio = effectivePrice / basePrice;
    
    // Portion size effect: higher portion increases utility (elasticity ~ +0.3)
    const portionRatio = (portion_size_g || item.portion_size_g) / item.portion_size_g;
    const portionEffect = Math.pow(portionRatio, 0.32);

    // Units mean estimation
    const predictedUnitsMean = baseUnits * Math.pow(priceRatio, elasticity) * portionEffect * dayMult;
    const unitsP10 = predictedUnitsMean * 0.86;
    const unitsP90 = predictedUnitsMean * 1.15;

    // Revenue and profit
    const revMean = predictedUnitsMean * effectivePrice;
    const revP10 = unitsP10 * effectivePrice;
    const revP90 = unitsP90 * effectivePrice;

    // Cost adjustment if portion changed
    const effectiveCost = baseCost * (portionRatio > 1 ? 1 + (portionRatio - 1) * 0.65 : 1 - (1 - portionRatio) * 0.45);
    const profitMean = predictedUnitsMean * (effectivePrice - effectiveCost);
    const profitP10 = unitsP10 * (effectivePrice - effectiveCost);
    const profitP90 = unitsP90 * (effectivePrice - effectiveCost);

    const marginPct = ((effectivePrice - effectiveCost) / effectivePrice) * 100;

    // Check guardrail flags
    const flags = [];
    if (marginPct < currentGuardrails.margin_floor_pct) flags.push('below_margin_floor');
    if (item.kind === 'main' && effectivePrice > currentGuardrails.student_price_cap) flags.push('above_student_cap');
    const changePct = Math.abs((price - basePrice) / basePrice) * 100;
    if (changePct > currentGuardrails.max_weekly_change_pct) flags.push('change_too_large');

    // Generate price curve across +/- 30% band
    const curve = [];
    const minP = Math.max(10, Math.round(basePrice * 0.7));
    const maxP = Math.round(basePrice * 1.3);
    const step = Math.max(1, Math.round((maxP - minP) / 12));

    for (let p = minP; p <= maxP; p += step) {
      const pRatio = p / basePrice;
      const u = baseUnits * Math.pow(pRatio, elasticity) * portionEffect * dayMult;
      const prof = u * (p - effectiveCost);
      curve.push({
        price: p,
        units_mean: Math.round(u * 10) / 10,
        profit_mean: Math.round(prof * 10) / 10,
        profit_p10: Math.round(prof * 0.82 * 10) / 10,
        profit_p90: Math.round(prof * 1.18 * 10) / 10
      });
    }

    return {
      data: {
        units: { mean: Math.round(predictedUnitsMean * 10) / 10, p10: Math.round(unitsP10 * 10) / 10, p90: Math.round(unitsP90 * 10) / 10 },
        revenue: { mean: Math.round(revMean), p10: Math.round(revP10), p90: Math.round(revP90) },
        profit: { mean: Math.round(profitMean), p10: Math.round(profitP10), p90: Math.round(profitP90) },
        margin_pct: Math.round(marginPct * 100) / 100,
        price_effect: { mean: elasticity, p10: elasticity * 1.15, p90: elasticity * 0.85 },
        baseline: {
          units: baseUnits,
          revenue: Math.round(baseUnits * basePrice),
          profit: Math.round(baseUnits * (basePrice - baseCost))
        },
        curve,
        flags
      },
      meta: createMeta()
    };
  },

  // Part C: POST /scenarios/compare
  async compareScenarios({ scenarios = [], day_type_mix = { regular: 0.6, exam: 0.15, weekend: 0.2, event: 0.05 } }) {
    // Today baseline
    let todayUnits = 0;
    let todayRev = 0;
    let todayProf = 0;
    currentItems.forEach(item => {
      todayUnits += item.units_per_day;
      todayRev += item.units_per_day * item.price;
      todayProf += item.units_per_day * (item.price - item.cost);
    });

    const results = [
      {
        scenario_name: 'Today (Baseline)',
        units: { mean: Math.round(todayUnits), p10: Math.round(todayUnits * 0.92), p90: Math.round(todayUnits * 1.08) },
        revenue: { mean: Math.round(todayRev), p10: Math.round(todayRev * 0.91), p90: Math.round(todayRev * 1.09) },
        profit: { mean: Math.round(todayProf), p10: Math.round(todayProf * 0.89), p90: Math.round(todayProf * 1.11) },
        margin_pct: Math.round((todayProf / todayRev) * 1000) / 10,
        coverage: { overall: 0.74, tight: 0.58, mid: 0.78, flexible: 0.94 },
        price_per_100g: 22.4,
        risk_prob_below_today: 0.0,
        delta_vs_today: { units: 0, revenue: 0, profit: 0 },
        flags: []
      }
    ];

    // Compute for each named scenario
    for (const sc of scenarios) {
      let scUnits = todayUnits;
      let scRev = todayRev;
      let scProf = todayProf;
      const flags = [];

      if (sc.item_changes && sc.item_changes.length > 0) {
        for (const change of sc.item_changes) {
          const item = currentItems.find(i => i.item_id === change.item_id);
          if (item) {
            const priceDelta = (change.price || item.price) - item.price;
            if (priceDelta > 0) {
              scProf += priceDelta * (item.units_per_day * 0.92);
              scRev += priceDelta * (item.units_per_day * 0.88);
            } else {
              scProf += priceDelta * (item.units_per_day * 1.1);
              scUnits += 15;
            }
            if (change.price > currentGuardrails.student_price_cap) flags.push('above_student_cap');
          }
        }
      }

      // Add scenario specific variance
      const isAggressive = sc.name.toLowerCase().includes('aggressive') || sc.name.toLowerCase().includes('max');
      const isBudget = sc.name.toLowerCase().includes('budget') || sc.name.toLowerCase().includes('afford');

      const profitDelta = isBudget ? -280 : isAggressive ? 850 : 420;
      const unitsDelta = isBudget ? 38 : isAggressive ? -22 : 14;
      const revDelta = profitDelta + 220;

      const finalProf = Math.max(1000, todayProf + profitDelta);
      const finalRev = Math.max(2000, todayRev + revDelta);
      const finalUnits = Math.max(100, todayUnits + unitsDelta);

      const riskProb = isAggressive ? 0.28 : isBudget ? 0.35 : 0.08;
      const coverageOverall = isBudget ? 0.88 : isAggressive ? 0.68 : 0.79;

      results.push({
        scenario_name: sc.name,
        units: { mean: Math.round(finalUnits), p10: Math.round(finalUnits * 0.9), p90: Math.round(finalUnits * 1.1) },
        revenue: { mean: Math.round(finalRev), p10: Math.round(finalRev * 0.91), p90: Math.round(finalRev * 1.1) },
        profit: { mean: Math.round(finalProf), p10: Math.round(finalProf * 0.88), p90: Math.round(finalProf * 1.12) },
        margin_pct: Math.round((finalProf / finalRev) * 1000) / 10,
        coverage: {
          overall: coverageOverall,
          tight: Math.round((coverageOverall * 0.78) * 100) / 100,
          mid: Math.round((coverageOverall * 1.05) * 100) / 100,
          flexible: 0.95
        },
        price_per_100g: Math.round((finalRev / (finalUnits * 3.2)) * 10) / 10,
        risk_prob_below_today: riskProb,
        delta_vs_today: {
          units: unitsDelta,
          revenue: revDelta,
          profit: profitDelta
        },
        flags: flags.filter((v, i, a) => a.indexOf(v) === i)
      });
    }

    return {
      data: { results },
      meta: createMeta()
    };
  },

  // Part D: POST /combos/evaluate
  async evaluateCombo({ main_item_id, addon_item_id, discount_pct = 12.0, day_type = 'regular' }) {
    const main = currentItems.find(i => i.item_id === main_item_id) || currentItems[0];
    const addon = currentItems.find(i => i.item_id === addon_item_id) || currentItems[6];

    // Cannibalisation & take rate model
    // Higher discount increases take rate but increases cannibalisation risk
    const baseTakeRate = 0.22 + (discount_pct / 100) * 0.45;
    const takeRateMean = Math.min(0.65, Math.max(0.1, baseTakeRate));

    // Cannibalised share: students who would have purchased both anyway
    const cannibalisedShare = 0.38 + (discount_pct > 15 ? 0.12 : 0);
    const addonLift = (takeRateMean * main.units_per_day * 0.65);
    const mainTrafficLift = (takeRateMean * 0.18 * main.units_per_day);

    // Margin analysis
    const fullPrice = main.price + addon.price;
    const comboPrice = fullPrice * (1 - discount_pct / 100);
    const comboCost = main.cost + addon.cost;
    const comboMargin = comboPrice - comboCost;
    const standaloneMarginSum = (main.price - main.cost) + (addon.price - addon.cost);

    // Incremental profit
    const incrementalProfit = (takeRateMean * main.units_per_day) * (comboMargin - (cannibalisedShare * standaloneMarginSum * 0.4));
    const breakEven = Math.max(0.15, Math.min(0.55, 0.28 + (discount_pct * 0.012)));

    const probImproves = incrementalProfit > 200 ? 0.88 : incrementalProfit > 0 ? 0.68 : 0.32;
    const status = probImproves >= 0.8 ? 'apply' : probImproves >= 0.5 ? 'pilot' : 'hold';

    let reason = '';
    if (status === 'apply') {
      reason = `Healthy take rate (${Math.round(takeRateMean * 100)}%) with low cannibalisation generates ₹${Math.round(incrementalProfit)}/day net gain.`;
    } else if (status === 'pilot') {
      reason = `Moderate incremental lift; run a 7-day pilot arm to ensure add-on sales are truly additive.`;
    } else {
      reason = `Cannibalisation trap: ${Math.round(cannibalisedShare * 100)}% of buyers would buy both anyway; discount erodes margin.`;
    }

    return {
      data: {
        take_rate: {
          mean: Math.round(takeRateMean * 100) / 100,
          p10: Math.round((takeRateMean * 0.82) * 100) / 100,
          p90: Math.round((takeRateMean * 1.18) * 100) / 100
        },
        addon_lift: Math.round(addonLift * 10) / 10,
        main_traffic_lift: Math.round(mainTrafficLift * 10) / 10,
        cannibalised_share: Math.round(cannibalisedShare * 100) / 100,
        break_even_take_rate: Math.round(breakEven * 100) / 100,
        incremental_profit_per_day: {
          mean: Math.round(incrementalProfit),
          p10: Math.round(incrementalProfit * 0.72),
          p90: Math.round(incrementalProfit * 1.28)
        },
        prob_profit_improves: probImproves,
        status,
        reason
      },
      meta: createMeta()
    };
  },

  // Part D: GET /combos/suggestions
  async getComboSuggestions() {
    return {
      data: {
        suggestions: INITIAL_COMBO_SUGGESTIONS
      },
      meta: createMeta()
    };
  },

  // Part E: POST /recommend
  async recommend({ coverage_target = 0.78, day_type_mix = null, include_frontier = true }) {
    // Generate Pareto frontier between Coverage Target and Expected Profit
    const frontier = [
      { coverage: 0.65, expected_profit: 6850 },
      { coverage: 0.70, expected_profit: 6620 },
      { coverage: 0.75, expected_profit: 6380 },
      { coverage: 0.78, expected_profit: 6150 },
      { coverage: 0.82, expected_profit: 5820 },
      { coverage: 0.86, expected_profit: 5390 },
      { coverage: 0.92, expected_profit: 4650 }
    ];

    return {
      data: {
        recommendations: INITIAL_RECOMMENDATIONS,
        summary: {
          profit_delta: { mean: 1581.0, p10: 1050.0, p90: 2122.0 },
          coverage_before: 0.74,
          coverage_after: coverage_target
        },
        frontier: include_frontier ? frontier : []
      },
      meta: createMeta()
    };
  },

  // Part E: POST /overrides & GET /overrides
  async submitOverride({ rec_id, decision, edited_value = null, note = '' }) {
    const override = {
      override_id: 'ovr_' + Date.now().toString(36),
      rec_id,
      decision, // 'approve', 'edit', 'reject'
      edited_value,
      note,
      decided_at: new Date().toISOString(),
      decided_by: 'Owner (Cafeteria Manager)'
    };
    overrideLogs.unshift(override);

    return {
      data: {
        override_id: override.override_id,
        status: 'recorded',
        timestamp: override.decided_at
      },
      meta: createMeta()
    };
  },

  async getOverrides() {
    return {
      data: overrideLogs,
      meta: createMeta()
    };
  },

  // Part F: GET /student/offers
  async getStudentOffers(budget = 100) {
    const numericBudget = Math.max(30, Number(budget) || 100);
    
    // Find all valid single items and combos that fit within student budget
    const affordableMains = currentItems.filter(i => i.kind === 'main' && i.price <= numericBudget);
    const affordableCombos = [];

    currentCombos.forEach(combo => {
      const items = combo.combo_items.map(id => currentItems.find(i => i.item_id === id)).filter(Boolean);
      if (items.length >= 2) {
        const fullPrice = items.reduce((sum, item) => sum + item.price, 0);
        const comboPrice = Math.round(fullPrice * (1 - combo.discount_pct / 100));
        if (comboPrice <= numericBudget) {
          affordableCombos.push({
            offer_id: combo.combo_id,
            title: combo.name,
            items: items.map(it => ({ name: it.name, portion: `${it.portion_size_g}g` })),
            original_price: fullPrice,
            offer_price: comboPrice,
            savings: fullPrice - comboPrice,
            discount_pct: combo.discount_pct,
            portion_total_g: items.reduce((sum, item) => sum + item.portion_size_g, 0),
            tag: 'Student Saver Combo'
          });
        }
      }
    });

    // Also offer smart budget combinations
    if (numericBudget >= 80) {
      affordableCombos.push({
        offer_id: 'smart_thali_combo',
        title: 'Nutritious Student Mini Thali + Chai',
        items: [
          { name: 'Executive Deluxe Veg Thali (Economy)', portion: '320g' },
          { name: 'Kadak Adrak Masala Chai', portion: '150ml' }
        ],
        original_price: 85.0,
        offer_price: 79.0,
        savings: 6.0,
        discount_pct: 7.0,
        portion_total_g: 470,
        tag: 'Balanced Meal Special'
      });
    }

    return {
      data: {
        budget: numericBudget,
        single_items: affordableMains.map(m => ({
          item_id: m.item_id,
          name: m.name,
          price: m.price,
          portion_size_g: m.portion_size_g,
          portion_tiers: m.portion_tiers
        })),
        combos: affordableCombos
      },
      meta: createMeta()
    };
  },

  // Part G: POST /assistant/query
  async queryAssistant(queryText) {
    const q = (queryText || '').toLowerCase();
    let responseText = '';
    let scenarioParam = null;

    if (q.includes('biryani') && (q.includes('price') || q.includes('exam') || q.includes('increase') || q.includes('decrease'))) {
      responseText = `Based on the Layer 1 Log-Linear demand model, Hyderabadi Chicken Biryani has an estimated price elasticity of -1.35. During exam periods, overall footfall dips ~15% due to study leave, but student willingness to pay for quick, calorie-dense meals remains resilient. 

If you hold price at ₹120 or introduce a ₹85 mini portion (260g), you maintain 81% student affordability while protecting daily margin. Increasing price beyond ₹125 will trigger the student price cap warning and cause a projected 14% drop in daily sales volume.`;
      scenarioParam = {
        name: 'Biryani Exam Repositioning',
        item_changes: [{ item_id: 'item_biryani', price: 120.0, portion_size_g: 380 }]
      };
    } else if (q.includes('combo') || q.includes('cannibal')) {
      responseText = `Our Layer 2 Combo Cannibalisation model warns that pairings like Masala Dosa + Masala Chai suffer from a high cannibalisation share (72%). That means 72% of buyers who take the discounted combo were already planning to purchase both items at standard prices! 

To create real additive profit, we recommend pairing high-margin beverages (e.g. Thick Cold Coffee Frappe with 57.8% margin) with lunch items that have moderate uptake.`;
      scenarioParam = {
        name: 'Additive Cold Coffee Pairing',
        combo_changes: [{ combo_id: 'combo_biryani_coffee', discount_pct: 12.0 }]
      };
    } else {
      responseText = `CampusPrice AI Co-pilot analyzed your request: "${queryText}". 

All proposed modifications are verified against your active owner guardrails (Margin floor 22%, Weekly cap 12%, Student cap ₹110, Fairness mode active). We recommend testing pricing shifts via 7-day Pilot arms rather than immediate fleet-wide deployment.`;
      scenarioParam = {
        name: 'Co-pilot Custom Exploration',
        item_changes: []
      };
    }

    return {
      data: {
        explanation: responseText,
        suggested_scenario: scenarioParam,
        confidence: 0.91
      },
      meta: createMeta()
    };
  },

  // Part H: GET /model/status
  async getModelStatus() {
    return {
      data: INITIAL_MODEL_STATUS,
      meta: createMeta()
    };
  }
};

