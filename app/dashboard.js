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
      initQA(allCompanies);
      renderSummary(data);
      initDraggableCards();
      renderTable(allCompanies);
      setTimeout(function() { renderScoreChart(); }, 100);
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

function initDraggableCards() {
  const grid = document.getElementById('summary-grid');
  if (!grid) return;

  // Restore saved order
  const saved = localStorage.getItem('summary-card-order');
  if (saved) {
    const order = JSON.parse(saved);
    const cards = Array.from(grid.children);
    order.forEach(function(id) {
      const card = cards.find(function(c) { return c.dataset.id === id; });
      if (card) grid.appendChild(card);
    });
  }

  Sortable.create(grid, {
    animation: 150,
    ghostClass: 'card-dragging',
    onEnd: function() {
      const order = Array.from(grid.children).map(function(c) { return c.dataset.id; });
      localStorage.setItem('summary-card-order', JSON.stringify(order));
    }
  });
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

  companies.forEach(function(c, i) {
    const revScore = c.scores && c.scores.revenue_growth ? c.scores.revenue_growth.score : null;
    const finScore = c.scores && c.scores.financial_strength ? c.scores.financial_strength.score : null;
    const revExp = c.scores && c.scores.revenue_growth ? c.scores.revenue_growth.explanation : '';
    const finExp = c.scores && c.scores.financial_strength ? c.scores.financial_strength.explanation : '';

    const secBtn = c.sec_filing
      ? '<button class="action-btn sec-action-btn" onclick="openSecModal(' + i + ')">SEC Filing</button>'
      : '';

    const riskData = calculateRisk(c);
    const riskBtn = '<button class="action-btn risk-action-btn" onclick="openRiskModal(' + i + ')">' + ' Risk Analysis</button>';

    const chartsBtn = '<button class="action-btn charts-action-btn" onclick="openChartsModal(' + i + ')">Charts</button>';
    const tr = document.createElement('tr');

    tr.innerHTML =
      '<td class="rank-cell">' + (i + 1) + '</td>' +
      '<td>' +
        '<span class="company-display">' + c.ticker + ' — ' + (c.company_name || '') + '</span>' +
        '<div class="action-buttons">' +
          secBtn +
          riskBtn +
          chartsBtn +
        '</div>' +
        '<div style="margin-top:10px;">' +
          '<label class="compare-label-lg">' +
            '<input type="checkbox" class="compare-check-lg" value="' + i + '" onchange="handleCompare(this)">' +
            ' Compare' +
          '</label>' +
        '</div>' +
      '</td>' +
      '<td>' + scoreBar(c.overall_score) + '</td>' +
      '<td>' +
        '<div class="sub-scores">' +
          '<div class="sub-score-item">' +
            '<div class="sub-label">Revenue Growth <span class="info-tip" onclick="openMethodModal(\'revenue\')">ℹ️</span></div>' +
            scoreBar(revScore) +
            '<div class="explanation">' + revExp + '</div>' +
          '</div>' +
          '<div class="sub-score-item">' +
            '<div class="sub-label">Financial Strength <span class="info-tip" onclick="openMethodModal(\'financial\')">ℹ️</span></div>' +
            scoreBar(finScore) +
            '<div class="explanation">' + finExp + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="news-cell" id="news-' + c.ticker + '">' +
        '<span style="color:#4a5568;font-size:12px;">Loading...</span>' +
      '</td>';

    tbody.appendChild(tr);
    fetchNews(c.ticker, 'news-' + c.ticker);
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

const NEWS_URL = 'http://127.0.0.1:5000/news/';

function fetchNews(ticker, cellId) {
  const cell = document.getElementById(cellId);
  if (!cell) return;
  cell.innerHTML = '<span style="color:#4a5568;font-size:12px;">Loading...</span>';

  fetch('http://127.0.0.1:5000/news/' + ticker)
    .then(function(res) { return res.json(); })
    .then(function(articles) {
      if (!articles || !articles.length) {
        cell.innerHTML = '<span style="color:#4a5568;font-size:12px;">No news found.</span>';
        return;
      }
      const ul = document.createElement('ul');
      ul.className = 'news-list';
      articles.forEach(function(a) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.link;
        link.target = '_blank';
        link.className = 'news-link';
        link.textContent = a.title;
        li.appendChild(link);
        ul.appendChild(li);
      });
      cell.innerHTML = '';
      cell.appendChild(ul);
    })
    .catch(function() {
      cell.innerHTML = '<span style="color:#fc8181;font-size:12px;">News unavailable.</span>';
    });
}

function closeSecModal() {
  document.getElementById('sec-modal').style.display = 'none';
}

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSecModal();
    closeMethodModal();
    closeChartsModal();
    closeRiskModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSecModal();
});

