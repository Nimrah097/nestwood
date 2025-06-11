/* otp // server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
app.post('/buy', async (req, res) => {
  try {
    const {
      name, email, phone,
      purpose, propertyType, bhk, price, location, timeline
    } = req.body;

    const buyDetails = {
      purpose,
      propertyType,
      price,
      location,
      timeline
    };

    if (propertyType === 'Apartment' && bhk) {
      buyDetails.bhk = bhk;
    }

    const updated = await Contact.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        buyDetails
      },
      { new: true }
    );

    if (updated) {
      res.status(200).send({ message: 'Buy info submitted' });
    } else {
      res.status(404).send({ message: 'Contact not found' });
    }
  } catch (err) {
    console.error('Error saving buy info:', err);
    res.status(500).send({ message: 'Server error' });
  }
});

// GET /contact — Retrieve a contact
app.get('/contact', async (req, res) => {
  try {
    const { email } = req.query;
    const contact = await Contact.findOne({ email });
    if (contact) {
      const contactObj = contact.toObject();
      contactObj.uaeTime = contact.createdAt.toLocaleString('en-AE', {
        timeZone: 'Asia/Dubai',
        hour12: true
      });
      res.json(contactObj);
    } else {
      res.status(404).send('Contact not found');
    }
  } catch (err) {
    res.status(500).send('Error retrieving contact');
  }
});

// POST /send-otp — Send SMS using Textbelt
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const message = `Your Nestwood verification code is ${otp}`;

    const response = await axios.post('https://textbelt.com/text', {
      phone: phone,
      message: message,
      key: 'textbelt' // Free key: 1 message/day
    });

    if (response.data.success) {
      res.status(200).json({ success: true, otp }); // You can store this in memory or DB for verification
    } else {
      res.status(500).json({ success: false, error: response.data.error });
    }
  } catch (err) {
    console.error('Textbelt error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
*/

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
app.post('/buy', async (req, res) => {
  try {
    const {
      name, email, phone,
      purpose, propertyType, bhk, price, location, timeline
    } = req.body;

    const buyDetails = {
      purpose,
      propertyType,
      price,
      location,
      timeline
    };

    if (propertyType === 'Apartment' && bhk) {
      buyDetails.bhk = bhk;
    }

    const updated = await Contact.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        buyDetails
      },
      { new: true }
    );

    if (updated) {
      res.status(200).send({ message: 'Buy info submitted' });
    } else {
      res.status(404).send({ message: 'Contact not found' });
    }
  } catch (err) {
    console.error('Error saving buy info:', err);
    res.status(500).send({ message: 'Server error' });
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