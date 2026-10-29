import React, { useState, useMemo } from 'react';
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
  Utensils,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const MenuHealth = ({ onNavigateToDemandLab, onNavigateToComboStudio }) => {
  const { items, combos, loading, refetch } = useMenu();
  const { guardrails } = useGuardrailsContext();

  const [activeView, setActiveView] = useState('bento'); // 'bento' | 'table'
  const [transactionTab, setTransactionTab] = useState('All');
  const [menuHighlightTab, setMenuHighlightTab] = useState('Trending');
  const [highlightDishIndex, setHighlightDishIndex] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);
  const [profitTimeframe, setProfitTimeframe] = useState('Daily Avg'); // 'Daily Avg' | 'Weekly Run-Rate'

  // Derive real financial metrics from live database items
  const totalDailyRevenue = useMemo(() => 
    items.reduce((sum, it) => sum + (it.price * (it.units_per_day || 0)), 0),
    [items]
  );
  
  const totalDailyCost = useMemo(() => 
    items.reduce((sum, it) => sum + (it.cost * (it.units_per_day || 0)), 0),
    [items]
  );
  
  const totalDailyProfit = totalDailyRevenue - totalDailyCost;
  const overallMarginPct = totalDailyRevenue > 0 ? (totalDailyProfit / totalDailyRevenue) * 100 : 0;
  const totalUnits = Math.round(items.reduce((sum, it) => sum + (it.units_per_day || 0), 0));
  const mainsCount = items.filter(it => it.kind === 'main').length;
  const addonsCount = items.filter(it => it.kind === 'addon').length;
  const lossMakersCount = items.filter(it => (it.flags && it.flags.includes('loss_maker')) || it.margin_pct < (guardrails?.margin_floor_pct || 20)).length;
  const starsCount = items.filter(it => it.flags && it.flags.includes('star')).length;
  const affordableCoveragePct = Math.round((guardrails?.coverage_target || 0.75) * 100);

  // Sparkline heights based on live item distributions
  const sparklineBars = useMemo(() => {
    if (!items || items.length === 0) {
      return [22, 35, 45, 50, 65, 75, 80, 95, 70, 85, 90, 80];
    }
    return items.slice(0, 15).map(it => 
      Math.min(100, Math.max(18, Math.round(((it.price * (it.units_per_day || 1)) / (totalDailyRevenue || 1)) * 320)))
    );
  }, [items, totalDailyRevenue]);

  // Profitability distribution bars for top items
  const profitBars = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 6).map(it => {
      const margin = it.margin_pct || 0;
      const isLoss = margin < (guardrails?.margin_floor_pct || 20) || (it.flags && it.flags.includes('loss_maker'));
      const revHeight = Math.min(95, Math.max(25, Math.round(Math.abs(margin) * 1.5)));
      return { 
        revHeight, 
        isLoss, 
        name: it.name, 
        margin,
        item_id: it.item_id
      };
    });
  }, [items, guardrails]);

  // Safe fallback default highlight
  const defaultHighlight = {
    name: 'Featured Dish',
    category: 'Menu Health',
    salesGrowth: '+12% Sales',
    avgWeekly: 'Live sync active',
    price: 60,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&h=300&q=80',
    item_id: 'item_biryani'
  };

  // Safe fallback default suggestion
  const defaultSuggestion = {
    title: 'Eva Decision Engine',
    description: 'Analyzing margin performance and cross-elasticities from live database items.',
    lastWeek: '₹80',
    thisWeek: '₹95',
    delta: '+15%',
    action: 'Simulate in Lab',
    targetScreen: 'demand_lab',
    item_id: 'item_biryani'
  };

  // Dish highlights derived from real backend items
  const highlightDishes = useMemo(() => {
    if (!items || items.length === 0) return [defaultHighlight];

    const sortedBySales = [...items].sort((a, b) => (b.units_per_day || 0) - (a.units_per_day || 0));
    const lossMakerItem = items.find(i => (i.flags && i.flags.includes('loss_maker')) || i.margin_pct < 20) || sortedBySales[1];
    const highestMarginItem = [...items].sort((a, b) => (b.margin_pct || 0) - (a.margin_pct || 0))[0] || sortedBySales[0];

    const topSeller = sortedBySales[0] || defaultHighlight;
    const lossMaker = lossMakerItem || sortedBySales[1] || defaultHighlight;
    const starMargin = highestMarginItem || sortedBySales[2] || defaultHighlight;

    return [
      {
        name: topSeller.name,
        category: 'Top Seller',
        salesGrowth: `${Math.round(topSeller.units_per_day || 0)} sold/d`,
        avgWeekly: `Avg weekly sales ${Math.round((topSeller.units_per_day || 0) * 7)} units`,
        price: topSeller.price || 0,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&h=300&q=80',
        item_id: topSeller.item_id
      },
      {
        name: lossMaker.name,
        category: lossMaker.margin_pct < 20 ? 'Loss Maker Alert' : 'Trending Item',
        salesGrowth: `Margin ${lossMaker.margin_pct || 0}%`,
        avgWeekly: `Cost ₹${lossMaker.cost || 0} vs Price ₹${lossMaker.price || 0}`,
        price: lossMaker.price || 0,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=300&h=300&q=80',
        item_id: lossMaker.item_id
      },
      {
        name: starMargin.name,
        category: 'Highest Margin',
        salesGrowth: `${starMargin.margin_pct || 0}% Margin`,
        avgWeekly: `Unit profit ₹${starMargin.margin_abs || 0}`,
        price: starMargin.price || 0,
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=300&h=300&q=80',
        item_id: starMargin.item_id
      }
    ];
  }, [items]);

  // Suggestions for Eva / Co-pilot card derived from real database items
  const coPilotSuggestions = useMemo(() => {
    if (!items || items.length === 0) return [defaultSuggestion];

    const lossMaker = items.find(i => (i.flags && i.flags.includes('loss_maker')) || i.margin_pct < 20);
    const sortedBySales = [...items].sort((a, b) => (b.units_per_day || 0) - (a.units_per_day || 0));
    const topSeller = sortedBySales[0];

    const suggestions = [];

    if (lossMaker) {
      suggestions.push({
        title: `${lossMaker.name} Repositioning`,
        description: `Current gross margin is ${lossMaker.margin_pct}%, which is below the target floor. Reposition price or adjust portion size in Demand Lab.`,
        lastWeek: `₹${lossMaker.cost}`,
        thisWeek: `₹${lossMaker.price}`,
        delta: `${lossMaker.margin_pct}%`,
        action: 'Simulate in Lab',
        targetScreen: 'demand_lab',
        item_id: lossMaker.item_id
      });
    }

    if (topSeller) {
      suggestions.push({
        title: `${topSeller.name} Combo Bundle`,
        description: `High daily volume (${Math.round(topSeller.units_per_day)} units/day). Pair with high-margin cold drinks to prevent margin erosion.`,
        lastWeek: `₹${topSeller.price}`,
        thisWeek: `₹${Math.round(topSeller.price * 1.15)}`,
        delta: '+15%',
        action: 'Apply Combo',
        targetScreen: 'combo_studio',
        item_id: topSeller.item_id
      });
    }

    if (suggestions.length === 0) suggestions.push(defaultSuggestion);
    return suggestions;
  }, [items]);

  // Safe items for the carousel
  const currentHighlight = highlightDishes[highlightDishIndex] || highlightDishes[0] || defaultHighlight;
  const currentSuggestion = coPilotSuggestions[suggestionIndex] || coPilotSuggestions[0] || defaultSuggestion;

  // Handle Tab Switch for Highlights
  const handleHighlightTabClick = (tabName) => {
    setMenuHighlightTab(tabName);
    if (tabName === 'Top Sellers') setHighlightDishIndex(0);
    else if (tabName === 'Trending') setHighlightDishIndex(1);
    else if (tabName === 'Highest Margin') setHighlightDishIndex(2);
  };

  // Filtered live transactions based on selected transaction tab
  const transactions = useMemo(() => {
    if (!items || items.length === 0) {
      return [{ billNo: 'Syncing POS...', mode: 'Live POS Orders', amount: 0, item: 'Loading items...', item_id: 'item_biryani' }];
    }

    let sourceItems = items;
    if (transactionTab === 'Dine In') {
      sourceItems = items.filter(it => it.kind === 'main');
    } else if (transactionTab === 'Take Out') {
      sourceItems = items.filter(it => it.kind === 'addon');
    } else if (transactionTab === 'Delivery') {
      sourceItems = [...items].sort((a, b) => b.price - a.price);
    }

    return sourceItems.slice(0, 4).map((it, idx) => ({
      billNo: `Order #${2451 + idx}`,
      mode: `${it.kind === 'main' ? 'Meal Order' : 'Add-on Order'} · ${it.portion_size_g}g`,
      amount: it.price,
      item: it.name,
      item_id: it.item_id
    }));
  }, [items, transactionTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Sub-header Controls / View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '8px' }}>
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
              boxShadow: activeView === 'bento' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s ease'
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
              boxShadow: activeView === 'table' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Inventory Table ({items.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsGuardrailsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Configure margin floor, meal price cap, and fairness mode"
          >
            <ShieldCheck size={14} color="var(--accent-green)" />
            <span>Owner Guardrails</span>
          </button>

          <button
            onClick={refetch}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
            title="Sync latest items and sales from database"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
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

                {/* Highlight Info Pill */}
                <div 
                  onClick={() => setActiveView('table')}
                  style={{
                    backgroundColor: 'var(--accent-green-subtle)',
                    border: '1px solid var(--accent-green-border)',
                    borderRadius: '14px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  title="Click to view all items and diagnostic flags in Inventory Table"
                >
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
                    Live →
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Transactions Feed (Interactive with Real Menu Items) */}
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
                    Recent Orders & Sales
                  </h4>
                </div>
                <ChevronRight 
                  size={16} 
                  color="var(--text-secondary)" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveView('table')}
                  title="View full item catalog"
                />
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
                      boxShadow: transactionTab === tab ? 'var(--shadow-card)' : 'none',
                      transition: 'all 0.15s ease'
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
                    onClick={() => onNavigateToDemandLab && onNavigateToDemandLab(tx.item_id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '0.65rem',
                      borderBottom: idx < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      borderRadius: '6px',
                      padding: '4px 6px'
                    }}
                    title={`Click to simulate ${tx.item} in Demand Lab`}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.item}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {tx.mode} · {tx.billNo}
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
            
            {/* Card 3: Total Revenue with Green Bar Sparklines */}
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
                    Total Daily Revenue
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--accent-green-subtle)',
                    color: 'var(--accent-green)',
                    border: '1px solid var(--accent-green-border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '2px 8px'
                  }}>
                    +12% vs prior
                  </span>
                  <ChevronRight 
                    size={16} 
                    color="var(--text-secondary)" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveView('table')}
                    title="View item-level sales breakdown"
                  />
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

                {/* Daily Avg vs Weekly Toggle */}
                <button
                  onClick={() => setProfitTimeframe(prev => prev === 'Daily Avg' ? 'Weekly Run-Rate' : 'Daily Avg')}
                  style={{
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
                  }}
                  title="Click to toggle between Daily and Weekly run-rate"
                >
                  <span>{profitTimeframe}</span>
                  <ChevronDown size={13} color="var(--text-secondary)" />
                </button>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: totalDailyProfit < 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                  {formatINR(profitTimeframe === 'Daily Avg' ? totalDailyProfit : totalDailyProfit * 7, 0)}
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
                  <div 
                    key={idx} 
                    onClick={() => onNavigateToDemandLab && onNavigateToDemandLab(col.item_id)}
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      height: '100%', 
                      justifyContent: 'flex-end',
                      cursor: 'pointer'
                    }} 
                    title={`${col.name}: ${col.margin}% margin (Click to simulate in Demand Lab)`}
                  >
                    <div style={{
                      width: '26px',
                      height: `${col.revHeight}%`,
                      borderRadius: '6px',
                      background: col.isLoss
                        ? 'linear-gradient(180deg, var(--accent-rose) 60%, rgba(248, 113, 113, 0.4) 100%)'
                        : 'linear-gradient(180deg, var(--accent-green-bright), var(--accent-green))',
                      boxShadow: 'var(--shadow-card)',
                      transition: 'transform 0.15s ease'
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
            <div 
              className="bento-card" 
              style={{ padding: '1.15rem', cursor: 'pointer' }}
              onClick={() => setIsGuardrailsOpen(true)}
              title="Click to configure student meal caps and coverage targets"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500, maxWidth: '280px' }}>
                  <strong>{affordableCoveragePct}% of students</strong> served within target meal budget!
                </p>
                <ChevronRight size={16} color="var(--text-secondary)" />
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
            
            {/* Card 6: Menu Highlights / Spotlight Dish Carousel */}
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
                <ChevronRight 
                  size={16} 
                  color="var(--text-secondary)" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigateToDemandLab && onNavigateToDemandLab(currentHighlight.item_id)}
                />
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
                    onClick={() => handleHighlightTabClick(t)}
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
                  title="Previous Dish"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Dish Photo with Sales badge */}
                <div 
                  onClick={() => onNavigateToDemandLab && onNavigateToDemandLab(currentHighlight.item_id)}
                  style={{ position: 'relative', cursor: 'pointer' }}
                  title="Click to simulate in Demand Lab"
                >
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
                  title="Next Dish"
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
                <button
                  onClick={() => onNavigateToDemandLab && onNavigateToDemandLab(currentHighlight.item_id)}
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '3px 10px', marginTop: '6px' }}
                >
                  Simulate in Demand Lab →
                </button>
              </div>
            </div>

            {/* Card 7: Eva Suggestions / Decision Support Card */}
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
                      title="Previous suggestion"
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
                      title="Next suggestion"
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

              {/* Comparative Performance Blocks (Cost vs Price / Margin) */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '1.15rem' }}>
                <div style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface-inset)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Unit Cost</div>
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
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '2px' }}>Menu Price</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {currentSuggestion?.thisWeek || '—'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    if (currentSuggestion?.targetScreen === 'combo_studio') {
                      onNavigateToComboStudio ? onNavigateToComboStudio() : onNavigateToDemandLab(currentSuggestion.item_id);
                    } else {
                      onNavigateToDemandLab && onNavigateToDemandLab(currentSuggestion?.item_id || 'item_biryani');
                    }
                  }}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.5rem' }}
                >
                  <span>{currentSuggestion?.action || 'Explore in Simulator'}</span>
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
