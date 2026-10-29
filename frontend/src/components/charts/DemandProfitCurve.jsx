import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { formatINR } from '../../utils/formatters';

export const DemandProfitCurve = ({ curveData = [], currentPrice, proposedPrice }) => {
  if (!curveData || curveData.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No simulation curve data available
      </div>
    );
  }

  const formattedData = curveData.map(d => ({
    ...d,
    profit_band: [d.profit_p10, d.profit_p90]
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '0.78rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Price: {formatINR(label, 0)}
          </div>
          <div style={{ color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <span>Predicted Units:</span>
            <strong className="mono">{data.units_mean} units/day</strong>
          </div>
          <div style={{ color: 'var(--accent-emerald)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <span>Expected Profit:</span>
            <strong className="mono">{formatINR(data.profit_mean, 0)}</strong>
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', marginTop: '3px' }}>
            90% CI: [{formatINR(data.profit_p10, 0)} — {formatINR(data.profit_p90, 0)}]
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '310px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          
          <XAxis 
            dataKey="price" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(val) => `₹${val}`}
            label={{ value: 'Simulated Price (₹)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)', fontSize: 11 }}
          />

          {/* Left Y Axis: Predicted Units */}
          <YAxis 
            yAxisId="left" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            label={{ value: 'Units / day', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
          />

          {/* Right Y Axis: Profit in ₹ */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(val) => `₹${val}`}
            label={{ value: 'Profit ₹ / day', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11 }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.78rem' }} />

          {/* Profit Posterior Uncertainty Band */}
          <Area 
            yAxisId="right" 
            type="monotone" 
            dataKey="profit_band" 
            fill="var(--accent-emerald-subtle)" 
            stroke="none" 
            name="Profit 90% Confidence Interval" 
          />

          {/* Profit Mean Line */}
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="profit_mean" 
            stroke="var(--accent-emerald)" 
            strokeWidth={2} 
            dot={{ r: 2.5, fill: 'var(--accent-emerald)' }} 
            name="Expected Profit (₹)" 
          />

          {/* Demand Response Units Line */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="units_mean" 
            stroke="var(--accent-blue)" 
            strokeWidth={2} 
            strokeDasharray="3 3" 
            dot={false} 
            name="Expected Demand (Units)" 
          />

          {/* Reference Lines */}
          {currentPrice && (
            <ReferenceLine 
              yAxisId="left"
              x={currentPrice} 
              stroke="var(--text-muted)" 
              strokeDasharray="2 2"
              label={{ value: 'Current', fill: 'var(--text-secondary)', fontSize: 10, position: 'top' }} 
            />
          )}

          {proposedPrice && (
            <ReferenceLine 
              yAxisId="left"
              x={proposedPrice} 
              stroke="var(--accent-blue)" 
              strokeWidth={1.5}
              label={{ value: 'Simulated', fill: 'var(--accent-blue)', fontSize: 10, position: 'top' }} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
