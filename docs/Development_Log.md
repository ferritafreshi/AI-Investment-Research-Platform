## Week 1
- Set up the GitHub, installed Python, and VS Code
## Week 2
- Built app/fetch_data.py using yfinance
- Successfully pulled live snapshot data for MSFT, NVDA, COST
- Saved results to data/raw/MSFT.json, NVDA.json, COST.json
## Week 3
- Built app/scoring.py with two scoring functions
- score_revenue_growth(): calculates 4-year revenue CAGR, scores 0–100
- score_financial_strength(): calculates interest coverage ratio, scores 0–100
- generate_score_report(): combines scores and saves to data/scores/
- Tested on MSFT, NVDA, COST — results sanity checked
## Week 4
- Built app/dashboard.html with header, summary cards, and company rankings table
- Built app/style.css with dark theme, score bars, and responsive layout
- Built app/dashboard.js to fetch dashboard_data.json and render the UI dynamically
- Built app/export_dashboard_data.py to aggregate all score files into dashboard_data.json
- Confirmed dashboard loads correctly in the browser and displays company scores
## Week 5
- Created data/watchlist.json with 19 growth stock tickers
- Updated fetch_data.py to load tickers from watchlist.json instead of hardcoded list
- Updated scoring.py to load tickers from watchlist.json instead of hardcoded list
- Ran scoring on all 19 companies and exported updated dashboard_data.json
- Confirmed dashboard displays full 19-company universe with scores and explanations
## Week 6
- Created app/fetch_sec.py to fetch SEC 10-K filings from SEC EDGAR for all 19 tickers
- Saved filing data to data/filings/ as individual JSON files
- Updated app/export_dashboard_data.py to include SEC filing URL and key financials
- Updated fetch_data.py to capture pe_ratio and revenue fields
- Added SEC Filing popup modal to dashboard with EPS, P/E Ratio, and Revenue
- Confirmed SEC Filing button works for all 19 companies
## Week 7
- Created app/news_proxy.py using Flask to fetch Yahoo Finance RSS news feeds
- Added live news headlines as clickable links on each company row
- Built company comparison panel showing scores and financials side by side
- Added Compare checkbox below SEC Filing button on each company
- Created run.py to start all servers and update dashboard data with one command
## Week 8
- Built training/lessons.html with weekly lesson notes for Weeks 1-7
- Built training/glossary.html with searchable definitions for 15 financial and technical terms
- Built training/quiz.html with 10 questions, Previous/Next navigation, and answer review mode
- Added navigation links to all training portal pages
- Added score methodology