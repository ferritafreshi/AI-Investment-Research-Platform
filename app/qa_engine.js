// Q&A Engine v2 — improved ticker detection and year-specific revenue

let qaData = null;

function initQA(companies) {
  qaData = companies;
}

function formatRevenue(val) {
  if (val == null) return 'N/A';
  return '$' + (val / 1e9).toFixed(1) + 'B';
}

function has(text, keywords) {
  return keywords.some(function(k) { return text.includes(k); });
}

function findTicker(question) {
  if (!qaData) return null;
  const upper = question.toUpperCase();
  // Use word boundary matching to avoid partial matches
  for (let i = 0; i < qaData.length; i++) {
    const t = qaData[i].ticker;
    const regex = new RegExp('(^|[^A-Z])' + t + '($|[^A-Z])');
    if (regex.test(upper)) return t;
  }
  // Match by company name first word
  const lower = question.toLowerCase();
  for (let i = 0; i < qaData.length; i++) {
    const name = (qaData[i].company_name || '').toLowerCase();
    const firstWord = name.split(' ')[0];
    if (firstWord.length > 3 && lower.includes(firstWord)) return qaData[i].ticker;
  }
  return null;
}

function findAllTickers(question) {
  if (!qaData) return [];
  const upper = question.toUpperCase();
  const found = [];
  for (let i = 0; i < qaData.length; i++) {
    const t = qaData[i].ticker;
    const regex = new RegExp('(^|[^A-Z])' + t + '($|[^A-Z])');
    if (regex.test(upper)) found.push(t);
  }
  return found;
}

function findYear(question) {
  const match = question.match(/\b(20\d{2})\b/);
  return match ? match[1] : null;
}

function getRevenueForYear(c, year) {
  if (!c.revenue_history) return null;
  const entry = c.revenue_history.find(function(r) { return r.year === year; });
  return entry ? entry.revenue : null;
}

function formatRevenueB(val) {
  if (val == null) return 'N/A';
  return '$' + val.toFixed(1) + 'B';
}

