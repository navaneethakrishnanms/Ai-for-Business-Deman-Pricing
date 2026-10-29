import React from 'react';
import { Check, Clock, AlertOctagon, Flame, ShieldAlert, ArrowDownRight } from 'lucide-react';

export const StatusTag = ({ status, size = 'normal' }) => {
  if (!status) return null;
  const s = status.toLowerCase();

  const isSmall = size === 'small';
  const padding = isSmall ? '2px 6px' : '3px 10px';
  const fontSize = isSmall ? '0.68rem' : '0.72rem';
  const iconSize = isSmall ? 11 : 13;

  if (s === 'apply') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--accent-green-subtle)',
        color: 'var(--accent-green)',
        border: '1px solid var(--accent-green-border)',
        letterSpacing: '0.04em'
      }}>
        <Check size={iconSize} />
        APPLY
      </span>
    );
  }

  if (s === 'pilot') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--accent-amber-subtle)',
        color: 'var(--accent-amber)',
        border: '1px solid var(--accent-amber)',
        letterSpacing: '0.04em'
      }}>
        <Clock size={iconSize} />
        PILOT
      </span>
    );
  }

  if (s === 'hold') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--accent-rose-subtle)',
        color: 'var(--accent-rose)',
        border: '1px solid var(--accent-rose)',
        letterSpacing: '0.04em'
      }}>
        <AlertOctagon size={iconSize} />
        HOLD
      </span>
    );
  }

  if (s === 'star') {
    return (
      <span className="badge badge-star" style={{ padding, fontSize }}>
        <Flame size={iconSize} />
        Star
      </span>
    );
  }

  if (s === 'loss_maker' || s === 'below_margin_floor') {
    return (
      <span className="badge badge-loss" style={{ padding, fontSize }}>
        <ShieldAlert size={iconSize} />
        Margin Breached
      </span>
    );
  }

  if (s === 'poor_seller') {
    return (
      <span className="badge badge-poor" style={{ padding, fontSize }}>
        <ArrowDownRight size={iconSize} />
        Low Sales
      </span>
    );
  }

  if (s === 'above_student_cap') {
    return (
      <span className="badge badge-poor" style={{ padding, fontSize }}>
        Cap Exceeded
      </span>
    );
  }

  return (
    <span className="badge badge-neutral" style={{ padding, fontSize }}>
      {status}
    </span>
  );
};
