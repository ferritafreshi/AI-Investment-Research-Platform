// Risk Analysis Engine

function calculateRisk(c) {
  const fin = c.sec_filing?.financials || {};
  let riskPoints = 0;
  let factors = [];

  // ===== DEBT RISK (Interest Coverage via Financial Strength score) =====
  const finScore = c.scores?.financial_strength?.score;
  if (finScore != null) {
    if (finScore < 40) {
      riskPoints += 3;
      factors.push({ label: 'Debt Risk', level: 'High', color: '#fc8181', detail: 'Low financial strength score indicates high debt burden or weak interest coverage.' });
    } else if (finScore < 70) {
      riskPoints += 1;
      factors.push({ label: 'Debt Risk', level: 'Medium', color: '#ecc94b', detail: 'Moderate financial strength. Debt levels are manageable but worth monitoring.' });
    } else {
      factors.push({ label: 'Debt Risk', level: 'Low', color: '#48bb78', detail: 'Strong financial strength score indicates low debt risk.' });
    }
  }

  // ===== VALUATION RISK (P/E Ratio) =====
  const pe = fin.pe_ratio;
  if (pe != null) {
    if (pe > 60) {
      riskPoints += 3;
      factors.push({ label: 'Valuation Risk', level: 'High', color: '#fc8181', detail: 'P/E ratio of ' + pe.toFixed(1) + 'x is very high. Stock may be overvalued relative to earnings.' });
    } else if (pe > 30) {
      riskPoints += 1;
      factors.push({ label: 'Valuation Risk', level: 'Medium', color: '#ecc94b', detail: 'P/E ratio of ' + pe.toFixed(1) + 'x is elevated. Growth expectations are priced in.' });
    } else if (pe > 0) {
      factors.push({ label: 'Valuation Risk', level: 'Low', color: '#48bb78', detail: 'P/E ratio of ' + pe.toFixed(1) + 'x is reasonable.' });
    } else {
      factors.push({ label: 'Valuation Risk', level: 'Unknown', color: '#718096', detail: 'P/E ratio not available.' });
    }
  }

  // ===== SIZE RISK (Market Cap) =====
  const mc = fin.market_cap;
  if (mc != null) {
    if (mc < 10e9) {
      riskPoints += 2;
      factors.push({ label: 'Size Risk', level: 'High', color: '#fc8181', detail: 'Small cap company (< $10B). Higher volatility and liquidity risk.' });
    } else if (mc < 50e9) {
      riskPoints += 1;
      factors.push({ label: 'Size Risk', level: 'Medium', color: '#ecc94b', detail: 'Mid cap company ($10B–$50B). Moderate size risk.' });
    } else {
      factors.push({ label: 'Size Risk', level: 'Low', color: '#48bb78', detail: 'Large cap company (> $50B). Lower size and liquidity risk.' });
    }
  }

  // ===== OVERALL RISK =====
  let overall, overallColor, overallEmoji;
  if (riskPoints >= 5) {
    overall = 'High';
    overallColor = '#fc8181';
    overallEmoji = '🔴';
  } else if (riskPoints >= 2) {
    overall = 'Medium';
    overallColor = '#ecc94b';
    overallEmoji = '🟡';
  } else {
    overall = 'Low';
    overallColor = '#48bb78';
    overallEmoji = '🟢';
  }

  return { overall, overallColor, overallEmoji, factors };
}