import React, { useState } from 'react';
import { useStudentOffers } from '../../hooks/useStudentOffers';
import { OfferCard } from './OfferCard';
import { formatINR } from '../../utils/formatters';
import { 
  Smartphone, 
  Monitor, 
  Wallet, 
  Utensils
} from 'lucide-react';

export const StudentBudgetBuilder = () => {
  const [budgetInput, setBudgetInput] = useState(100);
  const [phoneFrameMode, setPhoneFrameMode] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const { budget, setBudget, offers, loading } = useStudentOffers(budgetInput);

  const handleBudgetChange = (val) => {
    const num = Math.max(20, Math.min(250, parseInt(val, 10) || 20));
    setBudgetInput(num);
    setBudget(num);
  };

  const quickPresets = [50, 75, 100, 130];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Student View Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
            Unauthenticated · Rate-Limited
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Contract Part F · GET /student/offers
          </span>
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Campus Student Meal Finder
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: '1.4' }}>
          Select your meal budget. We curate complete, high-nutrition meal combinations and value portions that fit your target.
        </p>
      </div>

      {/* Budget Controls */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={15} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Meal Budget:
            </span>
          </div>
          <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatINR(budget, 0)}
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="30"
          max="200"
          step="5"
          value={budgetInput}
          onChange={(e) => handleBudgetChange(e.target.value)}
          style={{ width: '100%', cursor: 'pointer' }}
        />

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {quickPresets.map(preset => (
            <button
              key={preset}
              onClick={() => handleBudgetChange(preset)}
              style={{
                flex: 1,
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                border: budget === preset ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                backgroundColor: budget === preset ? 'var(--accent-blue-subtle)' : 'transparent',
                color: budget === preset ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ₹{preset}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { id: 'all', label: `All (${offers.combos.length + offers.single_items.length})` },
          { id: 'combos', label: `Combos (${offers.combos.length})` },
          { id: 'singles', label: `Dishes (${offers.single_items.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === tab.id ? '1px solid var(--border-strong)' : '1px solid transparent',
              backgroundColor: activeTab === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Results Section */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Querying meals for ₹{budget}...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Combos list */}
          {(activeTab === 'all' || activeTab === 'combos') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Curated Meal Combos ({offers.combos.length})
                </h4>
              </div>

              {offers.combos.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  No complete combos available under ₹{budget}. Increase budget or select single dishes.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {offers.combos.map((combo, idx) => (
                    <OfferCard key={combo.offer_id ? `${combo.offer_id}-${idx}` : `combo-${idx}`} offer={combo} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single Items list */}
          {(activeTab === 'all' || activeTab === 'singles') && (
            <div style={{ marginTop: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Utensils size={13} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Single Dishes & Portion Tiers ({offers.single_items.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {offers.single_items.map((item, idx) => (
                  <div
                    key={`${item.item_id || 'item'}-${idx}`}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        Portion: {item.portion_size_g}g
                        {item.portion_tiers && item.portion_tiers.length > 1 && (
                          <span> · {item.portion_tiers.length} portion sizes available</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {formatINR(item.price, 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
      {/* Screen Control Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-neutral">
              Part F · GET /student/offers
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Student Partition (Zero Internal Leakage)</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Student Budget Builder
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            Student-facing interface with zero backend unit cost, margin, or model internal leakage.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '2px'
        }}>
          <button
            onClick={() => setPhoneFrameMode(true)}
            style={{
              backgroundColor: phoneFrameMode ? 'var(--bg-surface-elevated)' : 'transparent',
              color: phoneFrameMode ? 'var(--text-primary)' : 'var(--text-muted)',
              border: phoneFrameMode ? '1px solid var(--border-medium)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Smartphone size={13} />
            <span>Mobile Device View</span>
          </button>

          <button
            onClick={() => setPhoneFrameMode(false)}
            style={{
              backgroundColor: !phoneFrameMode ? 'var(--bg-surface-elevated)' : 'transparent',
              color: !phoneFrameMode ? 'var(--text-primary)' : 'var(--text-muted)',
              border: !phoneFrameMode ? '1px solid var(--border-medium)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Monitor size={13} />
            <span>Full Desktop View</span>
          </button>
        </div>
      </div>

      {/* Presentation Container */}
      {phoneFrameMode ? (
        /* Phone Bezel Simulator */
        <div style={{
          width: '100%',
          maxWidth: '380px',
          height: '740px',
          backgroundColor: 'var(--bg-canvas)',
          borderRadius: '36px',
          border: '10px solid #1e293b',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Phone Top Speaker */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '20px',
            backgroundColor: '#1e293b',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <div style={{ width: '36px', height: '3px', backgroundColor: '#334155', borderRadius: '2px' }} />
            <div style={{ width: '6px', height: '6px', backgroundColor: '#0f172a', borderRadius: '50%' }} />
          </div>

          {/* Phone Screen Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.2rem 1rem 1.25rem 1rem',
            backgroundColor: 'var(--bg-surface)'
          }}>
            {content}
          </div>

          {/* Bottom Bar */}
          <div style={{
            height: '18px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100px', height: '3px', backgroundColor: '#334155', borderRadius: '2px' }} />
          </div>
        </div>
      ) : (
        /* Full Desktop Container */
        <div className="panel" style={{ width: '100%', maxWidth: '920px', padding: '1.75rem' }}>
          {content}
        </div>
      )}
    </div>
  );
};
