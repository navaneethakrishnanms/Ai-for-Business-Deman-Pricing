import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Sliders, 
  ShoppingBag, 
  CheckCircle, 
  Smartphone, 
  Activity,
  AlertCircle 
} from 'lucide-react';

const SCREENS = {
  MENU_HEALTH: 'menu_health',
  DEMAND_LAB: 'demand_lab',
  SCENARIOS: 'scenarios',
  COMBO_STUDIO: 'combo_studio',
  RECOMMENDATIONS: 'recommendations',
  STUDENT_BUDGET: 'student_budget'
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState(SCREENS.MENU_HEALTH);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.9)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            CP
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>CampusPrice</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pricing & Combo Decision Support (PS 2.4)</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0' }}>
          <button 
            className={activeScreen === SCREENS.MENU_HEALTH ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.MENU_HEALTH)}
          >
            <Activity size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Menu Health
          </button>
          <button 
            className={activeScreen === SCREENS.DEMAND_LAB ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.DEMAND_LAB)}
          >
            <Sliders size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Demand Lab
          </button>
          <button 
            className={activeScreen === SCREENS.SCENARIOS ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.SCENARIOS)}
          >
            <TrendingUp size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Scenarios
          </button>
          <button 
            className={activeScreen === SCREENS.COMBO_STUDIO ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.COMBO_STUDIO)}
          >
            <ShoppingBag size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Combo Studio
          </button>
          <button 
            className={activeScreen === SCREENS.RECOMMENDATIONS ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.RECOMMENDATIONS)}
          >
            <CheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Recommendations
          </button>
          <button 
            className={activeScreen === SCREENS.STUDENT_BUDGET ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveScreen(SCREENS.STUDENT_BUDGET)}
            style={{ borderColor: 'var(--accent-cyan)' }}
          >
            <Smartphone size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--accent-cyan)' }} />
            Student View
          </button>
        </nav>
      </header>

      {/* Main Body Content Container */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {activeScreen === SCREENS.MENU_HEALTH && "1. Menu Health (Owner Screen)"}
            {activeScreen === SCREENS.DEMAND_LAB && "2. Demand Lab (Owner Screen)"}
            {activeScreen === SCREENS.SCENARIOS && "3. Scenario Compare & Frontier (Owner Screen)"}
            {activeScreen === SCREENS.COMBO_STUDIO && "4. Combo Studio & Cannibalisation Trap (Owner Screen)"}
            {activeScreen === SCREENS.RECOMMENDATIONS && "5. Recommendations: Apply / Pilot / Hold (Owner Screen)"}
            {activeScreen === SCREENS.STUDENT_BUDGET && "6. Student Budget Builder (Phone-First Screen)"}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 1.5rem auto' }}>
            Connected to <strong>Node Backend (:5000)</strong> & <strong>FastAPI Engine (:8000)</strong> via pure JavaScript ES Modules.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <span className="badge badge-star">FastAPI AI Engine</span>
            <span className="badge badge-loss">Loss-Maker Alert Guard</span>
            <span className="badge badge-poor">Affordability Target</span>
          </div>
        </div>
      </main>
    </div>
  );
}
