# Import the yfinance library so we can download company financial data.
import yfinance as yf
import os
import json
import sys

# Make sure the project root (the folder that contains both "app" and
# "config") is on the import path. Without this, running the script
# directly as "python app/scoring.py" fails with:
#   ModuleNotFoundError: No module named 'config'
# because Python only adds the script's own folder (app/) to sys.path,
# not its parent.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# Create a reusable function that converts a CAGR percentage into a score.
def growth_score(cagr_percent):

    # Very poor or negative growth.
    if cagr_percent <= 0:
        return 10

    # Low growth (0% to 3%).
    elif cagr_percent <= 3:
        return 20 + (cagr_percent / 3) * 10

    # Moderate growth (3% to 7%).
    elif cagr_percent <= 7:
        return 30 + ((cagr_percent - 3) / 4) * 20

    # Good growth (7% to 12%).
    elif cagr_percent <= 12:
        return 50 + ((cagr_percent - 7) / 5) * 20

    # Strong growth (12% to 20%).
    elif cagr_percent <= 20:
        return 70 + ((cagr_percent - 12) / 8) * 20

    # Exceptional growth (20% to 30%).
    elif cagr_percent <= 30:
        return 90 + ((cagr_percent - 20) / 10) * 8

    # Extraordinary growth (above 30%).
    else:
        return 100


# Create a function that scores revenue growth.
def score_revenue_growth(ticker):

    try:

        # Connect to Yahoo Finance.
        company = yf.Ticker(ticker)

        # Download annual financial statements.
        financials = company.financials

        # Verify that financial data exists.
        if financials.empty:
            return {
                "score": None,
                "explanation": "Revenue data was unavailable."
            }

        # Find the revenue row.
        revenue_row = None

        for row in ["Total Revenue", "Revenue"]:
            if row in financials.index:
                revenue_row = row
                break

        if revenue_row is None:
            return {
                "score": None,
                "explanation": "Revenue data was unavailable."
            }

        # Get annual revenue values.
        revenues = financials.loc[revenue_row].dropna()

        # Require at least four annual observations.
        if len(revenues) < 4:
            return {
                "score": None,
                "explanation": "Less than four years of annual revenue data is available."
            }

        newest = revenues.iloc[0]
        oldest = revenues.iloc[3]

        # Make sure revenue values are valid.
        if newest <= 0 or oldest <= 0:
            return {
                "score": None,
                "explanation": "Revenue values are invalid."
            }

        # Four annual values represent three years of growth.
        years = 3

        # Calculate CAGR.
        cagr = ((newest / oldest) ** (1 / years) - 1) * 100

        # Calculate a precise score.
        score = round(growth_score(cagr), 1)

        # Generate an explanation.
        if score >= 90:
            quality = "exceptional"

        elif score >= 70:
            quality = "strong"

        elif score >= 50:
            quality = "healthy"

        elif score >= 30:
            quality = "modest"

        else:
            quality = "weak"

        explanation = (
            f"{ticker.upper()} generated a revenue CAGR of "
            f"{cagr:.1f}% over the available period. "
            f"This is considered {quality} long-term revenue growth, "
            f"resulting in a score of {score}/100."
        )

        return {
            "score": score,
            "explanation": explanation
        }

    except Exception as error:

        return {
            "score": None,
            "explanation": f"Unable to calculate revenue growth: {error}"
        }


