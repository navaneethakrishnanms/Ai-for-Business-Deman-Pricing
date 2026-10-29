import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { formatINR } from '../../utils/formatters';

export const ScenarioComparisonChart = ({ results = [] }) => {
  if (!results || results.length === 0) {
    return <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No scenarios loaded</div>;
  }

  const chartData = results.map(r => ({
    name: r.scenario_name || r.name || 'Scenario',
    revenue: r.revenue?.mean || 0,
    profit: r.profit?.mean || 0,
    margin_pct: r.margin_pct || 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '0.78rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
          <div style={{ color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span>Expected Revenue:</span>
            <strong className="mono">{formatINR(payload[0]?.value, 0)}</strong>
          </div>
          <div style={{ color: 'var(--accent-emerald)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span>Expected Profit:</span>
            <strong className="mono">{formatINR(payload[1]?.value, 0)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '6px', fontSize: '0.78rem' }} />
          <Bar dataKey="revenue" name="Expected Daily Revenue" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="profit" name="Expected Daily Profit" fill="var(--accent-emerald)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
