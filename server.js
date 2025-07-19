const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

const app = express();
const PORT = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cryptotrack-9odvr-default-rtdb.firebaseio.com"
});
const db = admin.database();

async function fetchCryptoData() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h");
    const data = await res.json();

    const processedData = data.map(coin => ({
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

    await db.ref("coins").set({
      lastUpdated: Date.now(),
      data: processedData
    });

    console.log("✅ Firebase updated:", new Date().toLocaleTimeString());
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

fetchCryptoData();
setInterval(fetchCryptoData, 90000);

app.get("/", (req, res) => res.send("Crypto updater is running..."));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
