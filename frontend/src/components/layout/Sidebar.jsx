import React from 'react';
import { 
  Store, 
  Sliders, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Smartphone, 
  Settings, 
  Terminal,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SCREENS } from './Navbar';

export const Sidebar = ({ 
  activeScreen, 
  setActiveScreen, 
  onOpenGuardrails, 
  onOpenAssistant 
}) => {
  const { setActiveRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
      {/* Top Brand Logo Mark (Matching stylized curve in screenshot) */}
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
          cursor: 'pointer'
        }}
        title="CampusPrice Executive Dashboard"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M7 4C4.23858 4 2 6.23858 2 9V19C2 21.7614 4.23858 24 7 24C9.76142 24 12 21.7614 12 19V9C12 6.23858 9.76142 4 7 4Z" fill="var(--text-primary)"/>
          <path d="M19 4C16.2386 4 14 6.23858 14 9V14C14 16.7614 16.2386 19 19 19C21.7614 19 24 16.7614 24 14V9C24 6.23858 21.7614 4 19 4Z" fill="var(--text-primary)"/>
          <circle cx="21" cy="21" r="3" fill="var(--accent-green)"/>
        </svg>
      </div>

      {/* Center Floating Dock Capsule (Exact rounded dark capsule from screenshot) */}
      <nav style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: '30px',
        padding: '8px 6px',
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
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'var(--nav-btn-active-bg)' : 'transparent',
                color: isActive ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.15)' : 'none'
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

        {/* Separator */}
        <div style={{ width: '20px', height: '1px', backgroundColor: 'var(--border-subtle)', margin: '2px 0' }} />

        {/* Assistant / What-If trigger */}
        <button
          onClick={onOpenAssistant}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'var(--accent-green)',
            transition: 'all 0.15s ease'
          }}
          title="What-If AI Co-pilot"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-green-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Terminal size={18} />
        </button>
      </nav>

      {/* Bottom Profile Avatar, Theme Switcher & Settings Dock */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Quick Theme Toggle Pill in Dock */}
        <button
          onClick={toggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: isDark ? '#fbbf24' : '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User avatar */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-surface-elevated)'
        }}
        title="Owner Session"
        >
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" 
            alt="Owner"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Settings Pill */}
        <button
          onClick={onOpenGuardrails}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Guardrails & Settings"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
};
