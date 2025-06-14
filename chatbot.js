//chatbot.js

let email = ""; // 

function toggleChat() {
  const popup = document.getElementById('chatPopup');
  popup.classList.toggle('open');
}

function handleSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
 

  if (name && email && phone) {
    fetch('http://localhost:3000/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    })
    .then(() => {
      const query = `?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
      window.location.href = 'choice.html' + query;
    })
    .catch(err => console.error('Error submitting contact info:', err));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sellForm = document.getElementById('sellForm');
  if (sellForm) {
    sellForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const params = new URLSearchParams(window.location.search);
      const name = params.get('name');
      const email = params.get('email');
      const phone = params.get('phone');

      const ownerName = document.getElementById('ownerName').value;
      const propertyType = document.getElementById('propertyType').value;
      const location = document.getElementById('location').value;
      const initialPrice = document.getElementById('initialPrice').value;
      const sellingPrice = document.getElementById('sellingPrice').value;

      fetch('http://localhost:3000/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          ownerName,
          propertyType,
          location,
          initialPrice,
          sellingPrice
        })
      })
      .then(() => {
        document.getElementById('thankYouMessage').style.display = 'block';
        sellForm.reset();
      })
      .catch(err => console.error('Error submitting sell form:', err));
    });
  }

  // === BUY CHATBOT FLOW ===
  const chatBody = document.getElementById('chatBody');
  const optionsContainer = document.getElementById('optionsContainer');

  let currentStep = 0;
  const buyData = {};

  const steps = [
    {
      key: 'purpose',
      question: 'What is your purpose for buying?',
      options: ['Investment', 'Personal use']
    },
    {
      key: 'propertyType',
      question: 'What type of property are you looking for?',
      options: ['Apartment', 'Villa', 'Townhouse']
    },
    {
      key: 'bhk',
      question: 'What BHK option are you interested in?',
      options: ['Studio', '1 BHK', '2 BHK', '3 BHK', '4+ BHK'],
      condition: () => buyData.propertyType === 'Apartment'
    },
    {
      key: 'price',
      question: 'What is your preferred price range (in AED)?',
      options: ['Below 500K', '500K - 1M', '1M - 2M', 'Above 2M']
    },
     {
      key: 'location',
      question: 'What is your preferred location?',
      options: ['Marina', 'Downtown', 'Palm Jumeirah', 'JVC', 'JBR', 'Other']
     }, 
    {
      key: 'timeline',
      question: 'What is your buying timeline?',
      options: ['15 days', '1 month', '3 months']
    }
  ];

  window.startBuyFlow = function () {
  const chatPopup = document.getElementById("chatPopup");
  chatPopup.style.display = "flex"; // ensure it's visible
  chatPopup.classList.add("active"); // optional: for styling or animation

  if (!chatBody || !optionsContainer) return;

  currentStep = 0;
  buyData.name = getQueryParam('name');
  buyData.email = getQueryParam('email');
  buyData.phone = getQueryParam('phone');

  chatBody.innerHTML = `<div class="bubble bot">${steps[currentStep].question}</div>`;
  showOptions(steps[currentStep].options);
};



  function showOptions(options) {
    optionsContainer.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'option-button';
      button.textContent = option;
      button.onclick = () => handleUserResponse(option);
      optionsContainer.appendChild(button);
    });
  }

    function handleUserResponse(response) {
    const step = steps[currentStep];
    buyData[step.key] = response;

    const userBubble = document.createElement('div');
    userBubble.className = 'bubble user';
    userBubble.textContent = response;
    chatBody.appendChild(userBubble);

    do {
      currentStep++;
    } while (steps[currentStep] && steps[currentStep].condition && !steps[currentStep].condition());

    if (currentStep < steps.length) {
      const nextStep = steps[currentStep];
      const botBubble = document.createElement('div');
      botBubble.className = 'bubble bot';
      botBubble.textContent = nextStep.question;
      chatBody.appendChild(botBubble);
      showOptions(nextStep.options);
    } else {
      optionsContainer.innerHTML = '';
      submitBuyData();
    }

    chatBody.scrollTop = chatBody.scrollHeight;
  } 

  function submitBuyData() {
  const payload = {
    budget: buyData.price,
    location: buyData.location,
    property_type: buyData.propertyType,
  };

  console.log("Sending payload:", payload);

  fetch('http://127.0.0.1:5000/recommend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)  // 👈 keep using the same payload
})
.then(response => response.json())
.then(data => {
  const properties = data.properties || [];  // 👈 fix key name

  if (properties.length > 0) {
    properties.forEach(property => {
      const propertyBubble = document.createElement('div');
      propertyBubble.className = 'bubble bot';
      propertyBubble.textContent =
        `${property.name} in ${property.location} for ₹${property.price}\n${property.url}`;
      chatBody.appendChild(propertyBubble);
    });
  } else {
    const noMatchBubble = document.createElement('div');
    noMatchBubble.className = 'bubble bot';
    noMatchBubble.textContent = 'Sorry, no matching properties found.';
    chatBody.appendChild(noMatchBubble);
  }
})
.catch(err => {
  console.error('Error fetching recommendations:', err);
  const errorBubble = document.createElement('div');
  errorBubble.className = 'bubble bot';
  errorBubble.textContent = 'An error occurred while getting recommendations.';
  chatBody.appendChild(errorBubble);
});
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || '';
  }
});

function appendChild(role, message) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`; // role = "user" or "bot"
  bubble.textContent = message;
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function displayMatchedProperties() {
  const { propertyType, bhk, price } = userResponses;

  // Parse price string to min and max values
  const cleanedPrice = price.replace(/[^\d\-]/g, ""); // e.g. "1000000-1500000"
  const [minPrice, maxPrice] = cleanedPrice.split("-").map(p => parseInt(p.trim()));

  fetch(`/api/match-properties?type=${encodeURIComponent(propertyType)}&bhk=${encodeURIComponent(bhk)}&minPrice=${minPrice}&maxPrice=${maxPrice}`)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        addBotMessage("No matching properties were found based on your preferences.");
      } else {
        addBotMessage("Here are your property search results:");
        data.forEach((property, index) => {
          const details = property.buyDetails;
          const message = `
<b>Property ${index + 1}</b><br>
🏠 Type: ${details.propertyType}<br>
🛏 BHK: ${details.bhk}<br>
📍 Location: ${details.location}<br>
💰 Price: ${details.price}<br>
🕒 Timeline: ${details.timeline}<br><br>
------------------------------`;
          addBotMessage(message, true); // Pass true to allow HTML
        });
      }
    })
    .catch(err => {
      console.error("Error fetching properties:", err);
      addBotMessage("An error occurred while fetching property suggestions.");
    });
}

function addBotMessage(text, isHtml = false) {
  const chatBody = document.getElementById("chatBody");
  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.innerHTML = isHtml ? text : escapeHTML(text);
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
