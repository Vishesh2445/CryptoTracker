import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_-6Qx0bh5IQrLB5afIlkTt1x6hV4IBg4",
  authDomain: "cryptotrack-9odvr.firebaseapp.com",
  databaseURL: "https://cryptotrack-9odvr-default-rtdb.firebaseio.com",
  projectId: "cryptotrack-9odvr",
  storageBucket: "cryptotrack-9odvr.firebasestorage.app",
  messagingSenderId: "397957075877",
  appId: "1:397957075877:web:90739eee3bd991972f0e4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const statusEl = document.getElementById("status");
const tableBody = document.getElementById("crypto-body");

// API Configuration
const API_URL = "https://api.coingecko.com/api/v3/coins/markets";
const params = new URLSearchParams({
  vs_currency: "usd",
  order: "market_cap_desc",
  per_page: "100",
  page: "1",
  sparkline: "false",
  price_change_percentage: "24h"
});

// Utility function to format large numbers
const formatNumber = (num) => {
  if (!num) return "N/A";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

async function fetchAndUpload() {
  try {
    statusEl.textContent = "Fetching latest crypto data...";
    const res = await fetch(`${API_URL}?${params}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const rawData = await res.json();
    
    // Process and optimize the data structure
    const processedData = rawData.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      current_price: coin.current_price,
      price_change_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      circulating_supply: coin.circulating_supply,
      image: coin.image
    }));

    // Upload to Firebase
    await set(ref(db, 'coins'), {
      lastUpdated: Date.now(),
      data: processedData
    });

    renderTable(processedData);
    const time = new Date().toLocaleTimeString();
    statusEl.textContent = `Last updated: ${time}`;
    statusEl.style.opacity = "0";
    setTimeout(() => {
      statusEl.style.transition = "opacity 0.3s ease";
      statusEl.style.opacity = "1";
    }, 50);
  } catch (e) {
    console.error('Error:', e);
    statusEl.textContent = `Error: ${e.message}`;
    statusEl.style.color = "#ef4444";
  }
}

function renderTable(coins) {
  tableBody.innerHTML = "";
  coins.forEach((coin) => {
    const row = document.createElement("tr");
    const priceChangeClass = coin.price_change_24h >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
      <td>${coin.market_cap_rank}</td>
      <td style="text-align: left">
        <div style="display: flex; align-items: center; gap: 8px">
          <img src="${coin.image}" alt="${coin.name}" style="width: 24px; height: 24px">
          <span>${coin.name}</span>
        </div>
      </td>
      <td>${coin.symbol.toUpperCase()}</td>
      <td>$${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="${priceChangeClass}">${coin.price_change_24h?.toFixed(2)}%</td>
      <td>$${formatNumber(coin.market_cap)}</td>
      <td>$${formatNumber(coin.total_volume)}</td>
      <td>${formatNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Initial load
fetchAndUpload();

// Refresh every 5 minutes (300000ms)
setInterval(fetchAndUpload, 300000);
