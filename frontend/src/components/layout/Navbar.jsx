import React, { useState } from 'react';
import { 
  Activity, 
  Sliders, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle, 
  Smartphone, 
  Key, 
  ShieldCheck, 
  HelpCircle,
  FileSpreadsheet,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGuardrailsContext } from '../../context/GuardrailsContext';

export const SCREENS = {
  MENU_HEALTH: 'menu_health',
  DEMAND_LAB: 'demand_lab',
  SCENARIOS: 'scenarios',
  COMBO_STUDIO: 'combo_studio',
  RECOMMENDATIONS: 'recommendations',
  STUDENT_BUDGET: 'student_budget'
};

export const Navbar = ({ activeScreen, setActiveScreen, onOpenGuardrails, onOpenAssistant }) => {
  const { activeRole, setActiveRole, ownerToken, updateToken } = useAuth();
  const { guardrails } = useGuardrailsContext();
  const [showTokenEdit, setShowTokenEdit] = useState(false);
  const [tokenInput, setTokenInput] = useState(ownerToken || '');

  const handleSaveToken = (e) => {
    e.preventDefault();
    updateToken(tokenInput);
    setShowTokenEdit(false);
  };

  const navItems = [
    { id: SCREENS.MENU_HEALTH, label: 'Menu Health', icon: Activity },
    { id: SCREENS.DEMAND_LAB, label: 'Demand Lab', icon: Sliders },
    { id: SCREENS.SCENARIOS, label: 'Scenario Compare', icon: TrendingUp },
    { id: SCREENS.COMBO_STUDIO, label: 'Combo Studio', icon: ShoppingBag },
    { id: SCREENS.RECOMMENDATIONS, label: 'Recommendations', icon: CheckCircle }
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.25rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-blue)',
          fontWeight: 800,
          fontSize: '0.9rem',
          letterSpacing: '-0.03em'
        }}>
          CP
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              CampusPrice
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)'
            }}>
              Decision Support PS 2.4
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Enterprise Revenue & Affordability Governance
          </div>
        </div>
      </div>

      {/* Main Navigation Segments */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: 'var(--bg-canvas)',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveScreen(item.id);
                setActiveRole('owner');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Separator */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Student View Portal Tab */}
        <button
          onClick={() => {
            setActiveScreen(SCREENS.STUDENT_BUDGET);
            setActiveRole('student');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: activeScreen === SCREENS.STUDENT_BUDGET ? 600 : 500,
            color: activeScreen === SCREENS.STUDENT_BUDGET ? '#ffffff' : '#38bdf8',
            backgroundColor: activeScreen === SCREENS.STUDENT_BUDGET ? 'var(--accent-blue)' : 'rgba(56, 189, 248, 0.08)',
            border: activeScreen === SCREENS.STUDENT_BUDGET ? '1px solid var(--accent-blue)' : '1px solid rgba(56, 189, 248, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Smartphone size={13} />
          <span>Student Portal</span>
        </button>
      </nav>

      {/* Corporate Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Guardrails Button */}
        <button
          onClick={onOpenGuardrails}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.7rem' }}
          title="Open Owner Guardrails Configuration"
        >
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>Guardrails</span>
          <span style={{
            fontSize: '0.68rem',
            color: 'var(--accent-emerald)',
            backgroundColor: 'var(--accent-emerald-subtle)',
            padding: '1px 4px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)'
          }}>
            {guardrails.margin_floor_pct}% min
          </span>
        </button>

        {/* What-If Assistant Button */}
        <button
          onClick={onOpenAssistant}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: 'var(--text-secondary)' }}
          title="Query Decision Support Assistant"
        >
          <Terminal size={14} color="var(--accent-blue)" />
          <span>What-If Query</span>
        </button>

        {/* Owner Session Token */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTokenEdit(!showTokenEdit)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.65rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Active Owner Authorization Token"
          >
            <Key size={13} color="var(--accent-amber)" />
            <span className="mono" style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ownerToken ? ownerToken.substring(0, 8) + '...' : 'Auth'}
            </span>
          </button>

          {showTokenEdit && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              width: '300px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              boxShadow: 'var(--shadow-elevated)',
              zIndex: 100
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Owner Bearer Token
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '8px', lineHeight: '1.4' }}>
                Secures Part A, B, C, D, E endpoints via <code className="mono" style={{ color: 'var(--text-secondary)' }}>Authorization: Bearer</code> header.
              </p>
              <form onSubmit={handleSaveToken}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter session token..."
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
                    Save Token
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
