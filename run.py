import subprocess
import sys
import os

# Step 1: Export dashboard data
print("Updating dashboard data...")
subprocess.run([sys.executable, "app/export_dashboard_data.py"], check=True)

# Step 2: Start news proxy in background
print("Starting news proxy on port 5000...")
news_proxy = subprocess.Popen([sys.executable, "app/news_proxy.py"])

# Step 3: Start dashboard server
print("Starting dashboard on http://127.0.0.1:8080/app/dashboard.html")
try:
    subprocess.run([sys.executable, "-m", "http.server", "8080"])
except KeyboardInterrupt:
    print("\nShutting down...")
    news_proxy.terminate()