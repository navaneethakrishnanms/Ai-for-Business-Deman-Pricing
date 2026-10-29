import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot
} from 'recharts';
import { formatINR } from '../../utils/formatters';

export const FrontierCurve = ({ frontier = [], currentCoverage = 0.74, currentProfit = 6150 }) => {
  if (!frontier || frontier.length === 0) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No Pareto frontier data available
      </div>
    );
  }

  const chartData = frontier.map(f => ({
    coveragePct: Math.round(((f.coverage_actual ?? f.coverage_target ?? f.coverage ?? 0.75)) * 100),
    coverage: f.coverage_actual ?? f.coverage_target ?? f.coverage ?? 0.75,
    expected_profit: Math.round(f.profit_mean ?? f.expected_profit ?? 0)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '0.78rem'
        }}>
          <div style={{ color: 'var(--text-secondary)' }}>Student Coverage: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{d.coveragePct}%</strong></div>
          <div style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>Expected Profit: <strong className="mono">{formatINR(d.expected_profit, 0)}/day</strong></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '220px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="coveragePct" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${v}%`}
            label={{ value: 'Affordability (Student Coverage %)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="expected_profit" 
            stroke="var(--accent-blue)" 
            strokeWidth={2} 
            dot={{ r: 3, fill: 'var(--accent-blue)' }}
            name="Pareto Optimal Frontier" 
          />
          {currentCoverage && (
            <ReferenceDot
              x={Math.round(currentCoverage * 100)}
              y={currentProfit}
              r={5}
              fill="var(--accent-emerald)"
              stroke="var(--bg-surface)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
