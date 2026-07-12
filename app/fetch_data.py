# Import the yfinance library so we can download company financial data.
import yfinance as yf


# Create a function that accepts a stock ticker (for example: "MSFT").
def get_company_snapshot(ticker):

    # Use a try block so the program doesn't crash if something goes wrong.
    try:

        # Connect to Yahoo Finance and create a company object.
        company = yf.Ticker(ticker)

        # Download the company's general information.
        info = company.info

        # Download the company's cash flow statement.
        cashflow = company.cashflow

        # Start by assuming we don't know the free cash flow.
        free_cash_flow = None

        # Check that the cash flow table actually contains data.
        if not cashflow.empty:

            # Look for the Operating Cash Flow row.
            operating_cash_flow = cashflow.loc["Operating Cash Flow"].iloc[0] \
                if "Operating Cash Flow" in cashflow.index else None

            # Look for the Capital Expenditure row.
            capital_expenditures = cashflow.loc["Capital Expenditure"].iloc[0] \
                if "Capital Expenditure" in cashflow.index else None

            # If both values exist, calculate Free Cash Flow.
            if operating_cash_flow is not None and capital_expenditures is not None:

                # Capital Expenditures are usually negative, so adding them
                # is the same as subtracting the absolute amount.
                free_cash_flow = operating_cash_flow + capital_expenditures

        # Create a dictionary containing the information we want.
        snapshot = {
            "ticker": ticker.upper(),
            "company_name": info.get("longName"),
            "sector": info.get("sector"),
            "market_cap": info.get("marketCap"),
            "trailing_eps": info.get("trailingEps"),
            "free_cash_flow": free_cash_flow
        }

        # Return the completed dictionary.
        return snapshot

    # If anything goes wrong, catch the error instead of crashing.
    except Exception as error:

        # Print a warning message explaining which ticker failed.
        print(f"Warning: Could not retrieve data for '{ticker}'. {error}")

        # Return nothing because the request failed.
        return None