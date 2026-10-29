import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Terminal, 
  Search, 
  UserCheck, 
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { useTheme } from '../../context/ThemeContext';
import { SCREENS } from './Navbar';

const SCREEN_TITLES = {
  [SCREENS.MENU_HEALTH]: { title: 'Menu Health & Cost Structure', category: 'Catalog Operations', part: 'Part A: GET /items' },
  [SCREENS.DEMAND_LAB]: { title: 'Demand Lab & Elasticity Simulator', category: 'Quantitative Simulation', part: 'Part B: POST /predict' },
  [SCREENS.SCENARIOS]: { title: 'Scenario Compare & Trade-Offs', category: 'Strategic Benchmarking', part: 'Part C: POST /scenarios/compare' },
  [SCREENS.COMBO_STUDIO]: { title: 'Combo Studio & Cannibalisation Guard', category: 'Cross-Sell Optimization', part: 'Part D: POST /combos/evaluate' },
  [SCREENS.RECOMMENDATIONS]: { title: 'Policy Recommendations & Pilot Gate', category: 'Multi-Objective Optimizer', part: 'Part E: POST /recommend' },
  [SCREENS.STUDENT_BUDGET]: { title: 'Student Budget Meal Finder', category: 'Student Client', part: 'Part F: GET /student/offers' }
};

export const TopBar = ({ activeScreen, onOpenGuardrails, onOpenAssistant }) => {
  const { activeRole, ownerToken, updateToken } = useAuth();
  const { guardrails } = useGuardrailsContext();
  const { theme, toggleTheme, isLight } = useTheme();

  const [showTokenEdit, setShowTokenEdit] = useState(false);
  const [tokenInput, setTokenInput] = useState(ownerToken || '');

  const handleSaveToken = (e) => {
    e.preventDefault();
    updateToken(tokenInput);
    setShowTokenEdit(false);
  };

  const currentMeta = SCREEN_TITLES[activeScreen] || {
    title: 'Console',
    category: 'Revenue Operations',
    part: 'PS 2.4'
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: 'var(--shadow-subtle)'
    }}>
      {/* Left: Breadcrumbs & Current Screen Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>CampusPrice</span>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{currentMeta.category}</span>
          <span>/</span>
          <span className="mono" style={{ color: 'var(--accent-blue)', fontSize: '0.68rem' }}>{currentMeta.part}</span>
        </div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.015em' }}>
          {currentMeta.title}
        </h2>
      </div>

      {/* Center: Search / What-If Quick Command Trigger */}
      <button
        onClick={onOpenAssistant}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0.45rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          cursor: 'pointer',
          minWidth: '280px',
          maxWidth: '380px',
          width: '100%',
          justifyContent: 'space-between'
        }}
        title="Open What-If Query Assistant"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="var(--text-muted)" />
          <span>Ask What-If or search menu...</span>
        </div>
        <kbd style={{
          fontSize: '0.65rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '3px',
          padding: '1px 5px',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)'
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions, Guardrails Badge, Token, Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Guardrails Summary Badge */}
        <button
          onClick={onOpenGuardrails}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--accent-emerald-subtle)',
            border: '1px solid var(--accent-emerald-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-emerald)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Owner Guardrails Config"
        >
          <ShieldCheck size={14} />
          <span>Floor: {guardrails.margin_floor_pct}%</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={isLight ? 'Switch to Dark Slate Theme' : 'Switch to Clean Light Theme'}
        >
          {isLight ? <Moon size={15} /> : <Sun size={15} color="#fbbf24" />}
        </button>

        {/* Owner Session Token Inspector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTokenEdit(!showTokenEdit)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.65rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Owner Bearer Token"
          >
            <Key size={13} color="var(--accent-amber)" />
            <span className="mono" style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ownerToken ? ownerToken.substring(0, 10) + '...' : 'Auth'}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showTokenEdit && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '300px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 100
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Owner Bearer Token
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '8px', lineHeight: '1.4' }}>
                Attached to Part A, B, C, D, E requests via <code className="mono" style={{ color: 'var(--text-secondary)' }}>Authorization: Bearer</code>.
              </p>
              <form onSubmit={handleSaveToken}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Bearer token string..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTokenEdit(false)}
                    style={{ fontSize: '0.72rem', padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
