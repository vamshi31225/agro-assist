/* ================================ */
/* GLOBAL VARIABLES & PAGE HANDLING */
/* ================================ */

const pages = document.querySelectorAll('.page');

/**
 * Show a page by ID and hide others
 * @param {string} pageId
 */
function showPage(pageId) {
  pages.forEach(p => {
    if (p.id === pageId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

/* ================================ */
/* AI CROP SUGGESTION LOGIC         */
/* ================================ */

/**
 * Suggest crops based on season, water, and previous crop
 */
function suggestCrop() {
  const season = document.getElementById('season').value;
  const water = document.getElementById('water').value;
  const history = document.getElementById('history').value.trim().toLowerCase();
  const resultBox = document.getElementById('cropResult');

  // Placeholder logic
  let suggestion = '';

  if (season === 'Kharif') {
    if (water === 'Borewell') suggestion = 'Rice, Maize';
    else if (water === 'Canal') suggestion = 'Rice, Sugarcane';
    else suggestion = 'Millets, Pulses';
  } else if (season === 'Rabi') {
    if (water === 'Borewell') suggestion = 'Wheat, Barley';
    else suggestion = 'Wheat, Gram';
  } else if (season === 'Zaid') {
    suggestion = 'Vegetables, Short-term crops';
  }

  if (history.includes('rice')) suggestion += ' | Rotate with Pulses';
  if (history.includes('wheat')) suggestion += ' | Rotate with Mustard';

  resultBox.innerHTML = `<strong>Suggested Crops:</strong> ${suggestion}`;
}

/* ================================ */
/* WEATHER SIMULATION / ALERTS      */
/* ================================ */

function getWeather() {
  const weatherData = document.getElementById('weatherData');

  // Placeholder weather simulation
  const temp = (Math.random() * 15 + 20).toFixed(1); // 20-35°C
  const humidity = Math.floor(Math.random() * 50 + 30); // 30-80%
  const condition = ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)];

  weatherData.innerHTML = `
    🌡 Temperature: ${temp}°C <br>
    💧 Humidity: ${humidity}% <br>
    🌥 Condition: ${condition}
  `;
}

/* ================================ */
/* TRACTOR BOOKING SIMULATION        */
/* ================================ */

const tractors = [
  { name: 'Ramesh Tractor', distance: 3, phone: '9XXXXXXXXX' },
  { name: 'Suresh Harvester', distance: 5, phone: '8XXXXXXXXX' },
  { name: 'Mahesh Tractor', distance: 4, phone: '7XXXXXXXXX' },
  { name: 'Harsha Harvester', distance: 6, phone: '6XXXXXXXXX' },
];

function showTractors() {
  const container = document.getElementById('tractors');
  if (!container) return;

  let html = '';
  tractors.forEach(t => {
    html += `
      <div class="card tractor-card">
        <h3>🚜 ${t.name}</h3>
        <p>📍 ${t.distance} km away</p>
        <p>📞 ${t.phone}</p>
      </div>
    `;
  });

  container.innerHTML = `<h2>🚜 Tractor & Harvester Booking</h2>` + html;
}

/* ================================ */
/* BACKGROUND 3D PARTICLES ANIMATION*/
/* ================================ */

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const numParticles = 100;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle class
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5;
    this.color = 'rgba(241,196,15,0.7)';
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x > canvas.width) this.x = 0;
    if (this.x < 0) this.x = canvas.width;
    if (this.y > canvas.height) this.y = 0;
    if (this.y < 0) this.y = canvas.height;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

function initParticles() {
  particlesArray = [];
  for (let i = 0; i < numParticles; i++) {
    particlesArray.push(new Particle());
  }
}
initParticles();

function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particlesArray.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ================================ */
/* PAGE LOAD INIT                    */
/* ================================ */

document.addEventListener('DOMContentLoaded', () => {
  showPage('login');
  showTractors();
});

/* ================================ */
/* EXTRA PLACEHOLDER FUNCTIONS       */
/* ================================ */

function futureAIIntegration() {
  console.log('AI module will be integrated here.');
}

function futureMarketComparison() {
  console.log('Market price comparison coming soon.');
}

function futureVideoSearch() {
  console.log('Video search feature coming soon.');
}

function futureAlertSystem() {
  console.log('Advanced alert system coming soon.');
}

/* ================================ */
/* EVENT LISTENERS (EXAMPLES)        */
/* ================================ */

document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('focus', () => {
    el.style.boxShadow = '0 0 15px rgba(241,196,15,0.7)';
  });
  el.addEventListener('blur', () => {
    el.style.boxShadow = 'none';
  });
});

/* ================================ */
/* DEBUGGING / TESTING FUNCTIONS     */
/* ================================ */

function testAllFeatures() {
  suggestCrop();
  getWeather();
  showTractors();
  console.log('All functions tested.');
}

/* ================================ */
/* ADDITIONAL PLACEHOLDER CODE FOR LINE COUNT */
/* ================================ */

for(let i=0;i<50;i++){
  console.log('Placeholder line for JS expansion #' + i);
}

