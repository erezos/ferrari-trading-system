import axios from 'axios';

class TechnicalAnalysisService {
  constructor() {
    this.taApiKey = process.env.TAAPI_API_KEY || 'demo';
    this.baseUrl = 'https://api.taapi.io';
    this.analysisCache = new Map(); // Cache recent analyses
  }

  async getTechnicalAnalysis(symbol, timeframe = '1h') {
    try {
      // For production, this would call real TAAPI.io or other TA service
      // For now, using enhanced realistic simulation
      return this.getEnhancedAnalysis(symbol, timeframe);
    } catch (error) {
      console.error(`Error in getTechnicalAnalysis for ${symbol}:`, error);
      return this.getEnhancedAnalysis(symbol, timeframe);
    }
  }

  async performComprehensiveAnalysis(symbol, timeframe = '1h') {
    try {
      return this.getEnhancedAnalysis(symbol, timeframe);
    } catch (error) {
      console.error(`Error in performComprehensiveAnalysis for ${symbol}:`, error);
      return this.getEnhancedAnalysis(symbol, timeframe);
    }
  }

  getEnhancedAnalysis(symbol, timeframe = '1h') {
    // Enhanced analysis that considers symbol characteristics and market patterns
    const symbolType = this.getSymbolType(symbol);
    const timeframeWeight = this.getTimeframeWeight(timeframe);
    
    // Generate more realistic strength based on symbol characteristics
    let baseStrength = 3.5; // Start with neutral
    
    // Crypto typically more volatile
    if (symbolType === 'crypto') {
      baseStrength += (Math.random() - 0.4) * 1.5; // More volatile range
    } else if (symbolType === 'megacap') {
      baseStrength += (Math.random() - 0.5) * 0.8; // Less volatile
    } else if (symbolType === 'meme') {
      baseStrength += (Math.random() - 0.3) * 2.0; // Very volatile
    } else {
      baseStrength += (Math.random() - 0.5) * 1.2; // Standard volatility
    }
    
    // Apply timeframe influence
    baseStrength *= timeframeWeight;
    
    // Ensure within valid range
    const finalStrength = Math.max(2.0, Math.min(5.0, baseStrength));
    
    // Determine sentiment based on strength and randomness
    const sentimentThreshold = 3.8;
    let sentiment;
    if (finalStrength > sentimentThreshold + 0.3) {
      sentiment = Math.random() > 0.2 ? 'bullish' : 'bearish'; // 80% bullish for high strength
    } else if (finalStrength < sentimentThreshold - 0.3) {
      sentiment = Math.random() > 0.2 ? 'bearish' : 'bullish'; // 80% bearish for low strength
    } else {
      sentiment = Math.random() > 0.5 ? 'bullish' : 'bearish'; // 50/50 for neutral
    }
    
    // Generate realistic RSI
    const rsi = this.generateRealisticRSI(sentiment, finalStrength);
    
    // Generate realistic MACD
    const macd = this.generateRealisticMACD(sentiment, finalStrength);
    
    return {
      symbol,
      timeframe,
      indicators: {
        rsi: { value: rsi },
        macd: macd
      },
      analysis: {
        sentiment: sentiment,
        strength: finalStrength,
        confidence: Math.min(95, finalStrength * 18),
        tradingAction: sentiment === 'bullish' ? 'buy' : 'sell',
        reasoning: [
          `Enhanced ${timeframe} analysis for ${symbol}`,
          `${sentiment.toUpperCase()} signal with ${finalStrength.toFixed(1)} strength`,
          `RSI: ${rsi.toFixed(1)} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'})`,
          `MACD: ${macd.valueMACD > macd.valueMACDSignal ? 'Bullish' : 'Bearish'} crossover`,
          `Symbol type: ${symbolType}, Timeframe weight: ${timeframeWeight.toFixed(2)}`
        ]
      },
      currentPrice: null, // Will be set by Ferrari from real price data
      timestamp: new Date().toISOString(),
      quality: 'enhanced_simulation'
    };
  }

  getSymbolType(symbol) {
    // Classify symbols for more realistic analysis
    const megaCaps = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
    const memeStocks = ['GME', 'AMC', 'BB', 'WISH', 'CLOV', 'SPCE'];
    const etfs = ['SPY', 'QQQ', 'IWM', 'VTI', 'ARKK', 'XLK', 'XLF', 'XLE'];
    
    if (symbol.includes('/')) return 'crypto';
    if (megaCaps.includes(symbol)) return 'megacap';
    if (memeStocks.includes(symbol)) return 'meme';
    if (etfs.includes(symbol)) return 'etf';
    return 'standard';
  }

  getTimeframeWeight(timeframe) {
    // Different timeframes have different signal reliability
    const weights = {
      '1min': 0.8,   // Less reliable, more noise
      '5min': 0.9,   // Better but still short-term
      '15min': 1.0,  // Balanced
      '1hour': 1.1,  // More reliable
      '1h': 1.1      // Same as 1hour
    };
    return weights[timeframe] || 1.0;
  }

  generateRealisticRSI(sentiment, strength) {
    // Generate RSI that aligns with sentiment and strength
    let baseRSI = 50; // Neutral starting point
    
    if (sentiment === 'bullish') {
      // Bullish signals tend to have higher RSI
      baseRSI = 55 + (strength - 3.5) * 8; // 55-71 range for bullish
    } else {
      // Bearish signals tend to have lower RSI
      baseRSI = 45 - (strength - 3.5) * 8; // 29-45 range for bearish
    }
    
    // Add some randomness but keep it realistic
    baseRSI += (Math.random() - 0.5) * 10;
    
    return Math.max(15, Math.min(85, baseRSI));
  }

  generateRealisticMACD(sentiment, strength) {
    // Generate MACD that aligns with sentiment
    const magnitude = (strength - 3.5) * 0.5; // Scale based on strength
    
    let macdLine, signalLine;
    
    if (sentiment === 'bullish') {
      macdLine = magnitude + Math.random() * 0.3;
      signalLine = macdLine - (0.1 + Math.random() * 0.2); // Signal below MACD for bullish
    } else {
      macdLine = -magnitude - Math.random() * 0.3;
      signalLine = macdLine + (0.1 + Math.random() * 0.2); // Signal above MACD for bearish
    }
    
    const histogram = macdLine - signalLine;
    
    return {
      valueMACD: parseFloat(macdLine.toFixed(4)),
      valueMACDSignal: parseFloat(signalLine.toFixed(4)),
      valueMACDHist: parseFloat(histogram.toFixed(4))
    };
  }

  calculateRiskReward(currentPrice, direction) {
    if (direction === 'BUY') {
      const takeProfit = currentPrice * 1.025; // 2.5% profit target
      const stopLoss = currentPrice * 0.99;    // 1% stop loss
      const riskReward = (takeProfit - currentPrice) / (currentPrice - stopLoss);
      return {
        takeProfit,
        stopLoss,
        riskReward: Math.round(riskReward * 100) / 100
      };
    } else if (direction === 'SELL') {
      const takeProfit = currentPrice * 0.975; // 2.5% profit target
      const stopLoss = currentPrice * 1.01;    // 1% stop loss
      const riskReward = (currentPrice - takeProfit) / (stopLoss - currentPrice);
      return {
        takeProfit,
        stopLoss,
        riskReward: Math.round(riskReward * 100) / 100
      };
    }
    return { takeProfit: 0, stopLoss: 0, riskReward: 0 };
  }
}

export default new TechnicalAnalysisService();
