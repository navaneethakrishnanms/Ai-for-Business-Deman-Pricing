import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { useGuardrailsContext } from '../../context/GuardrailsContext';
import { GuardrailsModal } from './GuardrailsModal';
import { ItemDetailsCard } from './ItemDetailsCard';
import { formatINR } from '../../utils/formatters';
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  DollarSign, 
  Utensils
} from 'lucide-react';

export const MenuHealth = ({ onNavigateToDemandLab }) => {
  const { items, loading } = useMenu();

  const [activeView, setActiveView] = useState('bento'); // 'bento' | 'table'
  const [transactionTab, setTransactionTab] = useState('All');
  const [menuHighlightTab, setMenuHighlightTab] = useState('Trending');
  const [highlightDishIndex, setHighlightDishIndex] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);

  // Dishes for Menu Highlights carousel
  const highlightDishes = [
    {
      name: 'Hyderabadi Chicken Biryani',
      category: 'Top Seller',
      salesGrowth: '+12% Sales',
      avgWeekly: 'Avg weekly sales 430 units',
      price: 120,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: 'item_biryani'
    },
    {
      name: 'Spicy Paneer Tikka Kathi Roll',
      category: 'Trending',
      salesGrowth: '+18% Sales',
      avgWeekly: 'Avg weekly sales 310 units',
      price: 80,
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: 'item_paneer_roll'
    },
    {
      name: 'Thick Cold Coffee Frappe',
      category: 'Highest Margin',
      salesGrowth: '+25% Sales',
      avgWeekly: 'Avg weekly sales 520 units',
      price: 45,
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: 'addon_cold_coffee'
    }
  ];

  // Suggestions for Eva / Co-pilot card
  const coPilotSuggestions = [
    {
      title: "Spicy Paneer Roll + Cold Coffee",
      description: "Sales up 20% last week when bundled! Apply combo discount to lift gross margin.",
      lastWeek: '28k',
      thisWeek: '36k',
      delta: '+28%',
      action: 'Apply Combo',
      targetScreen: 'combo_studio'
    },
    {
      title: "Masala Dosa Repositioning",
      description: "Current margin 18.4% breaches 22% floor. Reposition to ₹72 to restore profitability.",
      lastWeek: '12k',
      thisWeek: '18k',
      delta: '+48%',
      action: 'Simulate in Lab',
      targetScreen: 'demand_lab'
    }
  ];

  // Recent transactions feed
  const transactions = [
    { billNo: 'Bill No. #2451', mode: 'Dine In · 12 Apr, 09:31 AM', amount: 120, item: 'Biryani Combo' },
    { billNo: 'Bill No. #2452', mode: 'Take Out · 12 Apr, 09:45 AM', amount: 95, item: 'Deluxe Veg Thali' },
    { billNo: 'Bill No. #2453', mode: 'Dine In · 12 Apr, 10:12 AM', amount: 65, item: 'Crispy Butter Dosa' },
    { billNo: 'Bill No. #2454', mode: 'Take Out · 12 Apr, 10:30 AM', amount: 80, item: 'Paneer Tikka Roll' }
  ];

  const currentHighlight = highlightDishes[highlightDishIndex];
  const currentSuggestion = coPilotSuggestions[suggestionIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Sub-header Controls / View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveView('bento')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: activeView === 'bento' ? '1px solid var(--accent-green-border)' : '1px solid transparent',
              backgroundColor: activeView === 'bento' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeView === 'bento' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeView === 'bento' ? 'var(--shadow-card)' : 'none'
            }}
          >
            Bento Overview
          </button>
          <button
            onClick={() => setActiveView('table')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: activeView === 'table' ? '1px solid var(--accent-green-border)' : '1px solid transparent',
              backgroundColor: activeView === 'table' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeView === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeView === 'table' ? 'var(--shadow-card)' : 'none'
            }}
          >
            Inventory Table ({items.length})
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Owner Console · Auto-synced with Python API
        </span>
      </div>

      {activeView === 'bento' ? (
        /* ================= BENTO GRID DASHBOARD MATCHING USER SCREENSHOT ================= */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1.35fr 1.15fr',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}>
          
          {/* ================= COLUMN 1 (LEFT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Card 1: Outlet Showcase / Ambience Card */}
            <div className="bento-card" style={{ padding: '0.85rem', overflow: 'hidden' }}>
              <div style={{
                height: '180px',
                borderRadius: '14px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.85rem'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=650&h=420&q=80"
                  alt="Campus Diner"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '0 0.4rem 0.4rem 0.4rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Lumière & Vine
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0.85rem 0' }}>
                  Campus Central Cafeteria, Block 3
                </p>

                {/* Highlight Info Pill (Green Plus pill from screenshot) */}
                <div style={{
                  backgroundColor: 'var(--accent-green-subtle)',
                  border: '1px solid var(--accent-green-border)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-green-subtle)',
                      color: 'var(--accent-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      ✦
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      Busiest time today was <strong>12–2 PM</strong>, with orders up <strong>30%</strong> compared to yesterday
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    1/3
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Transactions Feed (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.15rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Utensils size={14} />
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Recent Transactions
                  </h4>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              </div>

              {/* Filter Pills (All, Dine In, Take Out, Delivery) */}
              <div style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: 'var(--bg-surface-inset)',
                padding: '3px',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '1rem',
                border: '1px solid var(--border-subtle)'
              }}>
                {['All', 'Dine In', 'Take Out', 'Delivery'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTransactionTab(tab)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-pill)',
                      border: 'none',
                      backgroundColor: transactionTab === tab ? 'var(--bg-surface-elevated)' : 'transparent',
                      color: transactionTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: transactionTab === tab ? 'var(--shadow-card)' : 'none'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '0.65rem',
                      borderBottom: idx < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.billNo}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {tx.mode}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {formatINR(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ================= COLUMN 2 (CENTER) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Card 3: Total Revenue with Green Bar Sparklines (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <DollarSign size={15} />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Total Revenue
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* +12% Mint pill */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--accent-green-subtle)',
                    color: 'var(--accent-green)',
                    border: '1px solid var(--accent-green-border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '2px 8px'
                  }}>
                    +12%
                  </span>
                  <ChevronRight size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                <div>
                  <div className="mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    ₹ 456,872
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Avg weekly sales ₹430k
                  </div>
                </div>

                {/* Vertical Bar Sparkline (Exact replica of the vertical bar chart in the screenshot) */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '65px', paddingBottom: '2px' }}>
                  {[18, 24, 30, 22, 28, 38, 45, 52, 60, 50, 68, 85, 95, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '3.5px',
                        height: `${h}%`,
                        borderRadius: '2px',
                        background: i > 9 
                          ? 'linear-gradient(180deg, var(--accent-green-bright), var(--accent-green))' 
                          : 'var(--border-strong)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4: Profitability Bar Chart (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <TrendingUp size={15} />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Profitability
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}>
                  <span>Last 4 Days</span>
                  <ChevronDown size={13} color="var(--text-secondary)" />
                </div>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹ 56,872
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Avg Net Profitability
                </div>
              </div>

              {/* Vertical Rounded Gradient Bar Chart (from screenshot) */}
              <div style={{
                height: '140px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '1.25rem',
                padding: '0 1rem'
              }}>
                {[
                  { revHeight: 55, expHeight: 40, hasRed: false },
                  { revHeight: 45, expHeight: 35, hasRed: false },
                  { revHeight: 35, expHeight: 65, hasRed: true },
                  { revHeight: 80, expHeight: 50, hasRed: false },
                  { revHeight: 90, expHeight: 60, hasRed: false },
                  { revHeight: 70, expHeight: 45, hasRed: false }
                ].map((col, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '26px',
                      height: `${col.revHeight}%`,
                      borderRadius: '6px',
                      background: col.hasRed
                        ? 'linear-gradient(180deg, var(--accent-green) 60%, var(--accent-rose) 100%)'
                        : 'linear-gradient(180deg, var(--accent-green-bright), var(--accent-green))',
                      boxShadow: 'var(--shadow-card)'
                    }} />
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '1rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />
                  Revenue
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                  Expenses
                </span>
              </div>
            </div>

            {/* Card 5: Rating / Student Affordability Guarantee Progress Meter (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500, maxWidth: '280px' }}>
                  <strong>72% of students</strong> rated pricing fair & affordable last week!
                </p>
                <ChevronRight size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              </div>

              {/* Pill Progress Bar with 72% Badge */}
              <div style={{
                height: '32px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--bg-surface-inset)',
                border: '1px solid var(--border-subtle)',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: '72%',
                  background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-green-bright))',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '6px'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)'
                  }}>
                    72%
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= COLUMN 3 (RIGHT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Card 6: Menu Highlights / Spotlight Dish Carousel (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Sparkles size={14} />
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Menu Highlights
                  </h4>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              </div>

              {/* Tabs: Trending, Top Sellers, Highest Margin */}
              <div style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: 'var(--bg-surface-inset)',
                padding: '3px',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '1rem',
                border: '1px solid var(--border-subtle)'
              }}>
                {['Trending', 'Top Sellers', 'Highest Margin'].map(t => (
                  <button
                    key={t}
                    onClick={() => setMenuHighlightTab(t)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-pill)',
                      border: 'none',
                      backgroundColor: menuHighlightTab === t ? 'var(--bg-surface-elevated)' : 'transparent',
                      color: menuHighlightTab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: menuHighlightTab === t ? 'var(--shadow-card)' : 'none'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Spotlight Circular Dish & Navigation Carousel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
                <button
                  onClick={() => setHighlightDishIndex((prev) => (prev > 0 ? prev - 1 : highlightDishes.length - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Dish Photo with +12% Sales badge */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-elevated)'
                  }}>
                    <img
                      src={currentHighlight.image}
                      alt={currentHighlight.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Mint Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    backgroundColor: 'var(--accent-green)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    boxShadow: 'var(--shadow-card)'
                  }}>
                    {currentHighlight.salesGrowth}
                  </span>
                </div>

                <button
                  onClick={() => setHighlightDishIndex((prev) => (prev < highlightDishes.length - 1 ? prev + 1 : 0))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {currentHighlight.name}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentHighlight.avgWeekly}
                </p>
                <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
                  {formatINR(currentHighlight.price)}
                </div>
              </div>
            </div>

            {/* Card 7: Eva Suggestions / Decision Support Card (from screenshot) */}
            <div className="bento-card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-green-subtle)',
                      color: 'var(--accent-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      ✦
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Eva Suggestions
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setSuggestionIndex((prev) => (prev > 0 ? prev - 1 : coPilotSuggestions.length - 1))}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setSuggestionIndex((prev) => (prev < coPilotSuggestions.length - 1 ? prev + 1 : 0))}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {currentSuggestion.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {currentSuggestion.description}
                </p>
              </div>

              {/* Comparative Performance Blocks (Last Week vs This Week from screenshot) */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '1.15rem' }}>
                <div style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Last Week</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentSuggestion.lastWeek}
                  </div>
                </div>

                {/* Highlighted Gradient Green Block */}
                <div style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-green-subtle)',
                  border: '1px solid var(--accent-green-border)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '2px' }}>This Week</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {currentSuggestion.thisWeek}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onNavigateToDemandLab && onNavigateToDemandLab('item_biryani')}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.5rem' }}
                >
                  <span>{currentSuggestion.action}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ================= FULL CATALOG TABLE VIEW (Contract Part A) ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="bento-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
              Full Cafeteria Inventory & Gross Margins ({items.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
              {items.map(item => (
                <ItemDetailsCard
                  key={item.item_id}
                  item={item}
                  onSelectForDemandLab={onNavigateToDemandLab}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Owner Guardrails Modal */}
      <GuardrailsModal
        isOpen={isGuardrailsOpen}
        onClose={() => setIsGuardrailsOpen(false)}
      />
    </div>
  );
};
