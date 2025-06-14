#property_ai.oy

from pymongo import MongoClient
import pandas as pd
import re
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.neighbors import NearestNeighbors

# 1. Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["nestwoodDB"]
collection = db["properties"]

# 2. Load documents
required_fields = ["name", "location", "floorPlan", "price", "description", "url", "propertyType"]
documents = []

for doc in collection.find({}):
    for field in required_fields:
        if field not in doc:
            doc[field] = None
    documents.append(doc)

df = pd.DataFrame(documents)

# 3. Drop rows missing critical fields
df.dropna(subset=["name", "location", "price"], inplace=True)
df.reset_index(drop=True, inplace=True)

# 4. Extract numeric price
def extract_price(price_str):
    if not price_str or not isinstance(price_str, str):
        return None
    price_str = price_str.replace(",", "")
    match = re.search(r"\d+", price_str)
    return int(match.group()) if match else None

df["price_num"] = df["price"].apply(extract_price)

# Drop rows with invalid price_num
df.dropna(subset=["price_num"], inplace=True)
df.reset_index(drop=True, inplace=True)

# 5. Make sure propertyType column is preserved or filled if missing
if "propertyType" not in df.columns:
    df["propertyType"] = "Unknown"
df["propertyType"].fillna("Unknown", inplace=True)

# 6. Select and prepare features
features = df[["location", "propertyType", "price_num"]].copy()

# 7. One-hot encode location and propertyType
encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
encoded_cat = encoder.fit_transform(features[["location", "propertyType"]])


# 8. Scale price
scaler = StandardScaler()
price_scaled = scaler.fit_transform(features[["price_num"]])

# 9. Combine all features
X = np.hstack([encoded_cat, price_scaled])

print(f"Final feature matrix shape: {X.shape}")

# 10. Train KNN model
knn_model = NearestNeighbors(n_neighbors=5, metric="euclidean")
knn_model.fit(X)

print("KNN model trained successfully.")

# 11. Recommendation function using correct encoding
def recommend_properties(budget, property_type, location, top_n=5):
    # Convert budget range string to numeric value
    if isinstance(budget, str):
        budget = budget.lower().replace("aed", "").replace(" ", "")
        if "-" in budget:
            parts = budget.split("-")
        else:
            parts = [budget]

        nums = []
        for part in parts:
            if "m" in part:
                nums.append(float(part.replace("m", "")) * 1_000_000)
            elif "k" in part:
                nums.append(float(part.replace("k", "")) * 1_000)
            else:
                try:
                    nums.append(float(part.replace(",", "")))
                except ValueError:
                    pass

        if not nums:
            budget = 0
        else:
            budget = sum(nums) / len(nums)  # Use the average of the range

    # Prepare DataFrame for encoding
    input_df = pd.DataFrame([[location, property_type]], columns=["location", "propertyType"])

    # One-hot encode input
    encoded_input_cat = encoder.transform(input_df)

    # Scale the budget
    scaled_budget = scaler.transform([[budget]])

    # Combine into final input vector
    input_vector = np.hstack([encoded_input_cat, scaled_budget])

    # Find nearest neighbors
    distances, indices = knn_model.kneighbors(input_vector, n_neighbors=top_n)

    # Return recommended properties
    recommendations = df.iloc[indices[0]]
    return recommendations[["name", "location", "price", "url"]]


# 12. Sample test
results = recommend_properties(
    budget="1M - 2M",
    property_type="Villa",   
    location="downtown"
)

'''print("Received data:", budget, property_type, location)

print("🔍 Recommended Properties:")
print(results)
'''