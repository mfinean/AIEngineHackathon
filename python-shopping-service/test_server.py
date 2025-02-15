from flask import Flask, request, jsonify
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/")
def hello():
    print("Root route accessed!")
    logger.info("Root route accessed!")
    return "Hello, World!"


@app.route("/test", methods=["GET"])
def test():
    print("Test route accessed!")
    logger.info("Test route accessed!")
    return jsonify({"message": "Test endpoint working!"})


@app.route("/search", methods=["POST"])
def search():
    print("Search route accessed!")
    logger.info("Search route accessed!")
    data = request.json
    print(f"Received data: {data}")
    return jsonify({"message": "Search endpoint working!", "received": data})


if __name__ == "__main__":
    print("=" * 50)
    print("Starting test server...")
    print("Routes available:")
    print("  GET  http://127.0.0.1:5001/")
    print("  GET  http://127.0.0.1:5001/test")
    print("  POST http://127.0.0.1:5001/search")
    print("=" * 50)
    app.run(host="127.0.0.1", port=5001, debug=True)
