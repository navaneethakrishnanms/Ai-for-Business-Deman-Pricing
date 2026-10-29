import React from 'react';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatINR } from '../../utils/formatters';
import { CheckCircle2, Edit3, XCircle, Clock } from 'lucide-react';

export const OverridesLogModal = ({ isOpen, onClose, overrides = [] }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Owner Decision Audit Log (GET /overrides)"
      subtitle="Historical record of owner approvals, edits, and rejections used for offline policy learning"
      maxWidth="720px"
    >
      {overrides.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          No override decisions logged yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {overrides.map((log) => {
            let badgeColor = '#34d399';
            let Icon = CheckCircle2;
            if (log.decision === 'reject') {
              badgeColor = '#fb7185';
              Icon = XCircle;
            } else if (log.decision === 'edit') {
              badgeColor = '#fbbf24';
              Icon = Edit3;
            }

            return (
              <div
                key={log.override_id}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={15} color={badgeColor} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: badgeColor }}>
                      {log.decision}
                    </span>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      [{log.rec_id}]
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {formatDate(log.decided_at)}
                  </span>
                </div>

                {log.edited_value !== null && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    Owner Custom Value: <strong>{formatINR(log.edited_value)}</strong>
                  </div>
                )}

                {log.note && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    "{log.note}"
                  </p>
                )}

                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Decided By: {log.decided_by} · ID: {log.override_id}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

