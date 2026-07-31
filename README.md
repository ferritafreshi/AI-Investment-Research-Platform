# AI Investment Research Platform

A Python-based investment research platform that fetches live financial data, scores companies, and displays results in an interactive dashboard. These companies are believed of good quality companies.

## Features

- **19 Growth Stock Universe** — MSFT, NVDA, COST, AAPL, GOOGL, AMZN, META, LLY, UNH, V, MA, AVGO, TSM, ASML, ADBE, CRM, NOW, PANW, SNOW
- **Scoring Engine** — Revenue Growth (CAGR) and Financial Strength (Interest Coverage) scored 0–100
- **Interactive Dashboard** — Dark theme, score bars, ranked table, draggable summary cards
- **SEC Filings** — Fetches latest 10-K filing for each company via SEC EDGAR (free)
- **Key Financials** — EPS, P/E Ratio, Revenue displayed per company
- **Live News** — Yahoo Finance RSS news feed per company (requires news proxy)
- **Charts** — Score ranking chart, revenue history, score breakdown per company
- **Company Comparison** — Side-by-side comparison of any two companies
- **Risk Analysis** — Debt risk, valuation risk, and size risk per company
- **Q&A Engine** — Natural language questions about companies and financial concepts
- **Training Portal** — Weekly lessons, glossary, and quiz

## Project Structure
ai-investment-research-platform/
├── app/
│ ├── dashboard.html # Main dashboard UI
│ ├── dashboard.js # Dashboard rendering and interactivity
│ ├── style.css # Dark theme styles
│ ├── qa_engine.js # Natural language Q&A engine
│ ├── risk_engine.js # Risk analysis calculator
│ ├── fetch_data.py # Fetches company snapshots from Yahoo Finance
│ ├── scoring.py # Revenue growth and financial strength scoring
│ ├── fetch_sec.py # Fetches SEC 10-K filings from EDGAR
│ ├── fetch_historical.py # Fetches historical revenue data
│ ├── export_dashboard_data.py # Aggregates all data into dashboard_data.json
│ └── news_proxy.py # Flask proxy for Yahoo Finance RSS news
├── data/
│ ├── watchlist.json # 19 company tickers
│ ├── dashboard_data.json # Aggregated dashboard data
│ ├── raw/ # Company snapshots (JSON)
│ ├── scores/ # Individual score reports (JSON)
│ ├── filings/ # SEC filing metadata (JSON)
│ └── historical/ # Historical revenue data (JSON)
├── training/
│ ├── index.html # Progress tracker
│ ├── lessons.html # Weekly lesson notes
│ ├── glossary.html # Financial terms glossary
│ ├── quiz.html # Knowledge quiz
│ ├── tracker.json # Progress tracking data
│ └── milestones.json # Weekly milestones
├── docs/
│ ├── Development_Log.md # Week-by-week development log
│ ├── Decisions.md # Key decisions made
│ └── Investment_Methodology.md
└── run.py # Single command to start everything


## Quick Start

### 1. Install dependencies
In bash, type:
pip install yfinance flask flask-cors feedparser requests


### 2. Fetch and score all companies
In bash, type:
python app/fetch_data.py
python app/scoring.py
python app/fetch_sec.py
python app/fetch_historical.py
python app/export_dashboard_data.py


### 3. Run the platform
In bash, type:
python run.py

### 4. Open in browser
- **Dashboard:** http://127.0.0.1:8080/app/dashboard.html
- **Training Portal:** http://127.0.0.1:8080/training/index.html

## Scoring Methodology

### Revenue Growth Score (0–100)
Measures 3-year revenue CAGR:
- < 0%: Score 10
- 0–3%: Score 20–30
- 3–7%: Score 30–50
- 7–12%: Score 50–70
- 12–20%: Score 70–90
- 20–30%: Score 90–98
- > 30%: Score 100

### Financial Strength Score (0–100)
Measures interest coverage ratio + free cash flow bonus:
- Coverage < 3x: Base 25
- Coverage 3–8x: Base 55
- Coverage 8–15x: Base 75
- Coverage > 15x: Base 90
- FCF > $1B: +10 to +15 bonus points

## Data Sources
- **Yahoo Finance** (via yfinance) — financial statements, company info
- **SEC EDGAR** — annual 10-K filings (free, no API key)
- **Yahoo Finance RSS** — live news headlines

## Requirements
- Python 3.8+
- yfinance, flask, flask-cors, feedparser, requests
- No paid API keys required

## License
MIT