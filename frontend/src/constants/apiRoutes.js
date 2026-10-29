/**
 * CampusPrice API Endpoint Routes
 * Strict mapping per API Contract and Data Flow Oct 29, 2026
 */

export const API_ROUTES = {
  // Part A: Menu & Config
  ITEMS: '/items',
  CONFIG: '/config',

  // Part B: Demand Lab
  PREDICT: '/predict',

  // Part C: Scenario Compare
  SCENARIOS_COMPARE: '/scenarios/compare',

  // Part D: Combo Studio
  COMBOS_EVALUATE: '/combos/evaluate',
  COMBOS_SUGGESTIONS: '/combos/suggestions',

  // Part E: Recommendations & Overrides
  RECOMMEND: '/recommend',
  OVERRIDES: '/overrides',

  // Part F: Student View
  STUDENT_OFFERS: '/student/offers',

  // Part G: Natural Language Assistant
  ASSISTANT_QUERY: '/assistant/query',

  // Part H: Model Status (Footer)
  MODEL_STATUS: '/model/status'
};

export const DAY_TYPES = [
  { id: 'regular', label: 'Regular Day', icon: 'Calendar', description: 'Standard class day footfall' },
  { id: 'exam', label: 'Exam Day', icon: 'BookOpen', description: 'High stress, quick meals, fairness mode active' },
  { id: 'weekend', label: 'Weekend', icon: 'Coffee', description: 'Lower volume, higher leisure add-on preference' },
  { id: 'event', label: 'Campus Event', icon: 'Award', description: 'Peak rush, high demand, combo sensitive' }
];

