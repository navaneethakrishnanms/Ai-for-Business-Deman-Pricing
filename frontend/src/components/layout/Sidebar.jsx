import React, { useState } from 'react';
import { 
  Activity, 
  Sliders, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle, 
  Smartphone, 
  ShieldCheck, 
  Terminal,
  History,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModelStatus } from '../../hooks/useModelStatus';
import { SCREENS } from './Navbar';

export const Sidebar = ({ 
  activeScreen, 
  setActiveScreen, 
  onOpenGuardrails, 
  onOpenAssistant, 
  isCollapsed, 
  setIsCollapsed 
}) => {
  const { setActiveRole } = useAuth();
  const { status } = useModelStatus();

  const navGroups = [
    {
      group: 'PRICING & REVENUE LABS',
      items: [
        { id: SCREENS.MENU_HEALTH, label: 'Menu Health', icon: Activity, role: 'owner', tag: 'Part A' },
        { id: SCREENS.DEMAND_LAB, label: 'Demand Lab', icon: Sliders, role: 'owner', tag: 'Part B' },
        { id: SCREENS.SCENARIOS, label: 'Scenario Compare', icon: TrendingUp, role: 'owner', tag: 'Part C' },
        { id: SCREENS.COMBO_STUDIO, label: 'Combo Studio', icon: ShoppingBag, role: 'owner', tag: 'Part D' },
        { id: SCREENS.RECOMMENDATIONS, label: 'Recommendations', icon: CheckCircle, role: 'owner', tag: 'Part E' }
      ]
    },
    {
      group: 'STUDENT ACCESSIBILITY',
      items: [
        { id: SCREENS.STUDENT_BUDGET, label: 'Student Portal', icon: Smartphone, role: 'student', tag: 'Part F', highlight: true }
      ]
    }
  ];

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Top Brand Banner */}
      <div>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: '64px'
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                CP
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    CampusPrice
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}>
                    2.4
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  Decision Support Engine
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}>
              CP
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{ padding: '0.85rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {!isCollapsed && (
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.5rem',
                  marginBottom: '2px'
                }}>
                  {group.group}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setActiveRole(item.role);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      gap: '10px',
                      padding: isCollapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.12s ease',
                      backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    title={isCollapsed ? item.label : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color={isActive ? '#ffffff' : item.highlight ? '#38bdf8' : '#94a3b8'} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.tag && (
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#ffffff' : '#94a3b8'
                      }}>
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Governance & Tools Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.5rem',
                marginBottom: '2px'
              }}>
                CONTROLS & QUERIES
              </div>
            )}

            <button
              onClick={onOpenGuardrails}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '10px',
                padding: isCollapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                width: '100%'
              }}
              title="Guardrails Config"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              {!isCollapsed && <span>Guardrails Config</span>}
            </button>

            <button
              onClick={onOpenAssistant}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '10px',
                padding: isCollapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                width: '100%'
              }}
              title="What-If Query"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Terminal size={16} color="#38bdf8" />
              {!isCollapsed && <span>What-If Query</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Bottom / Health Widget */}
      {!isCollapsed ? (
        <div style={{
          padding: '0.85rem',
          margin: '0.65rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.72rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Cpu size={13} color="var(--accent-emerald)" />
              <span>Model State</span>
            </span>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-emerald)',
              display: 'inline-block'
            }} />
          </div>
          <div className="mono" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }}>
            {status?.model_version || 'v2.4-bayes'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.68rem' }}>
            120-Day Synthetic Calibration
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-emerald)',
            display: 'inline-block'
          }} title="Model Engine Active" />
        </div>
      )}
    </aside>
  );
};
