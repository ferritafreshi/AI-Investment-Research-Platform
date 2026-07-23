import yfinance as yf
import os
import json
from pathlib import Path

# Find the project root (one level above the app folder)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

WATCHLIST_FILE = PROJECT_ROOT / "data" / "watchlist.json"
EXCLUDED_SECTORS = ["airlines", "banking", "insurance"]
EXCLUDED_INDUSTRIES = ["airline", "department store", "regional bank", "insurance"]

def is_excluded(company_info):
    sector = str(company_info.get("sector", "")).lower()
    industry = str(company_info.get("industry", "")).lower()
    for excluded in EXCLUDED_INDUSTRIES:
        if excluded in industry:
            print(f"Excluding (Industry: {company_info.get('industry', 'Unknown')})")
            return True
    for excluded in EXCLUDED_SECTORS:
        if excluded in sector:
            print(f"Excluding (Sector: {company_info.get('sector', 'Unknown')})")
            return True
    return False

def get_company_snapshot(ticker):
    try:
        company = yf.Ticker(ticker)
        info = company.info
        cashflow = company.cashflow
        free_cash_flow = None
        if not cashflow.empty:
            operating_cash_flow = cashflow.loc["Operating Cash Flow"].iloc[0] \
                if "Operating Cash Flow" in cashflow.index else None
            capital_expenditures = cashflow.loc["Capital Expenditure"].iloc[0] \
                if "Capital Expenditure" in cashflow.index else None
            if operating_cash_flow is not None and capital_expenditures is not None:
                free_cash_flow = operating_cash_flow + capital_expenditures
        return {
            "ticker": ticker.upper(),
            "company_name": info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "trailing_eps": info.get("trailingEps"),
            "pe_ratio": info.get("trailingPE"),
            "revenue": info.get("totalRevenue"),
            "free_cash_flow": free_cash_flow
        }
    except Exception as error:
        print(f"Warning: Could not retrieve data for '{ticker}'. {error}")
        return None

def load_watchlist():
    if not os.path.exists(WATCHLIST_FILE):
        print(f"Warning: '{WATCHLIST_FILE}' was not found.")
        return []
    try:
        with open(WATCHLIST_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
        return [entry["ticker"] for entry in data.get("watchlist", [])]
    except Exception as error:
        print(f"Warning: Unable to read watchlist.json ({error})")
        return []

if __name__ == "__main__":
    os.makedirs("data/raw", exist_ok=True)
    tickers = load_watchlist()
    success_count = 0
    failure_count = 0
    excluded_count = 0
    for ticker in tickers:
        print(f"\nProcessing {ticker}...")
        snapshot = get_company_snapshot(ticker)
        if snapshot is None:
            failure_count += 1
            continue
        if is_excluded(snapshot):
            excluded_count += 1
            continue
        file_path = f"data/raw/{ticker.upper()}.json"
        with open(file_path, "w", encoding="utf-8") as file:
            json.dump(snapshot, file, indent=4)
        print(f"Saved {ticker} to {file_path}")
        success_count += 1
    print("\n" + "=" * 50)
    print("DATA DOWNLOAD SUMMARY")
    print("=" * 50)
    print(f"Total tickers : {len(tickers)}")
    print(f"Successful    : {success_count}")
    print(f"Excluded      : {excluded_count}")
    print(f"Failed        : {failure_count}")
    print("=" * 50)