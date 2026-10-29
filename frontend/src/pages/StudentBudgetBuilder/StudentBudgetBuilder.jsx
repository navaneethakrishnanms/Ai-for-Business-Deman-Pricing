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
          {quickPresets.map(preset => {
            const isSelected = budget === preset;
            return (
              <button
                key={preset}
                onClick={() => handleBudgetChange(preset)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--accent-blue-subtle)' : 'var(--bg-surface-inset)',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ₹{preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[
          { id: 'all', label: `All Offers (${offers.combos.length + offers.single_items.length})` },
          { id: 'combos', label: `Combos (${offers.combos.length})` },
          { id: 'singles', label: `Single Dishes (${offers.single_items.length})` }
        ].map(tab => {
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                border: isTabActive ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
                backgroundColor: isTabActive ? 'var(--nav-btn-active-bg)' : 'transparent',
                color: isTabActive ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Offers Results Section */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Querying meals for ₹{budget}...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Combos list */}
          {(activeTab === 'all' || activeTab === 'combos') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                  Curated Meal Combos ({offers.combos.length})
                </h4>
              </div>

              {offers.combos.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '12px', backgroundColor: 'var(--bg-surface-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  No complete combos available under ₹{budget}. Increase your budget slider or select single dishes below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {offers.combos.map((combo, idx) => (
                    <OfferCard key={combo.combo_id || combo.offer_id ? `${combo.combo_id || combo.offer_id}-${idx}` : `combo-${idx}`} offer={combo} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single Items list */}
          {(activeTab === 'all' || activeTab === 'singles') && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Utensils size={14} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                  Single Dishes & Value Tiers ({offers.single_items.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {offers.single_items.map((item, idx) => (
                  <div
                    key={`${item.item_id || 'item'}-${idx}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Portion: {item.portion_size_g}g
                        {item.price_per_100g > 0 && (
                          <span> · <strong className="mono" style={{ color: 'var(--text-primary)' }}>₹{item.price_per_100g}</strong>/100g</span>
                        )}
                        {item.tier && item.tier !== 'regular' && (
                          <span> · <span style={{ textTransform: 'capitalize', color: 'var(--accent-blue)' }}>{item.tier} portion</span></span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Action Bar with View Mode Toggle */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <button
            onClick={() => setPhoneFrameMode(true)}
            style={{
              backgroundColor: phoneFrameMode ? 'var(--nav-btn-active-bg)' : 'transparent',
              color: phoneFrameMode ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={13} />
            <span>Mobile Device View</span>
          </button>

          <button
            onClick={() => setPhoneFrameMode(false)}
            style={{
              backgroundColor: !phoneFrameMode ? 'var(--nav-btn-active-bg)' : 'transparent',
              color: !phoneFrameMode ? 'var(--nav-btn-active-color)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
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
        <div className="bento-card" style={{ width: '100%', maxWidth: '840px', padding: '1.75rem' }}>
          {content}
        </div>
      )}
    </div>
  );
};
