export const generateMockMarketData = () => {
  // 20+ crops dataset
  const basePrices = {
    'Wheat': 2500,
    'Rice': 3200,
    'Cotton': 5500,
    'Sugarcane': 350,
    'Maize': 2100,
    'Tomato': 1500,
    'Onion': 1200,
    'Potato': 1100,
    'Groundnut': 6000,
    'Pulses': 7500,
    'Soybean': 4600,
    'Mustard': 5200,
    'Bajra': 1900,
    'Jowar': 2200,
    'Turmeric': 14000,
    'Garlic': 8000,
    'Ginger': 4500,
    'Chilli': 18000,
    'Coriander': 7200,
    'Cumin': 28000,
    'Cardamom': 150000
  };

  const predictNextDays = (pricesList, numDays) => {
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
      const volatility = (Math.random() - 0.5) * (pricesList[n-1] * 0.05);
      predictions.push(Math.round(m * (n + j) + b + volatility));
    }
    return predictions;
  };

  return Object.keys(basePrices).map(crop => {
    const pastData = [];
    let currentPrice = basePrices[crop] + (Math.random() - 0.5) * 500;
    
    for (let i = 0; i < 30; i++) {
      // Create some historical trend
      currentPrice += (Math.random() - 0.4) * (basePrices[crop] * 0.05);
      pastData.push(Math.round(currentPrice));
    }
    
    const next7Days = predictNextDays(pastData.slice(-15), 7);
    
    const current = pastData[29];
    const day3Price = next7Days[2];
    const day7Price = next7Days[6];

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
      day3Price,
      day7Price,
      pastData,
      predictions: next7Days,
      recommendation,
      insight,
      trend: predictedAvg > current ? 'up' : 'down'
    };
  });
};

export const getSmartRecommendation = (marketData, scanMode, result) => {
  if (!marketData || !marketData.length) return null;

  if (scanMode === 'soil' || (result && result.isSoil)) {
    // Find best 2 crops to plant based on upward trend
    const goodCrops = marketData
      .filter(c => c.trend === 'up')
      .sort((a,b) => ((b.predictions[6]-b.currentPrice)/b.currentPrice) - ((a.predictions[6]-a.currentPrice)/a.currentPrice))
      .slice(0, 2)
      .map(c => c.crop);
      
    const cropText = goodCrops.length > 0 ? goodCrops.join(' and ') : 'staple crops';
    return {
      title: '🌱 AI Smart Recommendation',
      text: `Based on your ${result?.soilType || 'soil'} and market trends, consider growing ${cropText} for maximum profitability as prices are expected to rise.`,
      icon: '💡'
    };
  } else if (scanMode === 'plant' && result && !result.isValidCrop) {
      return null;
  } else if (scanMode === 'plant' && result && result.disease !== 'Healthy') {
    return {
      title: '📈 Market Insight',
      text: `Crop health issue detected. You might face lower yields. Monitor market prices closely - consider storing unharmed produce to sell when prices peak.`,
      icon: '📊'
    };
  } else if (scanMode === 'plant' && result && result.disease === 'Healthy') {
    return {
      title: '📈 Market Insight',
      text: `Your crop is healthy! Check the Market tab to find the optimal selling window for maximum profit.`,
      icon: '💎'
    };
  }
  return null;
};
