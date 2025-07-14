import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_-6Qx0bh5IQrLB5afIlkTt1x6hV4IBg4",
  authDomain: "cryptotrack-9odvr.firebaseapp.com",
  databaseURL: "https://cryptotrack-9odvr-default-rtdb.firebaseio.com",
  projectId: "cryptotrack-9odvr",
  storageBucket: "cryptotrack-9odvr.firebasestorage.app",
  messagingSenderId: "397957075877",
  appId: "1:397957075877:web:90739eee3bd991972f0e4c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d,1y";
const statusEl = document.getElementById("status");
const tableBody = document.getElementById("crypto-body");

async function fetchAndUpload() {
  try {
    statusEl.textContent = "Fetching latest crypto data...";
    const res = await fetch(API_URL);
    const data = await res.json();

    await set(ref(db, 'cryptoData'), {
      updatedAt: Date.now(),
      coins: data
    });

    renderTable(data);
    const time = new Date().toLocaleTimeString();
    statusEl.textContent = `Last updated: ${time}`;
    statusEl.style.opacity = "0";
    setTimeout(() => {
      statusEl.style.transition = "opacity 0.3s ease";
      statusEl.style.opacity = "1";
    }, 50);
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Failed to fetch data";
    statusEl.style.color = "#ef4444";
  }
}

function renderTable(coins) {
  tableBody.innerHTML = "";
  coins.forEach((coin, index) => {
    const row = document.createElement("tr");

    const changeClass = val => val >= 0 ? 'positive' : 'negative';
    const percent = field => {
      const val = coin[field];
      if (val === null || val === undefined) return "N/A";
      return val.toFixed(2) + "%";
    };

    const sparklineId = `spark-${coin.id}`;
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="text-align: left">
        <div style="display: flex; align-items: center; gap: 8px">
          <img src="${coin.image}" alt="${coin.name}" style="width: 24px; height: 24px">
          <span>${coin.name}</span>
        </div>
      </td>
      <td>${coin.symbol.toUpperCase()}</td>
      <td>$${coin.current_price.toLocaleString()}</td>
      <td class="${changeClass(coin.price_change_percentage_1h_in_currency)}">${percent('price_change_percentage_1h_in_currency')}</td>
      <td class="${changeClass(coin.price_change_percentage_24h)}">${percent('price_change_percentage_24h')}</td>
      <td class="${changeClass(coin.price_change_percentage_7d_in_currency)}">${percent('price_change_percentage_7d_in_currency')}</td>
      <td class="${changeClass(coin.price_change_percentage_30d_in_currency)}">${percent('price_change_percentage_30d_in_currency')}</td>
      <td class="${changeClass(coin.price_change_percentage_1y_in_currency)}">${percent('price_change_percentage_1y_in_currency')}</td>
      <td><canvas id="${sparklineId}"></canvas></td>
    `;

    tableBody.appendChild(row);

    const ctx = document.getElementById(sparklineId).getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: coin.sparkline_in_7d.price.map((_, i) => i),
        datasets: [{
          data: coin.sparkline_in_7d.price,
          borderColor: coin.price_change_percentage_7d_in_currency >= 0 ? '#10b981' : '#ef4444',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  });
}

// Initial load
fetchAndUpload();

// Refresh every 90 seconds
setInterval(fetchAndUpload, 90000);