# Create a function that scores a company's financial strength.
def score_financial_strength(ticker):

    # Use a try block so the program won't crash if something goes wrong.
    try:

        # Connect to Yahoo Finance.
        company = yf.Ticker(ticker)

        # Download the company's annual income statement.
        income_statement = company.financials

        # Download the company's balance sheet.
        balance_sheet = company.balance_sheet

        # Download the company's cash flow statement.
        cashflow = company.cashflow

        # Verify that all required statements contain data.
        if (
            income_statement.empty
            or balance_sheet.empty
            or cashflow.empty
        ):
            return {
                "score": None,
                "explanation": "Financial statement data was unavailable."
            }

        # -------------------------------
        # Get Operating Income (EBIT)
        # -------------------------------
        ebit = None

        for row in ["Operating Income", "EBIT"]:
            if row in income_statement.index:
                ebit = income_statement.loc[row].dropna().iloc[0]
                break

        # -------------------------------
        # Get Interest Expense
        # -------------------------------
        interest_expense = None

        for row in ["Interest Expense", "Interest Expense Non Operating"]:
            if row in income_statement.index:
                interest_expense = abs(
                    income_statement.loc[row].dropna().iloc[0]
                )
                break

        # -------------------------------
        # Get Total Debt
        # -------------------------------
        total_debt = 0

        if "Total Debt" in balance_sheet.index:
            total_debt = balance_sheet.loc["Total Debt"].dropna().iloc[0]

        # -------------------------------
        # Company has essentially no debt.
        # -------------------------------
        if total_debt == 0:

            return {
                "score": 95,
                "explanation":
                    "The company carries little or no interest-bearing debt. "
                    "Its balance sheet is exceptionally strong, resulting in "
                    "a financial strength score of 95/100."
            }

        # -------------------------------
        # Cannot calculate coverage ratio.
        # -------------------------------
        if (
            ebit is None
            or interest_expense is None
            or interest_expense == 0
        ):

            return {
                "score": None,
                "explanation":
                    "Interest coverage could not be calculated because "
                    "interest expense data was unavailable."
            }

        # -------------------------------
        # Calculate Interest Coverage
        # -------------------------------
        coverage = ebit / interest_expense

        # -------------------------------
        # Base Score
        # -------------------------------
        if coverage >= 15:

            score = 90

        elif coverage >= 8:

            score = 75

        elif coverage >= 3:

            score = 55

        else:

            score = 25

        # -------------------------------
        # Calculate Free Cash Flow
        # -------------------------------
        free_cash_flow = None

        if (
            "Operating Cash Flow" in cashflow.index
            and "Capital Expenditure" in cashflow.index
        ):

            operating_cf = cashflow.loc[
                "Operating Cash Flow"
            ].dropna().iloc[0]

            capex = cashflow.loc[
                "Capital Expenditure"
            ].dropna().iloc[0]

            # Capital expenditures are normally negative.
            free_cash_flow = operating_cf + capex

        # -------------------------------
        # Add Bonus for Positive FCF
        # -------------------------------
        if free_cash_flow is not None:

            if free_cash_flow > 5_000_000_000:

                score += 15

            elif free_cash_flow > 1_000_000_000:

                score += 12

            elif free_cash_flow > 0:

                score += 10

        # Prevent the score from exceeding 100.
        score = min(score, 100)

        # -------------------------------
        # Create Explanation
        # -------------------------------
        explanation = (
            f"{ticker.upper()} has an interest coverage ratio "
            f"of {coverage:.1f}x. "
        )

        if coverage >= 15:

            explanation += (
                "The company easily covers its interest obligations, "
                "indicating excellent financial strength."
            )

        elif coverage >= 8:

            explanation += (
                "The company has strong ability to service its debt."
            )

        elif coverage >= 3:

            explanation += (
                "The company has adequate financial strength, "
                "although debt should continue to be monitored."
            )

        else:

            explanation += (
                "The company's interest coverage is relatively weak, "
                "which increases financial risk."
            )

        if free_cash_flow is not None and free_cash_flow > 0:

            explanation += (
                " Positive free cash flow increased the score."
            )

        # Return the final score and explanation.
        return {
            "score": round(score, 1),
            "explanation": explanation
        }

    # Catch unexpected errors.
    except Exception as error:

        return {
            "score": None,
            "explanation": f"Unable to calculate financial strength: {error}"
        }



# Create a function that generates a complete score report.
def generate_score_report(ticker):

    # Use a try block so the program won't crash if something goes wrong.
    try:

        # Download company information.
        company = yf.Ticker(ticker)

        # Get the company's general information.
        info = company.info

        # Get the company name.
        company_name = info.get("longName", ticker.upper())

        # Run the Revenue Growth score.
        revenue = score_revenue_growth(ticker)

        # Run the Financial Strength score.
        financial = score_financial_strength(ticker)

        # Assign weights.
        revenue_weight = 20
        financial_weight = 20

        # Start totals.
        weighted_total = 0
        total_weight = 0

        # Only include valid scores.
        if revenue["score"] is not None:
            weighted_total += revenue["score"] * revenue_weight
            total_weight += revenue_weight

        if financial["score"] is not None:
            weighted_total += financial["score"] * financial_weight
            total_weight += financial_weight

        # Calculate the weighted overall score.
        if total_weight > 0:
            overall_score = round(weighted_total / total_weight, 1)
        else:
            overall_score = None

        # Create the final report.
        report = {
            "ticker": ticker.upper(),
            "company_name": company_name,
            "overall_score": overall_score,
            "scores": {
                "revenue_growth": revenue,
                "financial_strength": financial
            }
        }

        # Create the folder if it doesn't already exist.
        from config.settings import SCORES_FOLDER

        os.makedirs(SCORES_FOLDER, exist_ok=True)

        filename = os.path.join(
            SCORES_FOLDER,
            f"{ticker.upper()}_scores.json"
        )       
        
        # Save the report.
        with open(filename, "w", encoding="utf-8") as file:
            json.dump(report, file, indent=4)

        # Return the report.
        return report

    # Catch unexpected errors.
    except Exception as error:

        return {
            "ticker": ticker.upper(),
            "overall_score": None,
            "error": str(error)
        }

# Create a function that loads the ticker watchlist from disk.
def load_watchlist(path=None):

    # Default to the path configured in config/settings.py.
    if path is None:
        from config.settings import WATCHLIST_FILE
        path = WATCHLIST_FILE

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    # watchlist.json stores a "watchlist" key containing a list of
    # objects, each with a "ticker" field (plus "name" and "reason").
    entries = data.get("watchlist", [])

    tickers = [entry["ticker"] for entry in entries if "ticker" in entry]

    return tickers


# Create a function that generates score reports for every ticker
# in the watchlist, skipping any ticker that fails.
def generate_all_score_reports(watchlist_path=None):

    tickers = load_watchlist(watchlist_path)

    reports = {}

    for ticker in tickers:

        print(f"Processing {ticker}...")

        try:
            report = generate_score_report(ticker)

            # generate_score_report catches its own errors and returns
            # a dict with an "error" key instead of raising, so check
            # for that here too.
            if report.get("overall_score") is None and "error" in report:
                print(f"  Warning: skipping {ticker} - {report['error']}")
                continue

            reports[ticker.upper()] = report

            print(f"  Done. Overall Score: {report['overall_score']}")

        except Exception as error:
            print(f"  Warning: skipping {ticker} - {error}")
            continue

    return reports


if __name__ == "__main__":
    generate_all_score_reports()