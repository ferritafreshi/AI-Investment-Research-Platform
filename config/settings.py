# ============================================================
# Project Configuration
# ============================================================

# ------------------------------------------------------------
# Project Information
# ------------------------------------------------------------

APP_NAME = "AI Investment Research Platform"
VERSION = "0.1.0"

# ------------------------------------------------------------
# Folder Locations
# ------------------------------------------------------------

APP_FOLDER = "app"
DATA_FOLDER = "data"
LOG_FOLDER = "logs"

WATCHLIST_FILE = "data/watchlist.json"
SCORES_FOLDER = "data/scores"
DASHBOARD_FILE = "app/dashboard_data.json"

# ------------------------------------------------------------
# Investment Universe Filters
# ------------------------------------------------------------

EXCLUDED_SECTORS = [
    "financial services"
]

EXCLUDED_INDUSTRIES = [
    "airline",
    "airlines",
    "department store",
    "department stores",
    "regional bank",
    "bank",
    "insurance"
]