import yfinance as yf
import json
import os

# Paths (run from project root)
WATCHLIST_FILE = "data/watchlist.json"
HISTORICAL_DIR = "data/historical"


def load_watchlist():
    with open(WATCHLIST_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    if "watchlist" in data:
        return [item["ticker"] for item in data["watchlist"]]
    return data.get("tickers", [])


def fetch_historical_revenue(ticker):
    """Fetch up to 4 years of annual revenue for a ticker."""
    try:
        company = yf.Ticker(ticker)
        financials = company.financials

        if financials.empty:
            print(f"{ticker}: No financial data available.")
            return None

        revenue_row = None
        for row in ["Total Revenue", "Revenue"]:
            if row in financials.index:
                revenue_row = row
                break

        if revenue_row is None:
            print(f"{ticker}: No revenue row found.")
            return None

        revenues = financials.loc[revenue_row].dropna()

        # Build year-by-year data
        history = []
        for date, value in revenues.items():
            history.append({
                "year": str(date.year),
                "revenue": round(float(value) / 1e9, 2)  # Convert to billions
            })

        # Sort oldest to newest
        history.sort(key=lambda x: x["year"])

        result = {
            "ticker": ticker.upper(),
            "revenue_history": history
        }

        os.makedirs(HISTORICAL_DIR, exist_ok=True)
        output_path = os.path.join(HISTORICAL_DIR, f"{ticker.upper()}_historical.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print(f"{ticker}: Saved {len(history)} years of revenue data.")
        return result

    except Exception as e:
        print(f"{ticker}: Error — {e}")
        return None


if __name__ == "__main__":
    tickers = load_watchlist()
    print(f"Fetching historical revenue for {len(tickers)} tickers...")
    for ticker in tickers:
        fetch_historical_revenue(ticker)
    print("Done.")