/**
 * Formatting Utilities for CampusPrice
 * Formats currency (₹ INR), percentages, ranges, and deltas
 */

export const formatINR = (amount, decimals = 2) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPct = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) return '0.0%';
  const num = Number(value);
  return `${num.toFixed(decimals)}%`;
};

export const formatRatioAsPct = (ratio, decimals = 1) => {
  if (ratio === undefined || ratio === null || isNaN(ratio)) return '0.0%';
  return `${(Number(ratio) * 100).toFixed(decimals)}%`;
};

export const formatRange = (range, isCurrency = true) => {
  if (!range) return '—';
  const { mean, p10, p90 } = range;
  if (mean === undefined) return '—';

  if (isCurrency) {
    return `${formatINR(mean, 0)} [${formatINR(p10, 0)} – ${formatINR(p90, 0)}]`;
  }
  return `${Number(mean).toFixed(1)} [${Number(p10).toFixed(1)} – ${Number(p90).toFixed(1)}]`;
};

export const formatUnits = (units) => {
  if (units === undefined || units === null || isNaN(units)) return '0';
  return Math.round(Number(units)).toLocaleString('en-IN');
};

export const formatDelta = (delta, isCurrency = true) => {
  if (delta === undefined || delta === null || isNaN(delta)) return '0';
  const num = Number(delta);
  const sign = num > 0 ? '+' : '';
  if (isCurrency) {
    return `${sign}${formatINR(num, 1)}`;
  }
  return `${sign}${num.toFixed(1)}`;
};

export const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return isoString;
  }
};

