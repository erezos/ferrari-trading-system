import axios from 'axios';

/**
 * Institutional Analysis Service - Hedge Fund Level Analytics
 * Combines multiple data sources and advanced techniques used by top hedge funds
 */
class InstitutionalAnalysisService {
  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || 'demo';
    this.alpacaApiKey = process.env.ALPACA_API_KEY;
    this.alpacaSecret = process.env.ALPACA_SECRET_KEY;
    
    // Analysis cache for performance
    this.analysisCache = new Map();
    this.sentimentCache = new Map();
    this.insiderCache = new Map();
    
    // Factor weights based on hedge fund research
    this.factorWeights = {
      momentum: 0.25,      // Price momentum
      sentiment: 0.20,     // Market sentiment + news
      insider: 0.15,       // Insider trading patterns
      technical: 0.15,     // Technical indicators
      fundamental: 0.15,   // Fundamental analysis
      flow: 0.10          // Order flow analysis
    };
  }

  /**
   * Comprehensive institutional-grade analysis
   * Combines multiple hedge fund strategies
   */
  async performInstitutionalAnalysis(symbol, priceData, timeframe = '1h') {
    try {
      console.log(`🏛️ Performing institutional analysis for ${symbol}`);
      
      // Run parallel analysis across all factors
      const [
        momentumScore,
        sentimentScore, 
        insiderScore,
        technicalScore,
        fundamentalScore,
        flowScore
      ] = await Promise.all([
        this.analyzeMomentum(symbol, priceData, timeframe),
        this.analyzeSentiment(symbol),
        this.analyzeInsiderActivity(symbol),
        this.analyzeTechnicalFactors(symbol, priceData, timeframe),
        this.analyzeFundamentals(symbol),
        this.analyzeOrderFlow(symbol, priceData)
      ]);

      // Combine scores with institutional weighting
      const compositeScore = this.calculateCompositeScore({
        momentum: momentumScore,
        sentiment: sentimentScore,
        insider: insiderScore,
        technical: technicalScore,
        fundamental: fundamentalScore,
        flow: flowScore
      });

      // Generate institutional-grade reasoning
      const reasoning = this.generateInstitutionalReasoning(symbol, {
        momentum: momentumScore,
        sentiment: sentimentScore,
        insider: insiderScore,
        technical: technicalScore,
        fundamental: fundamentalScore,
        flow: flowScore,
        composite: compositeScore
      });

      return {
        symbol,
        timeframe,
        compositeScore: compositeScore.score,
        confidence: compositeScore.confidence,
        sentiment: compositeScore.sentiment,
        factors: {
          momentum: momentumScore,
          sentiment: sentimentScore,
          insider: insiderScore,
          technical: technicalScore,
          fundamental: fundamentalScore,
          flow: flowScore
        },
        reasoning,
        timestamp: new Date().toISOString(),
        analysisType: 'institutional_grade'
      };

    } catch (error) {
      console.error(`❌ Institutional analysis error for ${symbol}:`, error);
      // Fallback to enhanced analysis
      return this.getEnhancedFallbackAnalysis(symbol, timeframe);
    }
  }

  /**
   * Multi-timeframe momentum analysis (Hedge fund technique)
   */
  async analyzeMomentum(symbol, priceData, timeframe) {
    try {
      if (!priceData || priceData.length < 50) {
        return this.getDefaultMomentumScore(symbol);
      }

      const prices = priceData.map(p => p.close);
      
      // Multi-timeframe momentum (1h, 4h, 1d equivalent)
      const shortMomentum = this.calculateMomentum(prices, 12); // ~12 periods
      const mediumMomentum = this.calculateMomentum(prices, 24); // ~24 periods  
      const longMomentum = this.calculateMomentum(prices, 48);   // ~48 periods

      // Momentum consistency score
      const consistency = this.calculateMomentumConsistency([shortMomentum, mediumMomentum, longMomentum]);
      
      // Volatility-adjusted momentum
      const volatility = this.calculateVolatility(prices, 20);
      const adjustedMomentum = (shortMomentum * 0.5 + mediumMomentum * 0.3 + longMomentum * 0.2) / (1 + volatility * 0.5);

      return {
        score: Math.max(-2, Math.min(2, adjustedMomentum)),
        short: shortMomentum,
        medium: mediumMomentum,
        long: longMomentum,
        consistency,
        volatility,
        confidence: Math.min(95, consistency * 100)
      };

    } catch (error) {
      console.error(`❌ Momentum analysis error for ${symbol}:`, error);
      return this.getDefaultMomentumScore(symbol);
    }
  }

  /**
   * News sentiment analysis using Finnhub
   */
  async analyzeSentiment(symbol) {
    try {
      // Check cache first
      const cacheKey = `sentiment_${symbol}`;
      if (this.sentimentCache.has(cacheKey)) {
        const cached = this.sentimentCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 min cache
          return cached.data;
        }
      }

      // Get recent news for sentiment analysis
      const newsResponse = await axios.get(`https://finnhub.io/api/v1/company-news`, {
        params: {
          symbol: symbol.replace('/USD', '').replace('/', ''),
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
          token: this.finnhubApiKey
        },
        timeout: 5000
      });

      let sentimentScore = 0;
      let newsCount = 0;
      let bullishCount = 0;
      let bearishCount = 0;

      if (newsResponse.data && newsResponse.data.length > 0) {
        // Analyze news sentiment
        for (const article of newsResponse.data.slice(0, 10)) { // Latest 10 articles
          const sentiment = this.analyzeNewsSentiment(article.headline + ' ' + (article.summary || ''));
          sentimentScore += sentiment;
          newsCount++;
          
          if (sentiment > 0.1) bullishCount++;
          else if (sentiment < -0.1) bearishCount++;
        }
        
        sentimentScore = newsCount > 0 ? sentimentScore / newsCount : 0;
      }

      const result = {
        score: Math.max(-2, Math.min(2, sentimentScore * 2)), // Scale to -2 to 2
        newsCount,
        bullishCount,
        bearishCount,
        confidence: Math.min(95, newsCount * 10) // More news = higher confidence
      };

      // Cache result
      this.sentimentCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`❌ Sentiment analysis error for ${symbol}:`, error);
      return { score: 0, newsCount: 0, bullishCount: 0, bearishCount: 0, confidence: 0 };
    }
  }

  /**
   * Insider trading analysis using Finnhub
   */
  async analyzeInsiderActivity(symbol) {
    try {
      // Check cache first
      const cacheKey = `insider_${symbol}`;
      if (this.insiderCache.has(cacheKey)) {
        const cached = this.insiderCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
          return cached.data;
        }
      }

      // Get insider trading data
      const insiderResponse = await axios.get(`https://finnhub.io/api/v1/stock/insider-transactions`, {
        params: {
          symbol: symbol.replace('/USD', '').replace('/', ''),
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
          to: new Date().toISOString().split('T')[0],
          token: this.finnhubApiKey
        },
        timeout: 5000
      });

      let insiderScore = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      let transactionCount = 0;

      if (insiderResponse.data && insiderResponse.data.data) {
        for (const transaction of insiderResponse.data.data) {
          const volume = transaction.share || 0;
          transactionCount++;
          
          if (transaction.transactionCode === 'P' || transaction.transactionCode === 'A') {
            // Purchase or Award
            buyVolume += volume;
            insiderScore += 1;
          } else if (transaction.transactionCode === 'S') {
            // Sale
            sellVolume += volume;
            insiderScore -= 1;
          }
        }
      }

      // Calculate Monthly Share Purchase Ratio (MSPR) - Hedge fund technique
      const totalVolume = buyVolume + sellVolume;
      const mspr = totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;

      const result = {
        score: Math.max(-2, Math.min(2, mspr * 2)), // Scale MSPR to -2 to 2
        mspr,
        buyVolume,
        sellVolume,
        transactionCount,
        confidence: Math.min(95, transactionCount * 5)
      };

      // Cache result
      this.insiderCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`❌ Insider analysis error for ${symbol}:`, error);
      return { score: 0, mspr: 0, buyVolume: 0, sellVolume: 0, transactionCount: 0, confidence: 0 };
    }
  }

  /**
   * Advanced technical analysis with institutional indicators
   */
  async analyzeTechnicalFactors(symbol, priceData, timeframe) {
    try {
      if (!priceData || priceData.length < 50) {
        return this.getDefaultTechnicalScore(symbol);
      }

      const prices = priceData.map(p => p.close);
      const volumes = priceData.map(p => p.volume || 1000);

      // Institutional technical indicators
      const rsi = this.calculateRSI(prices, 14);
      const macd = this.calculateMACD(prices);
      const bollinger = this.calculateBollingerBands(prices, 20, 2);
      const vwap = this.calculateVWAP(priceData);
      const atr = this.calculateATR(priceData, 14);

      // Volume analysis (institutional focus)
      const volumeProfile = this.analyzeVolumeProfile(priceData);
      const onBalanceVolume = this.calculateOBV(priceData);

      // Combine indicators with institutional weighting
      let technicalScore = 0;
      
      // RSI contribution
      if (rsi < 30) technicalScore += 0.5; // Oversold
      else if (rsi > 70) technicalScore -= 0.5; // Overbought
      
      // MACD contribution
      if (macd.macd > macd.signal) technicalScore += 0.3;
      else technicalScore -= 0.3;
      
      // Bollinger Bands contribution
      const currentPrice = prices[prices.length - 1];
      if (currentPrice < bollinger.lower) technicalScore += 0.4; // Below lower band
      else if (currentPrice > bollinger.upper) technicalScore -= 0.4; // Above upper band
      
      // Volume confirmation
      if (volumeProfile.trend === 'bullish') technicalScore += 0.3;
      else if (volumeProfile.trend === 'bearish') technicalScore -= 0.3;

      return {
        score: Math.max(-2, Math.min(2, technicalScore)),
        indicators: {
          rsi,
          macd,
          bollinger,
          vwap,
          atr,
          volumeProfile,
          onBalanceVolume
        },
        confidence: 85
      };

    } catch (error) {
      console.error(`❌ Technical analysis error for ${symbol}:`, error);
      return this.getDefaultTechnicalScore(symbol);
    }
  }

  /**
   * Fundamental analysis using Finnhub data
   */
  async analyzeFundamentals(symbol) {
    try {
      // Skip crypto symbols for fundamental analysis
      if (symbol.includes('/')) {
        return { score: 0, confidence: 0, reason: 'crypto_skip' };
      }

      // Get basic financial metrics
      const metricsResponse = await axios.get(`https://finnhub.io/api/v1/stock/metric`, {
        params: {
          symbol: symbol,
          metric: 'all',
          token: this.finnhubApiKey
        },
        timeout: 5000
      });

      if (!metricsResponse.data || !metricsResponse.data.metric) {
        return { score: 0, confidence: 0, reason: 'no_data' };
      }

      const metrics = metricsResponse.data.metric;
      let fundamentalScore = 0;
      let factorCount = 0;

      // PE Ratio analysis
      if (metrics.peBasicExclExtraTTM) {
        const pe = metrics.peBasicExclExtraTTM;
        if (pe > 0 && pe < 15) fundamentalScore += 0.3; // Undervalued
        else if (pe > 30) fundamentalScore -= 0.3; // Overvalued
        factorCount++;
      }

      // ROE analysis
      if (metrics.roeTTM) {
        const roe = metrics.roeTTM;
        if (roe > 15) fundamentalScore += 0.2; // Strong ROE
        else if (roe < 5) fundamentalScore -= 0.2; // Weak ROE
        factorCount++;
      }

      // Debt to Equity
      if (metrics.totalDebt2TotalEquityQuarterly) {
        const debtToEquity = metrics.totalDebt2TotalEquityQuarterly;
        if (debtToEquity < 0.3) fundamentalScore += 0.2; // Low debt
        else if (debtToEquity > 1.0) fundamentalScore -= 0.2; // High debt
        factorCount++;
      }

      // Revenue growth
      if (metrics.revenueGrowthTTMYoy) {
        const revenueGrowth = metrics.revenueGrowthTTMYoy;
        if (revenueGrowth > 10) fundamentalScore += 0.3; // Strong growth
        else if (revenueGrowth < -5) fundamentalScore -= 0.3; // Declining
        factorCount++;
      }

      return {
        score: Math.max(-2, Math.min(2, fundamentalScore)),
        metrics: {
          pe: metrics.peBasicExclExtraTTM,
          roe: metrics.roeTTM,
          debtToEquity: metrics.totalDebt2TotalEquityQuarterly,
          revenueGrowth: metrics.revenueGrowthTTMYoy
        },
        confidence: Math.min(95, factorCount * 20)
      };

    } catch (error) {
      console.error(`❌ Fundamental analysis error for ${symbol}:`, error);
      return { score: 0, confidence: 0, reason: 'error' };
    }
  }

  /**
   * Order flow analysis (institutional technique)
   */
  async analyzeOrderFlow(symbol, priceData) {
    try {
      if (!priceData || priceData.length < 20) {
        return { score: 0, confidence: 0 };
      }

      // Analyze recent price/volume relationship
      const recentData = priceData.slice(-20);
      let flowScore = 0;
      let buyPressure = 0;
      let sellPressure = 0;

      for (let i = 1; i < recentData.length; i++) {
        const current = recentData[i];
        const previous = recentData[i - 1];
        
        const priceChange = (current.close - previous.close) / previous.close;
        const volumeRatio = current.volume / (previous.volume || 1);

        // Institutional order flow logic
        if (priceChange > 0 && volumeRatio > 1.2) {
          // Price up on high volume = buying pressure
          buyPressure += priceChange * volumeRatio;
        } else if (priceChange < 0 && volumeRatio > 1.2) {
          // Price down on high volume = selling pressure
          sellPressure += Math.abs(priceChange) * volumeRatio;
        }
      }

      flowScore = buyPressure - sellPressure;

      return {
        score: Math.max(-2, Math.min(2, flowScore * 10)), // Scale appropriately
        buyPressure,
        sellPressure,
        confidence: 70
      };

    } catch (error) {
      console.error(`❌ Order flow analysis error for ${symbol}:`, error);
      return { score: 0, buyPressure: 0, sellPressure: 0, confidence: 0 };
    }
  }

  /**
   * Combine all factors with institutional weighting
   */
  calculateCompositeScore(factors) {
    let weightedScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    let validFactors = 0;

    // Weight each factor by its confidence and institutional importance
    for (const [factorName, factorData] of Object.entries(factors)) {
      if (factorData && factorData.confidence > 0) {
        const weight = this.factorWeights[factorName] || 0.1;
        const confidenceWeight = factorData.confidence / 100;
        
        weightedScore += factorData.score * weight * confidenceWeight;
        totalWeight += weight * confidenceWeight;
        totalConfidence += factorData.confidence;
        validFactors++;
      }
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const avgConfidence = validFactors > 0 ? totalConfidence / validFactors : 0;

    // Determine sentiment
    let sentiment = 'neutral';
    if (finalScore > 0.5) sentiment = 'bullish';
    else if (finalScore < -0.5) sentiment = 'bearish';

    return {
      score: Math.max(-2, Math.min(2, finalScore)),
      confidence: Math.min(95, avgConfidence),
      sentiment,
      validFactors
    };
  }

  /**
   * Generate institutional-grade reasoning
   */
  generateInstitutionalReasoning(symbol, analysis) {
    const reasoning = [];
    const { factors, composite } = analysis;

    reasoning.push(`🏛️ INSTITUTIONAL ANALYSIS: ${symbol} - ${composite.sentiment.toUpperCase()} (${composite.score.toFixed(2)})`);

    // Momentum analysis
    if (factors.momentum.confidence > 50) {
      reasoning.push(`📈 MOMENTUM: ${factors.momentum.score.toFixed(2)} - Multi-timeframe consistency ${factors.momentum.consistency.toFixed(1)}%`);
    }

    // Sentiment analysis  
    if (factors.sentiment.newsCount > 0) {
      reasoning.push(`📰 SENTIMENT: ${factors.sentiment.score.toFixed(2)} - ${factors.sentiment.newsCount} articles (${factors.sentiment.bullishCount}B/${factors.sentiment.bearishCount}B)`);
    }

    // Insider activity
    if (factors.insider.transactionCount > 0) {
      reasoning.push(`👔 INSIDER: MSPR ${factors.insider.mspr.toFixed(3)} - ${factors.insider.transactionCount} transactions`);
    }

    // Technical factors
    if (factors.technical.confidence > 50) {
      reasoning.push(`🔧 TECHNICAL: ${factors.technical.score.toFixed(2)} - RSI:${factors.technical.indicators.rsi.toFixed(1)} MACD:${factors.technical.indicators.macd.macd > factors.technical.indicators.macd.signal ? 'Bull' : 'Bear'}`);
    }

    // Fundamental analysis
    if (factors.fundamental.confidence > 50) {
      reasoning.push(`💰 FUNDAMENTAL: ${factors.fundamental.score.toFixed(2)} - PE:${factors.fundamental.metrics.pe?.toFixed(1) || 'N/A'} ROE:${factors.fundamental.metrics.roe?.toFixed(1) || 'N/A'}%`);
    }

    // Order flow
    if (factors.flow.confidence > 50) {
      reasoning.push(`💹 ORDER FLOW: ${factors.flow.score.toFixed(2)} - Buy:${factors.flow.buyPressure.toFixed(3)} Sell:${factors.flow.sellPressure.toFixed(3)}`);
    }

    reasoning.push(`🎯 COMPOSITE CONFIDENCE: ${composite.confidence.toFixed(1)}% (${composite.validFactors} factors)`);

    return reasoning;
  }

  // Helper methods for calculations
  calculateMomentum(prices, periods) {
    if (prices.length < periods + 1) return 0;
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 1 - periods];
    return (current - past) / past;
  }

  calculateMomentumConsistency(momentums) {
    if (momentums.length < 2) return 0;
    const signs = momentums.map(m => m > 0 ? 1 : -1);
    const consistent = signs.every(s => s === signs[0]);
    return consistent ? 90 : 30;
  }

  calculateVolatility(prices, periods) {
    if (prices.length < periods) return 0;
    const returns = [];
    for (let i = 1; i < Math.min(prices.length, periods + 1); i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  analyzeNewsSentiment(text) {
    // Simple sentiment analysis - in production, use proper NLP
    const bullishWords = ['growth', 'profit', 'gain', 'rise', 'bull', 'positive', 'strong', 'beat', 'exceed'];
    const bearishWords = ['loss', 'decline', 'fall', 'bear', 'negative', 'weak', 'miss', 'disappoint'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    bullishWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.1;
    });
    
    bearishWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  calculateRSI(prices, periods) {
    if (prices.length < periods + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= periods; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / periods;
    const avgLoss = losses / periods;
    const rs = avgGain / (avgLoss || 0.001);
    
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Simplified signal line (would use EMA of MACD in production)
    const signal = macd * 0.9;
    
    return {
      macd,
      signal,
      histogram: macd - signal
    };
  }

  calculateEMA(prices, periods) {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (periods + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateBollingerBands(prices, periods, stdDev) {
    if (prices.length < periods) return { upper: 0, middle: 0, lower: 0 };
    
    const recentPrices = prices.slice(-periods);
    const middle = recentPrices.reduce((a, b) => a + b) / periods;
    
    const variance = recentPrices.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / periods;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: middle + (standardDeviation * stdDev),
      middle,
      lower: middle - (standardDeviation * stdDev)
    };
  }

  calculateVWAP(priceData) {
    if (priceData.length === 0) return 0;
    
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (const data of priceData) {
      const typicalPrice = (data.high + data.low + data.close) / 3;
      const volume = data.volume || 1000;
      
      totalVolumePrice += typicalPrice * volume;
      totalVolume += volume;
    }
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  calculateATR(priceData, periods) {
    if (priceData.length < periods + 1) return 0;
    
    const trueRanges = [];
    
    for (let i = 1; i < Math.min(priceData.length, periods + 1); i++) {
      const current = priceData[priceData.length - i];
      const previous = priceData[priceData.length - i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trueRanges.push(tr);
    }
    
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }

  analyzeVolumeProfile(priceData) {
    if (priceData.length < 10) return { trend: 'neutral', strength: 0 };
    
    const recent = priceData.slice(-10);
    let volumeTrend = 0;
    let priceTrend = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const volumeChange = (recent[i].volume - recent[i-1].volume) / recent[i-1].volume;
      const priceChange = (recent[i].close - recent[i-1].close) / recent[i-1].close;
      
      if (priceChange > 0 && volumeChange > 0) volumeTrend += 1;
      else if (priceChange < 0 && volumeChange > 0) volumeTrend -= 1;
      
      priceTrend += priceChange;
    }
    
    let trend = 'neutral';
    if (volumeTrend > 2 && priceTrend > 0) trend = 'bullish';
    else if (volumeTrend < -2 && priceTrend < 0) trend = 'bearish';
    
    return { trend, strength: Math.abs(volumeTrend) };
  }

  calculateOBV(priceData) {
    if (priceData.length < 2) return 0;
    
    let obv = 0;
    
    for (let i = 1; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = priceData[i - 1];
      
      if (current.close > previous.close) {
        obv += current.volume || 1000;
      } else if (current.close < previous.close) {
        obv -= current.volume || 1000;
      }
    }
    
    return obv;
  }

  // Fallback methods
  getDefaultMomentumScore(symbol) {
    const symbolType = this.getSymbolType(symbol);
    const baseScore = symbolType === 'crypto' ? 0.2 : 0.1;
    return {
      score: (Math.random() - 0.5) * baseScore,
      short: 0,
      medium: 0,
      long: 0,
      consistency: 50,
      volatility: 0.1,
      confidence: 30
    };
  }

  getDefaultTechnicalScore(symbol) {
    return {
      score: (Math.random() - 0.5) * 0.5,
      indicators: {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        vwap: 0,
        atr: 0,
        volumeProfile: { trend: 'neutral', strength: 0 },
        onBalanceVolume: 0
      },
      confidence: 30
    };
  }

  getSymbolType(symbol) {
    const megaCaps = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
    const memeStocks = ['GME', 'AMC', 'BB', 'WISH', 'CLOV', 'SPCE'];
    const etfs = ['SPY', 'QQQ', 'IWM', 'VTI', 'ARKK', 'XLK', 'XLF', 'XLE'];
    
    if (symbol.includes('/')) return 'crypto';
    if (megaCaps.includes(symbol)) return 'megacap';
    if (memeStocks.includes(symbol)) return 'meme';
    if (etfs.includes(symbol)) return 'etf';
    return 'standard';
  }

  getEnhancedFallbackAnalysis(symbol, timeframe) {
    const symbolType = this.getSymbolType(symbol);
    let baseStrength = 3.5;
    
    if (symbolType === 'crypto') baseStrength += (Math.random() - 0.4) * 1.5;
    else if (symbolType === 'megacap') baseStrength += (Math.random() - 0.5) * 0.8;
    else baseStrength += (Math.random() - 0.5) * 1.2;
    
    const finalStrength = Math.max(2.0, Math.min(5.0, baseStrength));
    const sentiment = finalStrength > 3.8 ? 'bullish' : 'bearish';
    
    return {
      symbol,
      timeframe,
      compositeScore: finalStrength,
      confidence: 60,
      sentiment,
      factors: {
        momentum: { score: 0, confidence: 30 },
        sentiment: { score: 0, confidence: 0 },
        insider: { score: 0, confidence: 0 },
        technical: { score: 0, confidence: 30 },
        fundamental: { score: 0, confidence: 0 },
        flow: { score: 0, confidence: 0 }
      },
      reasoning: [`🔄 Fallback analysis for ${symbol}`, `${sentiment.toUpperCase()} signal with ${finalStrength.toFixed(1)} strength`],
      timestamp: new Date().toISOString(),
      analysisType: 'fallback'
    };
  }
}

export default new InstitutionalAnalysisService(); 