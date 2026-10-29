import React from 'react';
import { 
  Store, 
  Sliders, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SCREENS } from './Navbar';

export const Sidebar = ({ 
  activeScreen, 
  setActiveScreen
}) => {
  const { setActiveRole } = useAuth();

  const navItems = [
    { id: SCREENS.MENU_HEALTH, label: 'Menu Health & Sales', icon: Store, role: 'owner' },
    { id: SCREENS.DEMAND_LAB, label: 'Demand Lab', icon: Sliders, role: 'owner' },
    { id: SCREENS.SCENARIOS, label: 'Scenario Compare', icon: TrendingUp, role: 'owner' },
    { id: SCREENS.COMBO_STUDIO, label: 'Combo Studio', icon: Layers, role: 'owner' },
    { id: SCREENS.RECOMMENDATIONS, label: 'Recommendations', icon: Sparkles, role: 'owner' },
    { id: SCREENS.STUDENT_BUDGET, label: 'Student View', icon: Smartphone, role: 'student' }
  ];

  return (
    <aside style={{
      width: '84px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      backgroundColor: 'var(--bg-canvas)',
      flexShrink: 0,
      zIndex: 50,
      userSelect: 'none'
    }}>
      {/* Top Brand Logo Mark */}
      <div 
        onClick={() => {
          setActiveScreen(SCREENS.MENU_HEALTH);
          setActiveRole('owner');
        }}
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="CampusPrice Executive Dashboard"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M7 4C4.23858 4 2 6.23858 2 9V19C2 21.7614 4.23858 24 7 24C9.76142 24 12 21.7614 12 19V9C12 6.23858 9.76142 4 7 4Z" fill="var(--text-primary)"/>
          <path d="M19 4C16.2386 4 14 6.23858 14 9V14C14 16.7614 16.2386 19 19 19C21.7614 19 24 16.7614 24 14V9C24 6.23858 21.7614 4 19 4Z" fill="var(--text-primary)"/>
          <circle cx="21" cy="21" r="3" fill="var(--accent-green)"/>
        </svg>
      </div>

      {/* Center Floating Dock Capsule */}
      <nav style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: '30px',
        padding: '10px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        boxShadow: 'var(--shadow-dock)'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveScreen(item.id);
                setActiveRole(item.role);
              }}
              className={`nav-tab-btn ${isActive ? 'is-active' : ''}`}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--nav-btn-active-bg)' : 'transparent',
                color: isActive ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.16)' : 'none'
              }}
              title={item.label}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </nav>

      {/* Bottom Spacer to keep dock centered */}
      <div style={{ width: '38px', height: '38px' }} />
    </aside>
  );
};

