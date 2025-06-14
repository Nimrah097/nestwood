#prepare_data.py

import pymongo
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder
import joblib
import re

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["nestwooddb"]
collection = db["properties"]

# Load all properties
properties = list(collection.find({}))

# Convert to DataFrame
df = pd.DataFrame(properties)

# -------- Clean and transform -------- #

# 1. Clean price (e.g., "AED 700,000" → 700000)
def clean_price(price_str):
    if not isinstance(price_str, str):
        return 0
    match = re.search(r"(\d[\d,]*)", price_str.replace(',', ''))
    return int(match.group(1)) if match else 0

df["price_clean"] = df["price"].apply(clean_price)

# 2. Simplify location (e.g., "Dubai Marina, Dubai" → "Dubai Marina")
df["location_clean"] = df["location"].apply(lambda loc: loc.split(",")[0].strip() if isinstance(loc, str) else "")

# 3. Clean propertyType from HTML link
def extract_property_type(html):
    if not isinstance(html, str):
        return "Unknown"
    match = re.search(r'property-category/([^/]+)/', html)
    if match:
        return match.group(1).replace("-", " ").title()
    return "Unknown"

df["propertyType_clean"] = df["propertyType"].apply(extract_property_type)

# Fill missing floorPlan if needed
df["floorPlan"] = df["floorPlan"].fillna("Unknown")

# -------- Prepare feature matrix -------- #

# One-hot encode location, floorPlan, and propertyType
encoder = OneHotEncoder()
encoded = encoder.fit_transform(df[["location_clean", "floorPlan", "propertyType_clean"]]).toarray()

# Combine with price
X = np.hstack([df["price_clean"].values.reshape(-1, 1), encoded])

# Save for later use
joblib.dump(X, "property_vectors.pkl")
joblib.dump(df, "property_data.pkl")
joblib.dump(encoder, "encoder.pkl")

print("✅ Property data processed and saved.")
