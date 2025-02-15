from flask import Flask, request, jsonify
from flask_cors import CORS
from scraper import GoogleShoppingScraper
from dotenv import load_dotenv
import os
import traceback
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.route("/")
def hello():
    print("Root route accessed!")
    logger.info("Root route accessed!")
    return jsonify({"message": "Server is running!"})


@app.route("/test", methods=["GET"])
def test():
    print("Test route accessed!")
    logger.info("Test route accessed!")
    return jsonify({"message": "Test endpoint working!"})


@app.route("/search", methods=["POST"])
def search():
    print("Search route accessed!")
    logger.info("Search route accessed!")
    try:
        data = request.json
        print(f"Received data: {data}")
        logger.info(f"Received data: {data}")

        query = data.get("query")
        if not query:
            return jsonify({"error": "No query provided", "results": []}), 400

        print(f"Initializing scraper for query: {query}")
        scraper = GoogleShoppingScraper()
        results = scraper.search(query=query, num_results=10)

        formatted_results = [
            {
                "title": item.title,
                "price": item.price,
                "seller": item.seller,
                "link": item.link,
                "image_url": item.image_url,
            }
            for item in results
        ]

        print(f"Found {len(formatted_results)} results")
        return jsonify({"results": formatted_results})

    except Exception as e:
        print(f"Error in search: {str(e)}")
        logger.error(f"Error in search: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e), "results": []}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("Starting Flask server...")
    print("Routes available:")
    print("  GET  http://127.0.0.1:5001/")
    print("  GET  http://127.0.0.1:5001/test")
    print("  POST http://127.0.0.1:5001/search")
    print("=" * 50)
    app.run(host="127.0.0.1", port=5001, debug=True)
