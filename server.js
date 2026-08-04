const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Historical Data
const basePrices = {
  'Wheat': 2500,
  'Rice': 3200,
  'Cotton': 5500,
  'Sugarcane': 350
};

// Simple Linear Regression for future predictions
function predictNextDays(pricesList, numDays) {
  const n = pricesList.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += pricesList[i];
    sumXY += i * pricesList[i];
    sumXX += i * i;
  }
  
  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return Array(numDays).fill(pricesList[n-1]);
  
  const m = (n * sumXY - sumX * sumY) / denominator;
  const b = (sumY - m * sumX) / n;
  
  const predictions = [];
  for (let j = 0; j < numDays; j++) {
    // Add a bit of natural volatility to the regression line
    const volatility = (Math.random() - 0.5) * (pricesList[n-1] * 0.05);
    predictions.push(Math.round(m * (n + j) + b + volatility));
  }
  return predictions;
}

app.get('/api/market-prices', (req, res) => {
  const data = Object.keys(basePrices).map(crop => {
    // Generate 30 days of past data
    const pastData = [];
    let currentPrice = basePrices[crop] + (Math.random() - 0.5) * 500;
    
    for (let i = 0; i < 30; i++) {
      currentPrice += (Math.random() - 0.4) * 50; // Slight upward bias
      pastData.push(Math.round(currentPrice));
    }
    
    // Predict next 7 days
    const next7Days = predictNextDays(pastData.slice(-15), 7);
    
    // Suggest action
    const current = pastData[29];
    const predictedAvg = next7Days.reduce((a,b)=>a+b,0) / 7;
    let recommendation = 'Hold';
    let insight = `Prices are stable. Wait for a better opportunity.`;
    
    if (predictedAvg > current * 1.05) {
      recommendation = 'Hold & Wait';
      insight = `Price expected to rise significantly (${Math.round((predictedAvg-current)/current * 100)}%). Hold for now.`;
    } else if (predictedAvg < current * 0.95) {
      recommendation = 'Sell Now';
      insight = `Price expected to drop due to market patterns. Best time to sell.`;
    }

    return {
      crop,
      currentPrice: current,
      pastData,
      predictions: next7Days,
      recommendation,
      insight,
      trend: predictedAvg > current ? 'up' : 'down'
    };
  });
  
  res.json({ success: true, prices: data });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend scalable API running on port ${PORT}`);
});