let selectedForCompare = [];

function handleCompare(checkbox) {
  const index = parseInt(checkbox.value);
  
  if (checkbox.checked) {
    if (selectedForCompare.length >= 2) {
      checkbox.checked = false;
      alert('You can only compare 2 companies at a time.');
      return;
    }
    selectedForCompare.push(index);
  } else {
    selectedForCompare = selectedForCompare.filter(i => i !== index);
  }

  if (selectedForCompare.length === 2) {
    showComparison();
  } else {
    document.getElementById('compare-panel').style.display = 'none';
  }
}

function showComparison() {
  const c1 = allCompanies[selectedForCompare[0]];
  const c2 = allCompanies[selectedForCompare[1]];
  const panel = document.getElementById('compare-panel');
  const body = document.getElementById('compare-body');

  function companyCard(c) {
    const fin = c.sec_filing?.financials || {};
    return `
      <div class="compare-card">
        <h3><span class="ticker-badge">${c.ticker}</span> ${c.company_name}</h3>
        <div class="compare-row">
          <span class="clabel">Overall Score</span>
          <span class="cvalue">${c.overall_score ?? 'N/A'}</span>
        </div>
        <div class="compare-row">
          <span class="clabel">Revenue Growth</span>
          <span class="cvalue">${c.scores?.revenue_growth?.score ?? 'N/A'}</span>
        </div>
        <div class="compare-row">
          <span class="clabel">Financial Strength</span>
          <span class="cvalue">${c.scores?.financial_strength?.score ?? 'N/A'}</span>
        </div>
        <div class="compare-row">
          <span class="clabel">EPS</span>
          <span class="cvalue">${fin.eps != null ? '$' + fin.eps.toFixed(2) : 'N/A'}</span>
        </div>
        <div class="compare-row">
          <span class="clabel">P/E Ratio</span>
          <span class="cvalue">${fin.pe_ratio != null ? fin.pe_ratio.toFixed(1) : 'N/A'}</span>
        </div>
        <div class="compare-row">
          <span class="clabel">Revenue</span>
          <span class="cvalue">${fin.revenue != null ? '$' + (fin.revenue / 1e9).toFixed(1) + 'B' : 'N/A'}</span>
        </div>
      </div>`;
  }

  body.innerHTML = companyCard(c1) + companyCard(c2);
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });
}

function clearComparison() {
  selectedForCompare = [];
  document.getElementById('compare-panel').style.display = 'none';
  document.querySelectorAll('.compare-check').forEach(cb => cb.checked = false);
}