function answerQuestion(question) {
  if (!qaData || qaData.length === 0) return "No data loaded yet.";

  const q = question.toLowerCase().trim();
  const year = findYear(q);
  const tickers = findAllTickers(q);

  // ===== TWO TICKERS — COMPARE =====
  if (tickers.length >= 2) {
    const c1 = qaData.find(function(x) { return x.ticker === tickers[0]; });
    const c2 = qaData.find(function(x) { return x.ticker === tickers[1]; });
    if (c1 && c2) {
      // Revenue comparison with optional year
      if (has(q, ['revenue', 'sales', 'turnover'])) {
        if (year) {
          const r1 = getRevenueForYear(c1, year);
          const r2 = getRevenueForYear(c2, year);
          return tickers[0] + ' revenue in ' + year + ': ' + formatRevenueB(r1) +
            '. ' + tickers[1] + ' revenue in ' + year + ': ' + formatRevenueB(r2) + '.';
        }
        const fin1 = c1.sec_filing?.financials || {};
        const fin2 = c2.sec_filing?.financials || {};
        return tickers[0] + ' annual revenue: ' + formatRevenue(fin1.revenue) +
          '. ' + tickers[1] + ' annual revenue: ' + formatRevenue(fin2.revenue) + '.';
      }
      return compareCompanies(c1, c2);
    }
  }

  // ===== SINGLE TICKER =====
  const ticker = tickers.length > 0 ? tickers[0] : null;
  const c = ticker ? qaData.find(function(x) { return x.ticker === ticker; }) : null;

  if (c) {
    const fin = c.sec_filing?.financials || {};
    const revScore = c.scores?.revenue_growth?.score;
    const finScore = c.scores?.financial_strength?.score;

    // Year-specific revenue
    if (year && has(q, ['revenue', 'sales', 'earn', 'make', 'made', 'generate'])) {
      const rev = getRevenueForYear(c, year);
      if (rev != null) {
        return ticker + ' revenue in ' + year + ': ' + formatRevenueB(rev) + '.';
      } else {
        const available = (c.revenue_history || []).map(function(r) { return r.year; }).join(', ');
        return 'No revenue data for ' + ticker + ' in ' + year + '. Available years: ' + (available || 'none') + '.';
      }
    }

    // Revenue history all years
    if (has(q, ['revenue history', 'revenue over', 'revenue each year', 'yearly revenue', 'annual revenue history'])) {
      if (c.revenue_history && c.revenue_history.length) {
        const history = c.revenue_history.map(function(r) {
          return r.year + ': ' + formatRevenueB(r.revenue);
        }).join(' | ');
        return ticker + ' revenue history: ' + history + '.';
      }
      return 'No revenue history available for ' + ticker + '.';
    }

    // Score
    if (has(q, ['score', 'rating', 'rank', 'ranked', 'grade', 'overall'])) {
      return ticker + ' (' + c.company_name + ') overall score: ' + c.overall_score + '/100. ' +
        'Revenue Growth: ' + (revScore ?? 'N/A') + '/100. ' +
        'Financial Strength: ' + (finScore ?? 'N/A') + '/100.';
    }

    // Revenue growth
    if (has(q, ['revenue growth', 'grow', 'cagr', 'growing', 'growth rate'])) {
      return ticker + ' revenue growth score: ' + (revScore ?? 'N/A') + '/100. ' +
        (c.scores?.revenue_growth?.explanation || '');
    }

    // Financial strength
    if (has(q, ['financial strength', 'financial', 'strength', 'debt', 'interest', 'coverage', 'cash flow', 'fcf', 'balance sheet'])) {
      return ticker + ' financial strength score: ' + (finScore ?? 'N/A') + '/100. ' +
        (c.scores?.financial_strength?.explanation || '');
    }

    // EPS
    if (has(q, ['eps', 'earnings per share', 'earnings'])) {
      return ticker + ' EPS: ' + (fin.eps != null ? '$' + fin.eps.toFixed(2) : 'N/A') + '.';
    }

    // P/E
    if (has(q, ['p/e', 'pe ratio', 'pe', 'price to earnings', 'price earnings', 'valuation', 'multiple'])) {
      return ticker + ' P/E Ratio: ' + (fin.pe_ratio != null ? fin.pe_ratio.toFixed(1) + 'x' : 'N/A') + '.';
    }

    // Revenue (current)
    if (has(q, ['revenue', 'sales', 'turnover', 'top line'])) {
      return ticker + ' latest annual revenue: ' + formatRevenue(fin.revenue) + '.';
    }

    // Market cap
    if (has(q, ['market cap', 'market capitalization', 'worth', 'valued', 'size'])) {
      return ticker + ' market cap: ' + (fin.market_cap != null ? '$' + (fin.market_cap / 1e12).toFixed(2) + 'T' : 'N/A') + '.';
    }

    // SEC filing
    if (has(q, ['filing', '10-k', '10k', 'sec', 'annual report'])) {
      const filing = c.sec_filing;
      if (filing && filing.filing_url) {
        return ticker + ' latest 10-K filed on ' + filing.filing_date + '. URL: ' + filing.filing_url;
      }
      return 'No SEC filing data available for ' + ticker + '.';
    }

    // General info
    return ticker + ' (' + c.company_name + ') — ' +
      'Overall Score: ' + c.overall_score + '/100. ' +
      'Revenue Growth: ' + (revScore ?? 'N/A') + '/100. ' +
      'Financial Strength: ' + (finScore ?? 'N/A') + '/100. ' +
      'EPS: ' + (fin.eps != null ? '$' + fin.eps.toFixed(2) : 'N/A') + '. ' +
      'P/E: ' + (fin.pe_ratio != null ? fin.pe_ratio.toFixed(1) + 'x' : 'N/A') + '. ' +
      'Revenue: ' + formatRevenue(fin.revenue) + '.';
  }

    // ===== FINANCIAL CONCEPT QUESTIONS =====

  if (has(q, ['what is eps', 'what are eps', 'explain eps', 'define eps', 'what does eps mean', 'earnings per share'])) {
    return 'EPS (Earnings Per Share) is the portion of a company\'s profit allocated to each outstanding share of stock. ' +
      'Formula: Net Income ÷ Total Shares Outstanding. ' +
      'A higher EPS generally means the company is more profitable. ' +
      'Learn more: https://finance.yahoo.com/news/earnings-per-share-explained/';
  }

  if (has(q, ['what is p/e', 'what is pe', 'what is price to earnings', 'explain p/e', 'explain pe', 'earning multiple', 'earnings multiple', 'price earnings ratio', 'what is a multiple'])) {
    return 'P/E Ratio (Price-to-Earnings) measures how much investors pay for each dollar of earnings. ' +
      'Formula: Stock Price ÷ EPS. ' +
      'A high P/E means investors expect strong future growth. A low P/E may mean the stock is undervalued. ' +
      'Average S&P 500 P/E is around 20-25x. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is cagr', 'explain cagr', 'define cagr', 'compound annual growth', 'what does cagr mean'])) {
    return 'CAGR (Compound Annual Growth Rate) measures how fast something grows per year on average over a period. ' +
      'Formula: (End Value ÷ Start Value)^(1÷Years) - 1. ' +
      'Example: Revenue growing from $100B to $173B over 3 years = 20% CAGR. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is free cash flow', 'what is fcf', 'explain free cash flow', 'define fcf', 'what does fcf mean'])) {
    return 'Free Cash Flow (FCF) is the cash a company generates after paying for operations and capital expenditures. ' +
      'Formula: Operating Cash Flow - Capital Expenditures. ' +
      'Positive FCF means the company has money left to invest, pay dividends, or buy back stock. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is market cap', 'explain market cap', 'define market cap', 'market capitalization', 'what does market cap mean'])) {
    return 'Market Cap (Market Capitalization) is the total value of all a company\'s shares. ' +
      'Formula: Share Price × Total Shares Outstanding. ' +
      'Categories: Mega cap (>$200B), Large cap ($10B-$200B), Mid cap ($2B-$10B), Small cap (<$2B). ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is interest coverage', 'explain interest coverage', 'define interest coverage', 'interest coverage ratio'])) {
    return 'Interest Coverage Ratio measures how easily a company can pay its interest expenses. ' +
      'Formula: Operating Income ÷ Interest Expense. ' +
      'Above 3x is generally safe. Below 1x means the company cannot cover its debt payments. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is revenue', 'explain revenue', 'define revenue', 'what does revenue mean', 'what is top line'])) {
    return 'Revenue is the total money a company earns from selling products or services before any expenses. ' +
      'Also called "sales" or "top line". ' +
      'It is the starting point of the income statement. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is 10-k', 'what is a 10k', 'explain 10-k', 'define 10-k', 'what is an annual report'])) {
    return 'A 10-K is an annual report that every US public company must file with the SEC. ' +
      'It contains: financial statements, business description, risk factors, and management discussion. ' +
      'It is the most comprehensive document about a company\'s financial health. ' +
      'Search filings free at: https://www.sec.gov/cgi-bin/browse-edgar';
  }

  if (has(q, ['what is sec', 'explain sec', 'what does sec do', 'securities and exchange'])) {
    return 'The SEC (Securities and Exchange Commission) is the US government agency that regulates the stock market. ' +
      'It requires public companies to disclose financial information to protect investors. ' +
      'All filings are publicly available for free at: https://www.sec.gov/cgi-bin/browse-edgar';
  }

  if (has(q, ['what is edgar', 'what is sec edgar', 'explain edgar'])) {
    return 'SEC EDGAR is the free public database where all US public company filings are stored. ' +
      'EDGAR stands for Electronic Data Gathering, Analysis, and Retrieval. ' +
      'You can search any company\'s filings at: https://www.sec.gov/cgi-bin/browse-edgar';
  }

  if (has(q, ['what is rss', 'explain rss', 'what is rss feed', 'what does rss mean'])) {
    return 'RSS (Really Simple Syndication) is a format websites use to publish frequently updated content like news. ' +
      'Our platform uses Yahoo Finance RSS feeds to show live news for each company without needing an API key. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is yfinance', 'explain yfinance', 'what is yahoo finance api'])) {
    return 'yfinance is a free Python library that downloads financial data from Yahoo Finance. ' +
      'This platform uses it to fetch revenue, EPS, cash flow, and balance sheet data for all 19 companies. ' +
      'Documentation: https://pypi.org/project/yfinance/';
  }

  if (has(q, ['what is dividend', 'explain dividend', 'define dividend', 'what does dividend mean'])) {
    return 'A dividend is a portion of a company\'s profits paid to shareholders on a regular basis (usually quarterly). ' +
      'Not all companies pay dividends — growth companies often reinvest profits instead. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is volatility', 'explain volatility', 'define volatility'])) {
    return 'Volatility measures how much a stock\'s price fluctuates over time. ' +
      'High volatility = larger price swings = higher risk and potential reward. ' +
      'Low volatility = more stable price = lower risk. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is beta', 'explain beta', 'define beta', 'what does beta mean in stocks'])) {
    return 'Beta measures how much a stock moves relative to the overall market. ' +
      'Beta > 1 = more volatile than the market. Beta < 1 = less volatile. Beta = 1 = moves with the market. ' +
      'Example: Beta of 1.5 means if the market rises 10%, the stock tends to rise 15%. ' +
      'Learn more: https://finance.yahoo.com/';
  }

  if (has(q, ['what is gross margin', 'explain gross margin', 'define gross margin'])) {
    return 'Gross Margin is the percentage of revenue left after subtracting the cost of goods sold. ' +
      'Formula: (Revenue - Cost of Goods Sold) ÷ Revenue × 100. ' +
      'Higher gross margin = more profitable business model. Software companies often have 70%+ gross margins. ' +
      'Learn more: https://finance.yahoo.com/';
  }
  // ===== GENERAL QUESTIONS =====

  if (has(q, ['best', 'highest', 'top', 'strongest', 'number one']) && has(q, ['score', 'overall', 'rank', 'company', 'stock'])) {
    const top = qaData[0];
    return top.ticker + ' (' + top.company_name + ') has the highest overall score of ' + top.overall_score + '/100.';
  }

  if (has(q, ['worst', 'lowest', 'bottom', 'weakest', 'last']) && has(q, ['score', 'overall', 'rank', 'company', 'stock'])) {
    const bottom = qaData[qaData.length - 1];
    return bottom.ticker + ' (' + bottom.company_name + ') has the lowest overall score of ' + bottom.overall_score + '/100.';
  }

  if (has(q, ['best', 'highest', 'top', 'strongest', 'most', 'fastest']) && has(q, ['revenue', 'growth', 'growing', 'cagr'])) {
    const sorted = [...qaData].sort(function(a, b) {
      return (b.scores?.revenue_growth?.score || 0) - (a.scores?.revenue_growth?.score || 0);
    });
    const top = sorted[0];
    return top.ticker + ' (' + top.company_name + ') has the highest revenue growth score of ' + top.scores.revenue_growth.score + '/100.';
  }

  if (has(q, ['best', 'highest', 'top', 'strongest']) && has(q, ['financial', 'strength', 'debt', 'balance sheet'])) {
    const sorted = [...qaData].sort(function(a, b) {
      return (b.scores?.financial_strength?.score || 0) - (a.scores?.financial_strength?.score || 0);
    });
    const top = sorted[0];
    return top.ticker + ' (' + top.company_name + ') has the highest financial strength score of ' + top.scores.financial_strength.score + '/100.';
  }

  if (has(q, ['average', 'mean', 'avg']) && has(q, ['score', 'rating', 'overall'])) {
    const avg = qaData.reduce(function(sum, c) { return sum + (c.overall_score || 0); }, 0) / qaData.length;
    return 'The average overall score across all ' + qaData.length + ' companies is ' + avg.toFixed(1) + '/100.';
  }

  if (has(q, ['how many', 'count', 'total', 'number of']) && has(q, ['company', 'companies', 'stock', 'ticker'])) {
    return 'There are ' + qaData.length + ' companies in the watchlist.';
  }

  if (has(q, ['list', 'show all', 'all companies', 'all stocks', 'watchlist'])) {
    return 'Companies: ' + qaData.map(function(c) { return c.ticker; }).join(', ') + '.';
  }

  if (has(q, ['top 5', 'top five', 'ranking', 'rankings', 'leaderboard'])) {
    const top5 = qaData.slice(0, 5).map(function(c, i) {
      return (i + 1) + '. ' + c.ticker + ' (' + c.overall_score + ')';
    }).join(' | ');
    return 'Top 5: ' + top5;
  }

  if (has(q, ['help', 'what can', 'how to use', 'example', 'what do you know'])) {
    return 'Try asking: "What is MSFT score?", "What was GS revenue in 2024?", "Compare MSFT and GOOGL", "Which company has the highest revenue growth?", "What is NVDA P/E ratio?", "Show AAPL revenue history", "What is the average score?", "List all companies".';
  }

  return "I couldn't find a clear answer. Try asking about a specific ticker like 'What is MSFT score?' or 'What was GS revenue in 2023?' Type 'help' to see more examples.";
}

function compareCompanies(c1, c2) {
  const fin1 = c1.sec_filing?.financials || {};
  const fin2 = c2.sec_filing?.financials || {};
  const winner = c1.overall_score >= c2.overall_score ? c1.ticker : c2.ticker;

  return 'Comparing ' + c1.ticker + ' vs ' + c2.ticker + ': ' +
    'Overall Score: ' + c1.overall_score + ' vs ' + c2.overall_score + '. ' +
    'Revenue Growth: ' + (c1.scores?.revenue_growth?.score ?? 'N/A') + ' vs ' + (c2.scores?.revenue_growth?.score ?? 'N/A') + '. ' +
    'Financial Strength: ' + (c1.scores?.financial_strength?.score ?? 'N/A') + ' vs ' + (c2.scores?.financial_strength?.score ?? 'N/A') + '. ' +
    'EPS: ' + (fin1.eps != null ? '$' + fin1.eps.toFixed(2) : 'N/A') + ' vs ' + (fin2.eps != null ? '$' + fin2.eps.toFixed(2) : 'N/A') + '. ' +
    'Revenue: ' + formatRevenue(fin1.revenue) + ' vs ' + formatRevenue(fin2.revenue) + '. ' +
    'Winner: ' + winner + '.';
}