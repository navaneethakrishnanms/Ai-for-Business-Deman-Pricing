import React from 'react';
import { Calendar, BookOpen, Coffee, Award } from 'lucide-react';
import { DAY_TYPES } from '../../constants/apiRoutes';

const icons = {
  regular: Calendar,
  exam: BookOpen,
  weekend: Coffee,
  event: Award
};

export const DayTypeSelector = ({ selected, onChange, fairnessActive = true }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: 'var(--bg-canvas)',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap'
      }}>
        {DAY_TYPES.map((dt) => {
          const Icon = icons[dt.id] || Calendar;
          const isSelected = selected === dt.id;
          return (
            <button
              key={dt.id}
              type="button"
              onClick={() => onChange(dt.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
            >
              <Icon size={14} color={isSelected ? 'var(--accent-blue)' : 'currentColor'} />
              <span>{dt.label}</span>
            </button>
          );
        })}
      </div>

      {fairnessActive && (selected === 'exam' || selected === 'event') && (
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--accent-amber)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: 'var(--accent-amber-subtle)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--accent-amber-border)'
        }}>
          <span>⚖️ Fairness Rule Active: Algorithmic surge pricing during exam/event windows is suppressed.</span>
        </div>
      )}
    </div>
  );
};
