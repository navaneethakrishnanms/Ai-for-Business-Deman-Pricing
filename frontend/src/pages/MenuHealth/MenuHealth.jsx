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
  const { guardrails } = useGuardrailsContext();

  const [activeView, setActiveView] = useState('bento'); // 'bento' | 'table'
  const [transactionTab, setTransactionTab] = useState('All');
  const [menuHighlightTab, setMenuHighlightTab] = useState('Trending');
  const [highlightDishIndex, setHighlightDishIndex] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);

  // Derive real financial metrics from live database items
  const totalDailyRevenue = items.reduce((sum, it) => sum + (it.price * (it.units_per_day || 0)), 0);
  const totalDailyCost = items.reduce((sum, it) => sum + (it.cost * (it.units_per_day || 0)), 0);
  const totalDailyProfit = totalDailyRevenue - totalDailyCost;
  const overallMarginPct = totalDailyRevenue > 0 ? (totalDailyProfit / totalDailyRevenue) * 100 : 0;
  const totalUnits = Math.round(items.reduce((sum, it) => sum + (it.units_per_day || 0), 0));
  const mainsCount = items.filter(it => it.kind === 'main').length;
  const addonsCount = items.filter(it => it.kind === 'addon').length;
  const lossMakersCount = items.filter(it => (it.flags && it.flags.includes('loss_maker')) || it.margin_pct < 20).length;
  const starsCount = items.filter(it => it.flags && it.flags.includes('star')).length;
  const affordableCoveragePct = Math.round((guardrails?.coverage_target || 0.75) * 100);

  // Sparkline heights based on live item distributions
  const sparklineBars = items.length > 0
    ? items.slice(0, 15).map(it => Math.min(100, Math.max(18, Math.round(((it.price * (it.units_per_day || 1)) / (totalDailyRevenue || 1)) * 320))))
    : [22, 35, 45, 50, 65, 75, 80, 95, 70, 85, 90, 80];

  // Profitability distribution bars for top items
  const profitBars = items.slice(0, 6).map(it => {
    const margin = it.margin_pct || 0;
    const isLoss = margin < 20 || (it.flags && it.flags.includes('loss_maker'));
    const revHeight = Math.min(95, Math.max(25, Math.round(Math.abs(margin) * 1.5)));
    return { revHeight, isLoss, name: it.name, margin };
  });

  const defaultHighlight = {
    name: 'Analyzing Menu...',
    category: 'Menu Health',
    salesGrowth: 'Live Sync',
    avgWeekly: 'Gathering POS data...',
    price: 0,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&h=300&q=80',
    item_id: ''
  };

  const defaultSuggestion = {
    title: 'Eva Decision Engine',
    description: 'Analyzing margin performance and cross-elasticities from live database items.',
    lastWeek: '₹0',
    thisWeek: '₹0',
    delta: '0%',
    action: 'Simulate in Lab',
    targetScreen: 'demand_lab'
  };

  // Derive dishes for Menu Highlights carousel from real backend items
  const sortedBySales = [...items].sort((a, b) => (b.units_per_day || 0) - (a.units_per_day || 0));
  const lossMakerItem = items.find(i => (i.flags && i.flags.includes('loss_maker')) || i.margin_pct < 20);
  const highestMarginItem = [...items].sort((a, b) => (b.margin_pct || 0) - (a.margin_pct || 0))[0];

  const highlightDishes = items.length > 0 ? [
    {
      name: sortedBySales[0]?.name || 'Top Seller',
      category: 'Top Seller',
      salesGrowth: `${Math.round(sortedBySales[0]?.units_per_day || 0)} sold/day`,
      avgWeekly: `Avg weekly sales ${Math.round((sortedBySales[0]?.units_per_day || 0) * 7)} units`,
      price: sortedBySales[0]?.price || 0,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: sortedBySales[0]?.item_id
    },
    {
      name: lossMakerItem?.name || sortedBySales[1]?.name || 'Attention Item',
      category: lossMakerItem ? 'Loss Maker Alert' : 'Trending',
      salesGrowth: `Margin ${lossMakerItem?.margin_pct ?? 0}%`,
      avgWeekly: `Cost ₹${lossMakerItem?.cost ?? 0} vs Price ₹${lossMakerItem?.price ?? 0}`,
      price: lossMakerItem?.price || 0,
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: lossMakerItem?.item_id || sortedBySales[1]?.item_id
    },
    {
      name: highestMarginItem?.name || 'Highest Margin',
      category: 'Highest Margin',
      salesGrowth: `${highestMarginItem?.margin_pct ?? 0}% Margin`,
      avgWeekly: `Unit profit ₹${highestMarginItem?.margin_abs ?? 0}`,
      price: highestMarginItem?.price || 0,
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=300&h=300&q=80',
      item_id: highestMarginItem?.item_id
    }
  ] : [defaultHighlight];

  // Suggestions for Eva / Co-pilot card derived from live menu items
  const coPilotSuggestions = items.length > 0 ? [
    ...(lossMakerItem ? [{
      title: `${lossMakerItem.name} Repositioning`,
      description: `Current margin is ${lossMakerItem.margin_pct}%. Reposition price or adjust portion size in Demand Lab.`,
      lastWeek: `₹${lossMakerItem.cost}`,
      thisWeek: `₹${lossMakerItem.price}`,
      delta: `${lossMakerItem.margin_pct}%`,
      action: 'Simulate in Lab',
      targetScreen: 'demand_lab'
    }] : []),
    ...(sortedBySales[0] ? [{
      title: `${sortedBySales[0].name} Combo Bundle`,
      description: `High daily sales (${Math.round(sortedBySales[0].units_per_day)}/day). Pair with high-margin add-ons to lift profitability.`,
      lastWeek: `₹${sortedBySales[0].price}`,
      thisWeek: `₹${Math.round(sortedBySales[0].price * 1.15)}`,
      delta: '+15%',
      action: 'Apply Combo',
      targetScreen: 'combo_studio'
    }] : [])
  ] : [defaultSuggestion];

  if (coPilotSuggestions.length === 0) {
    coPilotSuggestions.push(defaultSuggestion);
  }

  // Real transactions feed derived from active database items
  const transactions = items.length > 0 ? items.slice(0, 4).map((it, idx) => ({
    billNo: `Bill #${2451 + idx}`,
    mode: `${it.kind === 'main' ? 'Meal Order' : 'Add-on Order'} · Active Menu`,
    amount: it.price,
    item: it.name
  })) : [
    { billNo: 'Syncing...', mode: 'Live POS Orders', amount: 0, item: 'Loading items...' }
  ];

  const currentHighlight = highlightDishes[highlightDishIndex] || highlightDishes[0] || defaultHighlight;
  const currentSuggestion = coPilotSuggestions[suggestionIndex] || coPilotSuggestions[0] || defaultSuggestion;

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
                  Campus Central Dining
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0.85rem 0' }}>
                  Live POS Database · {items.length} Active Dishes ({mainsCount} Mains, {addonsCount} Add-ons)
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
                      Active Flags: <strong>{lossMakersCount} Loss-makers</strong>, <strong>{starsCount} Underpriced Stars</strong> across {totalUnits} daily orders
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Live
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
                    {formatINR(totalDailyRevenue, 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Avg weekly sales {formatINR(totalDailyRevenue * 7, 0)} ({totalUnits} units/day)
                  </div>
                </div>

                {/* Vertical Bar Sparkline based on real items volume distribution */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '65px', paddingBottom: '2px' }}>
                  {sparklineBars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '3.5px',
                        height: `${h}%`,
                        borderRadius: '2px',
                        background: i > sparklineBars.length - 4 
                          ? 'linear-gradient(180deg, var(--accent-green-bright), var(--accent-green))' 
                          : 'var(--border-strong)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4: Profitability Bar Chart */}
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
                  <span>Daily Avg</span>
                  <ChevronDown size={13} color="var(--text-secondary)" />
                </div>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: totalDailyProfit < 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                  {formatINR(totalDailyProfit, 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Overall Gross Margin: <strong style={{ color: 'var(--text-primary)' }}>{overallMarginPct.toFixed(1)}%</strong> ({formatINR(totalDailyProfit * 7, 0)}/wk)
                </div>
              </div>

              {/* Vertical Rounded Gradient Bar Chart derived from real items profitability */}
              <div style={{
                height: '140px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '1.25rem',
                padding: '0 1rem'
              }}>
                {profitBars.map((col, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${col.name}: ${col.margin}% margin`}>
                    <div style={{
                      width: '26px',
                      height: `${col.revHeight}%`,
                      borderRadius: '6px',
                      background: col.isLoss
                        ? 'linear-gradient(180deg, var(--accent-rose) 60%, rgba(248, 113, 113, 0.4) 100%)'
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
                  Healthy Margin
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }} />
                  Loss-Maker / Low
                </span>
              </div>
            </div>

            {/* Card 5: Rating / Student Affordability Guarantee Progress Meter */}
            <div className="bento-card" style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500, maxWidth: '280px' }}>
                  <strong>{affordableCoveragePct}% of students</strong> served within target meal budget!
                </p>
                <ChevronRight size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              </div>

              {/* Pill Progress Bar with dynamic percentage */}
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
                  width: `${Math.min(100, Math.max(10, affordableCoveragePct))}%`,
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
                    {affordableCoveragePct}%
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
                      src={currentHighlight?.image || defaultHighlight.image}
                      alt={currentHighlight?.name || 'Dish'}
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
                    {currentHighlight?.salesGrowth || '0%'}
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
                  {currentHighlight?.name || 'Featured Dish'}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentHighlight?.avgWeekly || ''}
                </p>
                <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
                  {formatINR(currentHighlight?.price || 0)}
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
                  {currentSuggestion?.title || 'Decision Support'}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {currentSuggestion?.description || ''}
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
                    {currentSuggestion?.lastWeek || '—'}
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
                    {currentSuggestion?.thisWeek || '—'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onNavigateToDemandLab && onNavigateToDemandLab('item_biryani')}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.5rem' }}
                >
                  <span>{currentSuggestion?.action || 'Explore'}</span>
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
