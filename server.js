

// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schema and model
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  choice: String,

  sellDetails: {
    ownerName: String,
    propertyType: String,
    location: String,
    initialPrice: String,
    sellingPrice: String
  },
  buyDetails: {
    purpose: String,
    propertyType: String,
    bhk: String,
    location: String,
    price: String,
    timeline: String
  },

  // Auto-delete after 30 days
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days in seconds
  }
});

contactSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Contact = mongoose.model('Contact', contactSchema);

// POST /contact — Save initial contact (no duplicates)
app.post('/contact', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).send('Missing fields');
    }

    const existing = await Contact.findOne({ email });
    if (existing) {
      return res.status(200).send('Contact already exists');
    }

    await Contact.create({ name, email, phone });
    res.status(201).send('Contact saved');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving contact');
  }
});

// POST /choice — Save buy/sell choice
app.post('/choice', async (req, res) => {
  try {
    const { email, choice } = req.body;
    const updated = await Contact.findOneAndUpdate({ email }, { choice }, { new: true });
    if (updated) {
      res.send('Choice updated');
    } else {
      res.status(404).send('Contact not found');
    }
  } catch (err) {
    res.status(500).send('Error saving choice');
  }
});

// POST /sell — Save sell details
app.post('/sell', async (req, res) => {
  try {
    const {
      name, email, phone,
      ownerName, propertyType, location,
      initialPrice, sellingPrice
    } = req.body;

    const updated = await Contact.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        sellDetails: {
          ownerName,
          propertyType,
          location,
          initialPrice,
          sellingPrice
        }
      },
      { new: true }
    );

    if (updated) {
      res.status(200).send({ message: 'Sell info submitted' });
    } else {
      res.status(404).send({ message: 'Contact not found' });
    }
  } catch (err) {
    console.error('Error saving sell info:', err);
    res.status(500).send({ message: 'Server error' });
  }
});

// POST /buy — Save buy details
// Simulated question flow
const questionFlow = [
  {
    id: "purpose",
    question: "What is the purpose of buying?",
    options: ["Investment", "Personal use"],
    expectFreeText: false,
  },
  {
    id: "propertyType",
    question: "What type of property are you looking for?",
    options: ["Apartment", "Villa", "Townhouse"],
    expectFreeText: false,
  },
  {
    id: "bhk",
    question: "How many BHKs are you looking for?",
    options: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK"],
    expectFreeText: false,
    condition: (answers) => answers.propertyType === "Apartment",
  },
  {
    id: "price",
    question: "What is your price range?",
    options: [],
    expectFreeText: true,
  },
  {
    id: "location",
    question: "Preferred location?",
    options: [],
    expectFreeText: true,
  },
  {
    id: "timeline",
    question: "What is your buying timeline?",
    options: ["15 days", "1 month", "3 months"],
    expectFreeText: false,
  }
];

const userProgress = {}; // In-memory, replace with DB/session for real use
const Property = require('./models/property'); // ✅ ensure correct path

const axios = require("axios");

app.post("/buy", async (req, res) => {
  console.log("📩 /buy endpoint hit with:", req.body);
  try {
    const { questionId, response, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required to start." });
    }

    if (!userProgress[email]) {
      userProgress[email] = {};
    }

    const answers = userProgress[email];

    if (questionId) {
      answers[questionId] = response;
    }

    let nextQuestion = null;
    for (const q of questionFlow) {
      if (q.condition && !q.condition(answers)) continue;
      if (!(q.id in answers)) {
        nextQuestion = q;
        break;
      }
    }

    // All questions answered
    if (!nextQuestion || Object.keys(req.body).includes('propertyType')) {
      const buyDetails = {
        purpose: req.body.purpose,
        propertyType: req.body.propertyType,
        price: req.body.price,
        location: req.body.location,
        timeline: req.body.timeline,
        bhk: req.body.bhk || null
      };

      console.log("All preferences received. Proceeding to property match...");
      console.log("buyDetails to be saved:", buyDetails);

      await Contact.findOneAndUpdate(
        { email: req.body.email },
        { $set: { name: req.body.name, phone: req.body.phone, buyDetails } },
        { upsert: true, new: true }
      );

      // 🔎 Add this: payload to Flask
      const payload = {
        budget: req.body.price,
        location: req.body.location,
        property_type: req.body.propertyType,
      };

      console.log("➡️ Sending payload to Flask:", payload);

      try {
        const flaskRes = await fetch("http://127.0.0.1:5000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const flaskData = await flaskRes.json();
        console.log("⬅️ Received from Flask:", flaskData);

        return res.status(200).json({ properties: flaskData.recommendations || [] });
      } catch (flaskErr) {
        console.error("❌ Flask call failed:", flaskErr.message);
        return res.status(500).json({ message: "Error from Flask backend." });
      }
    }

    // Continue asking questions
    res.status(200).json({
      nextQuestion: nextQuestion.question,
      options: nextQuestion.options,
      expectFreeText: nextQuestion.expectFreeText,
    });

  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
});





// (Optional) GET /contact — Retrieve a contact
app.get('/contact', async (req, res) => {
  try {
    const { email } = req.query;
    const contact = await Contact.findOne({ email });
    if (contact) {
      res.json(contact);
    } else {
      res.status(404).send('Contact not found');
    }
  } catch (err) {
    res.status(500).send('Error retrieving contact');
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));