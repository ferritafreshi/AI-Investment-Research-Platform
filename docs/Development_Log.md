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