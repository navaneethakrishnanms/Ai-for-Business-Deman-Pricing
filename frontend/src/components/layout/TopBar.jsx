import React, { useState } from 'react';
import { 
  ChevronDown, 
  Grid, 
  Key, 
  ShieldCheck, 
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { useTheme } from '../../context/ThemeContext';
import { SCREENS } from './Navbar';

const SCREEN_TITLES = {
  [SCREENS.MENU_HEALTH]: 'Sales Dashboard',
  [SCREENS.DEMAND_LAB]: 'Demand Simulator',
  [SCREENS.SCENARIOS]: 'Scenario Compare',
  [SCREENS.COMBO_STUDIO]: 'Combo Studio',
  [SCREENS.RECOMMENDATIONS]: 'Recommendations & Pilots',
  [SCREENS.STUDENT_BUDGET]: 'Student Budget Builder'
};

export const TopBar = ({ activeScreen, onOpenGuardrails, onOpenAssistant, dayType = 'regular', onDayTypeChange }) => {
  const { ownerToken, updateToken } = useAuth();
  const { guardrails } = useGuardrailsContext();
  const { theme, toggleTheme, isDark } = useTheme();

  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Week');
  const [showTokenEdit, setShowTokenEdit] = useState(false);
  const [tokenInput, setTokenInput] = useState(ownerToken || '');

  const timeframes = ['Today', 'This Week', 'Exam Period', 'Full Semester'];

  const handleSaveToken = (e) => {
    e.preventDefault();
    updateToken(tokenInput);
    setShowTokenEdit(false);
  };

  const title = SCREEN_TITLES[activeScreen] || 'Sales Dashboard';

  return (
    <header style={{
      height: '76px',
      backgroundColor: 'transparent',
      padding: '1.25rem 2rem 0.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      userSelect: 'none'
    }}>
      {/* Screen Title (Exact match to "Sales Dashboard" in screenshot) */}
      <div>
        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          margin: 0
        }}>
          {title}
        </h1>
      </div>

      {/* Right Controls: Theme Switcher, Floor Pill, Grid, Timeframe & Token Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        
        {/* Interactive Theme Switcher Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 0.15s ease'
          }}
          title={isDark ? "Switch to Clean Light Theme" : "Switch to Obsidian Dark Theme"}
        >
          {isDark ? (
            <>
              <Sun size={15} color="#fbbf24" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#6366f1" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Guardrail Floor Pill */}
        <button
          onClick={onOpenGuardrails}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-green-subtle)',
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Owner Guardrails Config"
        >
          <ShieldCheck size={14} />
          <span>Floor {guardrails.margin_floor_pct}%</span>
        </button>

        {/* View Grid Icon Capsule Button (from screenshot) */}
        <button
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Grid Layout View"
        >
          <Grid size={17} />
        </button>

        {/* Timeframe Dropdown Capsule Button (Exact match to "This Week ⌄" in screenshot) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{selectedTimeframe}</span>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </button>

          {showTimeDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '14px',
              padding: '6px',
              minWidth: '150px',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 100
            }}>
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setSelectedTimeframe(tf);
                    setShowTimeDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: selectedTimeframe === tf ? 'var(--accent-green-subtle)' : 'transparent',
                    color: selectedTimeframe === tf ? 'var(--accent-green)' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Owner Session Token Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTokenEdit(!showTokenEdit)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Owner Bearer Token"
          >
            <Key size={16} />
          </button>

          {showTokenEdit && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              width: '280px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '1rem',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 100
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Owner Bearer Token
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Included in owner requests via Authorization header.
              </p>
              <form onSubmit={handleSaveToken}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter token string..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTokenEdit(false)}
                    style={{ fontSize: '0.72rem', padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
