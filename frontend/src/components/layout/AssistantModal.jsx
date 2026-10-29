import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAssistant } from '../../hooks/useAssistant';
import { Terminal, Send, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

const SUGGESTED_QUERIES = [
  'What if I lower Hyderabadi Chicken Biryani to ₹115 during exam week?',
  'Why does pairing Masala Dosa with Masala Chai suffer high cannibalisation?',
  'How do I lift lunch revenue without breaching the ₹110 student price cap?',
  'Which add-on gives the highest additive margin with Veg Thali?'
];

export const AssistantModal = ({ isOpen, onClose, onApplyScenario }) => {
  const [queryInput, setQueryInput] = useState('');
  const { response, loading, error, ask, reset } = useAssistant();

  const handleSend = (textToSend) => {
    const text = textToSend || queryInput;
    if (!text.trim()) return;
    ask(text);
  };

  const handleClose = () => {
    reset();
    setQueryInput('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Decision Support What-If Assistant (Part G: /assistant/query)"
      subtitle="Evaluates hypothetical pricing decisions using log-linear demand & cannibalisation models"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Input box */}
        <div>
          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 8px'
          }}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g. What if I lower Biryani to ₹110 on exam days?"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                padding: '4px'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !queryInput.trim()}
              className="btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            >
              {loading ? (
                <span>Evaluating...</span>
              ) : (
                <>
                  <span>Simulate</span>
                  <Send size={12} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Query Presets */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
            <BookOpen size={12} />
            <span>Example Analytical Scenarios:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SUGGESTED_QUERIES.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQueryInput(sq);
                  handleSend(sq);
                }}
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-rose-subtle)',
            border: '1px solid var(--accent-rose-border)',
            color: 'var(--accent-rose)',
            fontSize: '0.78rem'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Response Box */}
        {response && (
          <div className="panel" style={{
            padding: '1.2rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                <Terminal size={14} color="var(--accent-blue)" />
                <span>Analytical Engine Output</span>
              </div>
              {response.confidence && (
                <span className="badge badge-star" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                  Confidence: {Math.round(response.confidence * 100)}%
                </span>
              )}
            </div>

            <div style={{
              fontSize: '0.82rem',
              lineHeight: '1.55',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-line'
            }}>
              {response.explanation}
            </div>

            {response.suggested_scenario && (
              <div style={{
                marginTop: '0.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generated Test Configuration:</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {response.suggested_scenario.name}
                  </div>
                </div>

                {onApplyScenario && (
                  <button
                    onClick={() => {
                      onApplyScenario(response.suggested_scenario);
                      handleClose();
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                  >
                    <span>Import into Scenario Compare</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