const methodologyData = {
  revenue: {
    title: 'Revenue Growth Score',
    body: `
      <h3 style="color:#63b3ed;margin-bottom:12px;">What it measures</h3>
      <p>How fast the company has been growing its revenue over the last 3 years.</p>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Formula</h3>
      <p style="background:#16213e;padding:12px;border-radius:8px;font-family:monospace;">
        CAGR = (Revenue_Year3 / Revenue_Year0) ^ (1/3) - 1
      </p>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Score Scale</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">CAGR &lt; 0%</td>
          <td style="padding:8px;color:#fc8181;">Score: 10 (Very Poor)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">0% – 3%</td>
          <td style="padding:8px;color:#fc8181;">Score: 20–30 (Low)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">3% – 7%</td>
          <td style="padding:8px;color:#ecc94b;">Score: 30–50 (Moderate)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">7% – 12%</td>
          <td style="padding:8px;color:#ecc94b;">Score: 50–70 (Good)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">12% – 20%</td>
          <td style="padding:8px;color:#48bb78;">Score: 70–90 (Strong)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">20% – 30%</td>
          <td style="padding:8px;color:#48bb78;">Score: 90–98 (Exceptional)</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#718096;">&gt; 30%</td>
          <td style="padding:8px;color:#48bb78;">Score: 100 (Extraordinary)</td>
        </tr>
      </table>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Why it matters</h3>
      <p>Companies that consistently grow revenue are expanding their business. Strong revenue growth often leads to higher profits and stock price appreciation over time.</p>
    `
  },
  financial: {
    title: 'Financial Strength Score',
    body: `
      <h3 style="color:#63b3ed;margin-bottom:12px;">What it measures</h3>
      <p>How easily the company can pay its debt obligations and whether it generates positive free cash flow.</p>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Formula</h3>
      <p style="background:#16213e;padding:12px;border-radius:8px;font-family:monospace;">
        Interest Coverage = Operating Income / Interest Expense
      </p>
      <p style="background:#16213e;padding:12px;border-radius:8px;font-family:monospace;margin-top:8px;">
        Free Cash Flow = Operating Cash Flow + Capital Expenditures
      </p>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Score Scale</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">Coverage &lt; 3x</td>
          <td style="padding:8px;color:#fc8181;">Base Score: 25 (Weak)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">Coverage 3x – 8x</td>
          <td style="padding:8px;color:#ecc94b;">Base Score: 55 (Adequate)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">Coverage 8x – 15x</td>
          <td style="padding:8px;color:#48bb78;">Base Score: 75 (Strong)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">Coverage &gt; 15x</td>
          <td style="padding:8px;color:#48bb78;">Base Score: 90 (Excellent)</td>
        </tr>
        <tr style="border-bottom:1px solid #2d3748;">
          <td style="padding:8px;color:#718096;">FCF &gt; $1B bonus</td>
          <td style="padding:8px;color:#48bb78;">+10 to +15 points</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#718096;">No debt</td>
          <td style="padding:8px;color:#48bb78;">Score: 95</td>
        </tr>
      </table>

      <h3 style="color:#63b3ed;margin:16px 0 12px;">Why it matters</h3>
      <p>A company that cannot cover its interest payments is at risk of financial distress. Strong coverage ratios and positive free cash flow indicate a healthy, resilient business.</p>
    `
  }
};

function openMethodModal(type) {
  const data = methodologyData[type];
  if (!data) return;
  document.getElementById('method-title').textContent = data.title;
  document.getElementById('method-body').innerHTML = data.body;
  document.getElementById('method-modal').style.display = 'flex';
}

function closeMethodModal() {
  document.getElementById('method-modal').style.display = 'none';
}

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSecModal();
    closeMethodModal();
    closeChartsModal();
  }
});

let scoreChartInstance = null;
let revenueChartInstance = null;
let breakdownChartInstance = null;

function renderScoreChart() {
  const n = parseInt(document.getElementById('top-n-select').value);
  const top = allCompanies.slice(0, n);

  const labels = top.map(function(c) { return c.ticker; });
  const scores = top.map(function(c) { return c.overall_score || 0; });
  const colors = scores.map(function(s) {
    if (s >= 70) return '#48bb78';
    if (s >= 40) return '#ecc94b';
    return '#fc8181';
  });

  const ctx = document.getElementById('score-chart').getContext('2d');
  if (scoreChartInstance) scoreChartInstance.destroy();

  scoreChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Overall Score',
        data: scores,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#718096' },
          grid: { color: '#2d3748' }
        },
        y: {
          ticks: { color: '#e2e8f0', font: { weight: 'bold' } },
          grid: { display: false }
        }
      }
    }
  });
}

