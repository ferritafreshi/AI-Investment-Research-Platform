import requests
import json
import os

# SEC EDGAR headers (required by SEC)
HEADERS = {
    "User-Agent": "AI Investment Research Platform contact@example.com"
}

# Paths (run from project root)
FILINGS_DIR = "data/filings"


def get_cik(ticker):
    """Look up the SEC CIK number for a ticker."""
    url = "https://efts.sec.gov/LATEST/search-index?q=%22{}%22&dateRange=custom&startdt=2020-01-01&enddt=2026-01-01&forms=10-K".format(ticker)
    
    # Use the company tickers JSON from SEC
    tickers_url = "https://www.sec.gov/files/company_tickers.json"
    response = requests.get(tickers_url, headers=HEADERS)
    data = response.json()

    for entry in data.values():
        if entry["ticker"].upper() == ticker.upper():
            # CIK must be 10 digits padded with zeros
            return str(entry["cik_str"]).zfill(10)
    return None


def get_latest_10k(cik):
    """Fetch the latest 10-K filing metadata for a given CIK."""
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    response = requests.get(url, headers=HEADERS)
    data = response.json()

    filings = data.get("filings", {}).get("recent", {})
    forms = filings.get("form", [])
    dates = filings.get("filingDate", [])
    accession_numbers = filings.get("accessionNumber", [])
    primary_documents = filings.get("primaryDocument", [])

    for i, form in enumerate(forms):
        if form == "10-K":
            return {
                "form": form,
                "filing_date": dates[i],
                "accession_number": accession_numbers[i],
                "primary_document": primary_documents[i],
                "cik": cik
            }
    return None


def build_filing_url(cik, accession_number, primary_document):
    """Build the URL to the actual filing document."""
    accession_clean = accession_number.replace("-", "")
    return (
        f"https://www.sec.gov/Archives/edgar/data/"
        f"{int(cik)}/{accession_clean}/{primary_document}"
    )


def fetch_sec_filing(ticker):
    """Main function: fetch and save SEC 10-K filing info for a ticker."""
    print(f"Looking up CIK for {ticker}...")
    cik = get_cik(ticker)
    if not cik:
        print(f"Could not find CIK for {ticker}")
        return None

    print(f"CIK found: {cik}")
    print(f"Fetching latest 10-K...")
    filing = get_latest_10k(cik)
    if not filing:
        print(f"No 10-K found for {ticker}")
        return None

    filing_url = build_filing_url(
        filing["cik"],
        filing["accession_number"],
        filing["primary_document"]
    )

    result = {
        "ticker": ticker.upper(),
        "form": filing["form"],
        "filing_date": filing["filing_date"],
        "accession_number": filing["accession_number"],
        "filing_url": filing_url
    }

    os.makedirs(FILINGS_DIR, exist_ok=True)
    output_path = os.path.join(FILINGS_DIR, f"{ticker.upper()}_filing.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"Saved to {output_path}")
    print(f"Filing URL: {filing_url}")
    return result


if __name__ == "__main__":
    import json
    with open("data/watchlist.json", "r") as f:
        data = json.load(f)
    
    if "watchlist" in data:
        tickers = [item["ticker"] for item in data["watchlist"]]
    else:
        tickers = data.get("tickers", [])

    print(f"Fetching SEC filings for {len(tickers)} tickers...")
    for ticker in tickers:
        print(f"\n--- {ticker} ---")
        fetch_sec_filing(ticker)