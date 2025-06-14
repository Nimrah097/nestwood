from flask import Flask, request, jsonify
from flask_cors import CORS
from property_ai import recommend_properties  # Make sure this is working and returns a DataFrame

app = Flask(__name__)
CORS(app)

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()
        print("✅ Received data:", data)

        # Extract and validate input
        budget = data.get("budget")
        property_type = data.get("property_type")
        location = data.get("location")

        if not budget or not property_type or not location:
            return jsonify({"error": "Missing required fields"}), 400

        # Get recommendations
        results_df = recommend_properties(budget, property_type, location)

        # Format response as structured property objects
        formatted = [
            {
                "name": row.get("name", "N/A"),
                "location": row.get("location", "N/A"),
                "price": row.get("price", "N/A"),
                "currency": row.get("currency", "AED"),  # Defaulting to AED if not in data
                "type": row.get("type", property_type),
                "url": row.get("url", "")
            }
            for _, row in results_df.iterrows()
        ]

        return jsonify({"properties": formatted})

    except Exception as e:
        print("❌ Internal Server Error:", str(e))
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