function openChartsModal(index) {
  const c = allCompanies[index];
  document.getElementById('charts-modal-title').textContent = c.ticker + ' — ' + c.company_name;
  document.getElementById('charts-modal').style.display = 'flex';

  // Revenue chart
  const revHistory = c.revenue_history || [];
  const revCtx = document.getElementById('revenue-chart').getContext('2d');
  if (revenueChartInstance) revenueChartInstance.destroy();

  revenueChartInstance = new Chart(revCtx, {
    type: 'bar',
    data: {
      labels: revHistory.map(function(r) { return r.year; }),
      datasets: [{
        label: 'Revenue ($B)',
        data: revHistory.map(function(r) { return r.revenue; }),
        backgroundColor: '#4299e1',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#718096' }, grid: { color: '#2d3748' } },
        y: { ticks: { color: '#718096' }, grid: { color: '#2d3748' } }
      }
    }
  });

  // Score breakdown chart
  const revScore = c.scores?.revenue_growth?.score || 0;
  const finScore = c.scores?.financial_strength?.score || 0;
  const brkCtx = document.getElementById('breakdown-chart').getContext('2d');
  if (breakdownChartInstance) breakdownChartInstance.destroy();

  breakdownChartInstance = new Chart(brkCtx, {
    type: 'bar',
    data: {
      labels: ['Revenue Growth', 'Financial Strength'],
      datasets: [{
        label: 'Score',
        data: [revScore, finScore],
        backgroundColor: ['#48bb78', '#63b3ed'],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#718096' },
          grid: { color: '#2d3748' }
        },
        y: {
          ticks: { color: '#e2e8f0', font: { weight: 'bold' } },
          grid: { display: false }
        }
      }
    }
  });
}

function closeChartsModal() {
  document.getElementById('charts-modal').style.display = 'none';
}

function askQuestion() {
  const input = document.getElementById('qa-input');
  const question = input.value.trim();
  if (!question) return;
  const answer = answerQuestion(question);
  const answerEl = document.getElementById('qa-answer');
  answerEl.textContent = answer;
  answerEl.style.display = 'block';
}

function askPreset(question) {
  document.getElementById('qa-input').value = question;
  askQuestion();
}

function openRiskModal(index) {
  const c = allCompanies[index];
  const risk = calculateRisk(c);

  document.getElementById('risk-modal-title').textContent = c.ticker + ' — ' + c.company_name + ' Risk Analysis';

  document.getElementById('risk-overall').innerHTML =
    '<div style="font-size:48px;">' + risk.overallEmoji + '</div>' +
    '<div style="font-size:22px;font-weight:700;color:' + risk.overallColor + ';margin-top:8px;">' + risk.overall + ' Risk</div>';

  const factorsHtml = risk.factors.map(function(f) {
    return '<div style="background:#16213e;border:1px solid #2d3748;border-left:4px solid ' + f.color + ';border-radius:8px;padding:14px;margin-bottom:12px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="font-weight:600;color:#e2e8f0;font-size:14px;">' + f.label + '</span>' +
        '<span style="font-weight:700;color:' + f.color + ';font-size:13px;">' + f.level + '</span>' +
      '</div>' +
      '<div style="font-size:13px;color:#a0aec0;">' + f.detail + '</div>' +
    '</div>';
  }).join('');

  document.getElementById('risk-factors').innerHTML = factorsHtml;
  document.getElementById('risk-modal').style.display = 'flex';
}

function closeRiskModal() {
  document.getElementById('risk-modal').style.display = 'none';
}