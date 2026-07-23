const DATA_URL = '../data/dashboard_data.json';
let allCompanies = [];

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});

function loadDashboard() {
  fetch(DATA_URL + '?t=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      document.getElementById('loading').style.display = 'none';
      allCompanies = data.companies || [];
      renderSummary(data);
      renderTable(allCompanies);
    })
    .catch(err => {
      document.getElementById('loading').style.display = 'none';
      const errEl = document.getElementById('error-message');
      errEl.style.display = 'block';
      errEl.textContent = `Failed to load dashboard data: ${err.message}`;
    });
}

function renderSummary(data) {
  document.getElementById('stat-companies').textContent = data.total_companies ?? '-';
  document.getElementById('stat-avg-score').textContent =
    data.average_score != null ? data.average_score.toFixed(1) : '-';

  const topEl = document.getElementById('stat-top-company');
  if (data.top_company) {
    topEl.innerHTML =
      `<span class="ticker-badge">${data.top_company.ticker}</span> ` +
      `${data.top_company.company_name}`;
  } else {
    topEl.textContent = '-';
  }

  const updatedEl = document.getElementById('last-updated');
  if (data.generated_at) {
    const d = new Date(data.generated_at);
    updatedEl.textContent = 'Updated: ' + d.toLocaleString();
  }
}

function scoreClass(score) {
  if (score == null) return '';
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-mid';
  return 'score-low';
}

function scoreBar(score) {
  if (score == null) return `<span class="na-badge">N/A</span>`;
  const cls = scoreClass(score);
  const pct = Math.min(100, score);
  return `
    <div class="score-wrapper ${cls}">
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width: ${pct}%"></div>
      </div>
      <span class="score-value">${score}</span>
    </div>`;
}

function renderTable(companies) {
  const tbody = document.getElementById('company-tbody');
  tbody.innerHTML = '';

  companies.forEach((c, i) => {
    const revScore = c.scores?.revenue_growth?.score ?? null;
    const finScore = c.scores?.financial_strength?.score ?? null;
    const revExp = c.scores?.revenue_growth?.explanation ?? '';
    const finExp = c.scores?.financial_strength?.explanation ?? '';

    const secBtn = c.sec_filing
    ? `<div style="text-align:center; margin-top:8px;">
        <button class="sec-btn" onclick="openSecModal(${i})">📄 SEC Filing</button>
      </div>`
    : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank-cell">${i + 1}</td>
      <td>
        <span class="ticker-badge">${c.ticker}</span><br>
        <span class="company-name">${c.company_name || ''}</span>
        ${secBtn}
      </td>
      <td>${scoreBar(c.overall_score)}</td>
      <td>
        <div class="sub-scores">
          <div class="sub-score-item">
            <div class="sub-label">Revenue Growth</div>
            ${scoreBar(revScore)}
            <div class="explanation">${revExp}</div>
          </div>
          <div class="sub-score-item">
            <div class="sub-label">Financial Strength</div>
            ${scoreBar(finScore)}
            <div class="explanation">${finExp}</div>
          </div>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function openSecModal(index) {
  const c = allCompanies[index];
  console.log('Company:', c);
  console.log('SEC Filing:', c?.sec_filing);
  console.log('Financials:', c?.sec_filing?.financials);
  if (!c || !c.sec_filing) return;

  const filing = c.sec_filing;
  const fin = filing.financials || {};

  document.getElementById('modal-title').textContent =
    `${c.company_name} (${c.ticker}) — ${filing.form || '10-K'}`;
  document.getElementById('modal-date').textContent =
    `Filing Date: ${filing.filing_date || 'N/A'}`;
  document.getElementById('modal-link').href = filing.filing_url || '#';

  document.getElementById('modal-eps').textContent =
    fin.eps != null ? `$${fin.eps.toFixed(2)}` : 'N/A';
  document.getElementById('modal-pe').textContent =
    fin.pe_ratio != null ? fin.pe_ratio.toFixed(1) : 'N/A';
  document.getElementById('modal-revenue').textContent =
    fin.revenue != null ? `$${(fin.revenue / 1e9).toFixed(1)}B` : 'N/A';

  document.getElementById('sec-modal').style.display = 'flex';
}

function closeSecModal() {
  document.getElementById('sec-modal').style.display = 'none';
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById('sec-modal');
  if (e.target === modal) closeSecModal();
});