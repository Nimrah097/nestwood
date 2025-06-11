/*
// chatbot.js
import { auth } from './firebase.js';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

let confirmationResult;

function toggleChat() {
  const popup = document.getElementById('chatPopup');
  popup.classList.toggle('open');
}

function handleSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phoneInput = window.intlTelInputGlobals.getInstance(document.getElementById('phone'));
  const phone = phoneInput.getNumber();

  if (name && email && phoneInput.isValidNumber()) {
    // Save contact
    fetch('http://localhost:3000/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    })
    .then(() => {
      sendOTP(phone, name, email);
    })
    .catch(err => console.error('Error saving contact:', err));
  } else {
    alert("Please fill out all fields with a valid phone number.");
  }
}

// Setup reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
  size: 'invisible',
  callback: (response) => {
    console.log('reCAPTCHA verified');
  }
}, auth);

function sendOTP(phone, name, email) {
  const appVerifier = window.recaptchaVerifier;
  signInWithPhoneNumber(auth, phone, appVerifier)
    .then(result => {
      confirmationResult = result;
      alert("OTP sent to your phone.");
      showOTPVerificationUI(name, email, phone);
    })
    .catch(error => {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Use correct international format (e.g. +971...).");
    });
}

function showOTPVerificationUI(name, email, phone) {
  let otpContainer = document.getElementById('otpSection');
  if (!otpContainer) {
    otpContainer = document.createElement('div');
    otpContainer.id = 'otpSection';
    otpContainer.innerHTML = `
      <input type="text" id="otpCode" placeholder="Enter OTP" />
      <button id="verifyBtn">Verify OTP</button>
    `;
    document.getElementById('formContainer').appendChild(otpContainer);
  }

  document.getElementById('verifyBtn').onclick = () => {
    const code = document.getElementById('otpCode').value.trim();
    confirmationResult.confirm(code)
      .then(() => {
        const query = `?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
        window.location.href = 'choice.html' + query;
      })
      .catch(err => {
        console.error('Invalid OTP:', err);
        alert("Invalid OTP. Please try again.");
      });
  };
}

window.toggleChat = toggleChat;
window.handleSubmit = handleSubmit;
*/

//chatbot.js

//chatbot.js

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
      options: ['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK'],
      condition: () => buyData.propertyType === 'Apartment'
    },
    {
      key: 'price',
      question: 'What is your preferred price range?',
      options: ['Below 500k', '500k - 1M', '1M - 2M', 'Above 2M']
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
    fetch('http://localhost:3000/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyData)
    })
    .then(() => {
      const thankYou = document.createElement('div');
      thankYou.className = 'bubble bot';
      thankYou.textContent = "Thank you! Your buying preferences have been recorded. We'll get in touch with you soon.";
      chatBody.appendChild(thankYou);
    })
    .catch(err => {
      console.error('Error submitting buy data:', err);
      const errorBubble = document.createElement('div');
      errorBubble.className = 'bubble bot';
      errorBubble.textContent = "Oops! Something went wrong. Please try again later.";
      chatBody.appendChild(errorBubble);
    });
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || '';
  }
});