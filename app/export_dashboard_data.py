import json
import os
from datetime import datetime

# Paths (run from project root)
SCORES_DIR = "data/scores"
FILINGS_DIR = "data/filings"
WATCHLIST_FILE = "data/watchlist.json"
OUTPUT_FILE = "data/dashboard_data.json"


def load_watchlist():
    with open(WATCHLIST_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Support both formats
    if "tickers" in data:
        return data["tickers"]
    elif "watchlist" in data:
        return [item["ticker"] for item in data["watchlist"]]
    return []


def load_filing(ticker):
    """Load SEC filing data for a ticker if it exists."""
    filing_file = os.path.join(FILINGS_DIR, f"{ticker.upper()}_filing.json")
    raw_file = os.path.join("data/raw", f"{ticker.upper()}.json")
    
    result = {}
    
    if os.path.exists(filing_file):
        with open(filing_file, "r", encoding="utf-8") as f:
            result = json.load(f)
    
    # Add key financials from raw data if available
    if os.path.exists(raw_file):
        with open(raw_file, "r", encoding="utf-8") as f:
            raw = json.load(f)
        result["financials"] = {
            "eps": raw.get("trailing_eps"),
            "market_cap": raw.get("market_cap"),
            "revenue": raw.get("revenue"),
            "pe_ratio": raw.get("pe_ratio")
        }
    
    return result if result else None


def load_score_files(tickers):
    companies = []
    for ticker in tickers:
        score_file = os.path.join(SCORES_DIR, f"{ticker.upper()}_scores.json")
        if os.path.exists(score_file):
            with open(score_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Attach SEC filing if available
            filing = load_filing(ticker)
            if filing:
                data["sec_filing"] = {
                    "form": filing.get("form"),
                    "filing_date": filing.get("filing_date"),
                    "filing_url": filing.get("filing_url"),
                    "financials": filing.get("financials")
                }
            companies.append(data)
        else:
            print(f"No score file found for {ticker}, skipping.")
    return companies


def build_dashboard_data(companies):
    valid = [c for c in companies if c.get("overall_score") is not None]

    if not valid:
        return {
            "generated_at": datetime.now().isoformat(),
            "total_companies": 0,
            "average_score": None,
            "top_company": None,
            "companies": []
        }

    valid.sort(key=lambda x: x["overall_score"], reverse=True)
    average_score = round(
        sum(c["overall_score"] for c in valid) / len(valid), 1
    )
    top = valid[0]

    return {
        "generated_at": datetime.now().isoformat(),
        "total_companies": len(valid),
        "average_score": average_score,
        "top_company": {
            "ticker": top["ticker"],
            "company_name": top["company_name"],
            "overall_score": top["overall_score"]
        },
        "companies": valid
    }


def main():
    tickers = load_watchlist()
    print(f"Loaded {len(tickers)} tickers from watchlist.")
    companies = load_score_files(tickers)
    print(f"Loaded score files for {len(companies)} companies.")
    dashboard = build_dashboard_data(companies)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dashboard, f, indent=2)

    print(f"Dashboard data written to {OUTPUT_FILE}")
    print(f"  Companies: {dashboard['total_companies']}")
    print(f"  Average Score: {dashboard['average_score']}")


if __name__ == "__main__":
    main()