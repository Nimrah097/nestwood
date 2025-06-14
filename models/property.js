const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: String,
  location: String,
  price: String,
  description: String,
  imageUrl: String,
  url: String,
  postedDate: String, // optional
  propertyType: String, // e.g., Apartment, Villa, etc.
  bedrooms: String,
  bathrooms: String,
  area: String
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
