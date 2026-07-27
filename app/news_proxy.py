from flask import Flask, jsonify
from flask_cors import CORS
import feedparser

app = Flask(__name__)
CORS(app)

def get_news(ticker):
    """Fetch latest news headlines from Yahoo Finance RSS for a ticker."""
    url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US"
    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries[:5]:
        articles.append({
            "title": entry.get("title", ""),
            "link": entry.get("link", ""),
            "published": entry.get("published", "")
        })
    return articles

@app.route("/news/<ticker>")
def news(ticker):
    articles = get_news(ticker.upper())
    return jsonify(articles)

if __name__ == "__main__":
    print("News proxy running on http://127.0.0.1:5000")
    app.run(port=5000, debug=False)