# ============================================================
# export_dashboard_data.py
#
# This script combines all company score files into one JSON
# file that will be used by the HTML dashboard.
# ============================================================

# Import the os module so we can work with folders and files.
import os

# Import the json module so we can read and write JSON files.
import json

# Import sys so we can add the project root to the import path.
import sys

# Make sure the project root (the folder that contains both "app" and
# "config") is on the import path, so this works whether run as
# "python app/export_dashboard_data.py" or from another directory.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)


# ------------------------------------------------------------
# Define where the company score files are stored.
# ------------------------------------------------------------
from config.settings import (
    SCORES_FOLDER,
    DASHBOARD_FILE
)

SOURCE_FOLDER = SCORES_FOLDER

OUTPUT_FILE = DASHBOARD_FILE

# Define where the dashboard data will be saved.
OUTPUT_FOLDER = "app"



# ------------------------------------------------------------
# Create the output folder if it does not already exist.
# ------------------------------------------------------------
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# ------------------------------------------------------------
# Create an empty list that will hold all companies.
# ------------------------------------------------------------
companies = []


# ------------------------------------------------------------
# Verify that the source folder exists.
# ------------------------------------------------------------
if not os.path.exists(SOURCE_FOLDER):

    print(f"Warning: '{SOURCE_FOLDER}' does not exist.")

else:

    # --------------------------------------------------------
    # Loop through every file inside the score folder.
    # --------------------------------------------------------
    for filename in os.listdir(SOURCE_FOLDER):

        # Only process JSON files.
        if filename.endswith(".json"):

            # Build the full file path.
            filepath = os.path.join(SOURCE_FOLDER, filename)

            try:

                # Open the JSON file.
                with open(filepath, "r", encoding="utf-8") as file:

                    # Read the JSON data.
                    data = json.load(file)

                # Create a simplified dictionary for the dashboard.
                company = {
                    "ticker": data.get("ticker"),
                    "company_name": data.get("company_name"),
                    "overall_score": data.get("overall_score"),
                    "scores": {}
                }

                # Copy each scoring category.
                scores = data.get("scores", {})

                for category_name, category_data in scores.items():

                    company["scores"][category_name] = {
                        "score": category_data.get("score"),
                        "explanation": category_data.get("explanation")
                    }

                # Add this company to the list.
                companies.append(company)

            except json.JSONDecodeError:

                print(f"Warning: '{filename}' contains invalid JSON and was skipped.")

            except Exception as error:

                print(f"Warning: Could not read '{filename}'. {error}")


# ------------------------------------------------------------
# Sort companies from highest score to lowest.
# Companies with missing scores appear at the bottom.
# ------------------------------------------------------------
companies.sort(
    key=lambda company: (
        company["overall_score"]
        if company["overall_score"] is not None
        else -1
    ),
    reverse=True
)


# ------------------------------------------------------------
# Save the combined dashboard data.
# ------------------------------------------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as file:

    json.dump(companies, file, indent=4)


# ------------------------------------------------------------
# Display a success message.
# ------------------------------------------------------------
print(f"Dashboard data exported successfully to '{OUTPUT_FILE}'.")

print(f"Companies exported: {len(companies)}")