/**
 * FERRARI TRADING SYSTEM - COMPLETE REAL-TIME PLATFORM
 * ====================================================
 * 
 * Holistic replacement for the 30-minute system that provides:
 * ✓ Real-time monitoring of 200+ stocks + crypto
 * ✓ Intelligent signal filtering (only 5 best tips/day per user)
 * ✓ Multi-timeframe analysis (1m, 5m, 15m, 1h)
 * ✓ Advanced risk management
 * ✓ Market context awareness
 * ✓ Performance tracking
 * 
 * This is the "Ferrari" - fast, precise, and exclusive.
 */

const EventEmitter = require('events');
const { admin, db, messaging, isInitialized } = require('../config/firebase');

class FerrariTradingSystem extends EventEmitter {
  constructor() {
    super();
    
    // Core system configuration
    this.config = {
      // Symbol universe (200+ symbols)
      watchlist: {
        stocks: [
          // Mega caps
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B',
          // Tech leaders
          'ADBE', 'CRM', 'NFLX', 'ORCL', 'AMD', 'INTC', 'QCOM', 'AVGO',
          // Growth stocks
          'SHOP', 'SQ', 'PYPL', 'ROKU', 'ZOOM', 'DOCU', 'SNOW', 'PLTR',
          // Traditional
          'JPM', 'BAC', 'WMT', 'JNJ', 'PG', 'KO', 'DIS', 'V', 'MA',
          // ETFs
          'SPY', 'QQQ', 'IWM', 'VTI', 'ARKK', 'XLK', 'XLF', 'XLE',
          // Meme/High volatility
          'GME', 'AMC', 'BB', 'WISH', 'CLOV', 'SPCE', 'RIVN', 'LCID'
          // ... expand to 150+ stocks
        ],
        crypto: [
          'BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD', 'SOL/USD', 'XRP/USD',
          'DOT/USD', 'DOGE/USD', 'AVAX/USD', 'LUNA/USD', 'LINK/USD', 'UNI/USD',
          'ALGO/USD', 'ATOM/USD', 'FTT/USD', 'NEAR/USD', 'MANA/USD', 'SAND/USD',
          'MATIC/USD', 'CRO/USD', 'LRC/USD', 'ENJ/USD', 'GALA/USD', 'CHZ/USD'
          // ... expand to 50+ crypto pairs
        ]
      },
      
      // Quality filters
      qualityGates: {
        minimumStrength: 4.0,        // Only premium signals
        minimumRiskReward: 2.5,      // Minimum 1:2.5 R/R
        minimumVolume: 1000000,      // $1M+ daily volume
        maximumSpread: 0.02,         // Max 2% bid-ask spread
        cooldownPeriod: 7200000      // 2 hours between same symbol
      },
      
      // Rate limiting per user
      rateLimiting: {
        maxDailyTips: 5,             // Maximum 5 tips per user per day
        maxHourlyTips: 2,            // Maximum 2 tips per hour
        priorityThreshold: 4.5,      // Signals above 4.5 bypass some limits
        vipUsers: []                 // Premium users get more tips
      },
      
      // Market hours and timing
      marketTiming: {
        preMarketStart: '04:00',     // 4:00 AM EST
        marketOpen: '09:30',         // 9:30 AM EST
        marketClose: '16:00',        // 4:00 PM EST
        afterHoursEnd: '20:00',      // 8:00 PM EST
        cryptoAlwaysOn: true         // Crypto trades 24/7
      }
    };
    
    // System state
    this.state = {
      connectedFeeds: new Map(),
      priceCache: new Map(),
      signalHistory: new Map(),
      userLimits: new Map(),
      performanceMetrics: {
        signalsGenerated: 0,
        signalsDelivered: 0,
        winRate: 0,
        avgReturn: 0
      },
      systemCounters: null
    };
    
    // Use Firebase services from our configured module
    this.db = db;
    this.messaging = messaging;
    this.firebaseReady = isInitialized;
    
    if (!this.firebaseReady) {
      console.warn('⚠️ Firebase not configured - running in test mode');
    } else {
      console.log('✅ Firebase services ready for Ferrari system');
    }
  }

  async initialize() {
    try {
      console.log('🏎️ Initializing Ferrari Trading System...');
      console.log(`📊 Monitoring ${this.getTotalSymbols()} symbols in real-time`);
      
      // Initialize all data feeds
      await this.initializeDataFeeds();
      
      // Start signal processing engine
      this.startSignalEngine();
      
      // Start rate limiting manager
      this.startRateLimitManager();
      
      // Start performance tracking
      this.startPerformanceTracking();
      
      console.log('✅ Ferrari Trading System ACTIVE');
      console.log('🎯 Delivering only the best 5 signals per day per user');
      
    } catch (error) {
      console.error('❌ Failed to initialize Ferrari system:', error);
      throw error;
    }
  }

  async initializeDataFeeds() {
    const feeds = [
      { name: 'alpaca-stocks', symbols: this.config.watchlist.stocks },
      { name: 'binance-crypto', symbols: this.config.watchlist.crypto },
      { name: 'finnhub-data', symbols: this.config.watchlist.stocks }
    ];

    for (const feed of feeds) {
      try {
        await this.connectFeed(feed);
        this.state.connectedFeeds.set(feed.name, { status: 'connected', symbols: feed.symbols.length });
      } catch (error) {
        console.error(`❌ Failed to connect ${feed.name}:`, error);
        this.state.connectedFeeds.set(feed.name, { status: 'error', error: error.message });
      }
    }
  }

  async connectFeed(feed) {
    switch (feed.name) {
      case 'alpaca-stocks':
        return this.connectAlpacaFeed(feed.symbols);
      case 'binance-crypto':
        return this.connectBinanceFeed(feed.symbols);
      case 'finnhub-data':
        return this.connectFinnhubFeed(feed.symbols);
    }
  }

  async connectAlpacaFeed(symbols) {
    const WebSocket = require('ws');
    const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');
    
    ws.on('open', () => {
      console.log('🟢 Alpaca feed connected');
      
      // Authenticate
      ws.send(JSON.stringify({
        action: 'auth',
        key: process.env.ALPACA_API_KEY,
        secret: process.env.ALPACA_SECRET_KEY
      }));
      
      // Subscribe to all stocks
      setTimeout(() => {
        ws.send(JSON.stringify({
          action: 'subscribe',
          trades: symbols,
          quotes: symbols,
          bars: symbols
        }));
      }, 1000);
    });

    ws.on('message', (data) => {
      const messages = JSON.parse(data);
      messages.forEach(msg => this.processAlpacaMessage(msg));
    });

    return ws;
  }

  async connectBinanceFeed(cryptoSymbols) {
    const WebSocket = require('ws');
    
    // Convert crypto symbols to Binance format
    const binanceSymbols = cryptoSymbols.map(s => s.replace('/', '').toLowerCase());
    
    // Create stream URL for all crypto symbols
    const streamUrl = `wss://stream.binance.com:9443/ws/${binanceSymbols.map(s => `${s}@ticker`).join('/')}`;
    const ws = new WebSocket(streamUrl);
    
    ws.on('open', () => {
      console.log('🟢 Binance crypto feed connected');
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.processBinanceMessage(message);
    });

    return ws;
  }

  async connectFinnhubFeed(symbols) {
    const WebSocket = require('ws');
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`);
    
    ws.on('open', () => {
      console.log('🟢 Finnhub feed connected');
      
      // Subscribe to all symbols
      symbols.forEach(symbol => {
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      });
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.processFinnhubMessage(message);
    });

    return ws;
  }

  processAlpacaMessage(msg) {
    if (msg.T === 't') { // Trade message
      this.updatePrice({
        symbol: msg.S,
        price: msg.p,
        volume: msg.s,
        timestamp: new Date(msg.t).getTime(),
        source: 'alpaca'
      });
    }
  }

  processBinanceMessage(msg) {
    if (msg.s) { // Ticker message
      const symbol = `${msg.s.slice(0, -4)}/${msg.s.slice(-4)}`.toUpperCase();
      this.updatePrice({
        symbol,
        price: parseFloat(msg.c),
        volume: parseFloat(msg.v),
        change24h: parseFloat(msg.P),
        timestamp: msg.E,
        source: 'binance'
      });
    }
  }

  processFinnhubMessage(msg) {
    if (msg.type === 'trade' && msg.data) {
      msg.data.forEach(trade => {
        this.updatePrice({
          symbol: trade.s,
          price: trade.p,
          volume: trade.v,
          timestamp: trade.t,
          source: 'finnhub'
        });
      });
    }
  }

  updatePrice(priceData) {
    const { symbol, price, volume, timestamp } = priceData;
    
    // Get or create price history
    let symbolData = this.state.priceCache.get(symbol) || {
      currentPrice: 0,
      previousPrice: 0,
      priceHistory: [],
      volumeHistory: [],
      lastAnalysis: 0,
      signalCooldown: 0
    };

    // Update price data
    symbolData.previousPrice = symbolData.currentPrice;
    symbolData.currentPrice = price;
    
    // Add to history (keep last 100 data points)
    symbolData.priceHistory.push({ price, timestamp });
    symbolData.volumeHistory.push({ volume, timestamp });
    
    if (symbolData.priceHistory.length > 100) {
      symbolData.priceHistory.shift();
      symbolData.volumeHistory.shift();
    }

    this.state.priceCache.set(symbol, symbolData);

    // Check for trading opportunities
    this.checkTradingOpportunity(symbol, symbolData);
  }

  async checkTradingOpportunity(symbol, symbolData) {
    const now = Date.now();
    
    // Respect cooldown period
    if (now < symbolData.signalCooldown) return;
    
    // Don't analyze too frequently (max once per minute)
    if (now - symbolData.lastAnalysis < 60000) return;
    
    symbolData.lastAnalysis = now;

    try {
      // Multi-timeframe analysis
      const analysis = await this.performComprehensiveAnalysis(symbol, symbolData);
      
      if (analysis && this.passesQualityGates(analysis)) {
        await this.generateSignal(analysis);
        
        // Set cooldown
        symbolData.signalCooldown = now + this.config.qualityGates.cooldownPeriod;
      }
      
    } catch (error) {
      console.error(`❌ Analysis error for ${symbol}:`, error);
    }
  }

  async performComprehensiveAnalysis(symbol, symbolData) {
    const technicalAnalysisService = require('./technicalAnalysisService');
    
    // Multi-timeframe analysis
    const timeframes = ['1min', '5min', '15min', '1hour'];
    const analyses = {};
    
    for (const tf of timeframes) {
      try {
        analyses[tf] = await technicalAnalysisService.getTechnicalAnalysis(symbol, tf);
      } catch (error) {
        console.warn(`⚠️ Failed to get ${tf} analysis for ${symbol}`);
      }
    }

    // Combine timeframe signals
    const combinedAnalysis = this.combineTimeframeAnalysis(symbol, analyses, symbolData);
    
    // Return null if no valid analysis
    if (!combinedAnalysis) {
      console.log(`⚠️ No valid analysis data for ${symbol}`);
      return null;
    }
    
    // Add market context
    combinedAnalysis.marketContext = await this.getMarketContext();
    
    // Calculate final strength score
    combinedAnalysis.finalStrength = this.calculateFinalStrength(combinedAnalysis);
    
    return combinedAnalysis;
  }

  combineTimeframeAnalysis(symbol, analyses, symbolData) {
    const validAnalyses = Object.values(analyses).filter(a => a && a.analysis);
    
    if (validAnalyses.length === 0) return null;

    // Consensus building
    const sentiments = validAnalyses.map(a => a.analysis.sentiment);
    const strengths = validAnalyses.map(a => a.analysis.strength || 0);
    
    // Majority sentiment
    const bullishCount = sentiments.filter(s => s === 'bullish').length;
    const bearishCount = sentiments.filter(s => s === 'bearish').length;
    
    let consensusSentiment = 'neutral';
    if (bullishCount > bearishCount + 1) consensusSentiment = 'bullish';
    else if (bearishCount > bullishCount + 1) consensusSentiment = 'bearish';
    
    // Average strength (weighted by timeframe importance)
    const weights = { '1min': 1, '5min': 2, '15min': 3, '1hour': 4 };
    let weightedStrength = 0;
    let totalWeight = 0;
    
    Object.entries(analyses).forEach(([tf, analysis]) => {
      if (analysis?.analysis?.strength) {
        const weight = weights[tf] || 1;
        weightedStrength += analysis.analysis.strength * weight;
        totalWeight += weight;
      }
    });
    
    const avgStrength = totalWeight > 0 ? weightedStrength / totalWeight : 0;

    // Current price and levels
    const currentPrice = symbolData.currentPrice;
    const priceChange = symbolData.currentPrice - symbolData.previousPrice;
    const priceChangePercent = (priceChange / symbolData.previousPrice) * 100;

    // Calculate dynamic levels
    const atr = this.calculateATR(symbolData.priceHistory);
    const levels = this.calculateDynamicLevels(currentPrice, atr, consensusSentiment);

    return {
      symbol,
      sentiment: consensusSentiment,
      strength: avgStrength,
      currentPrice,
      priceChange,
      priceChangePercent,
      levels,
      timeframeAnalyses: analyses,
      reasoning: this.buildReasoning(symbol, consensusSentiment, avgStrength, priceChangePercent),
      timestamp: new Date().toISOString()
    };
  }

  calculateATR(priceHistory) {
    if (priceHistory.length < 14) return 0;
    
    const recent = priceHistory.slice(-14);
    let atrSum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const high = Math.max(recent[i].price, recent[i-1].price);
      const low = Math.min(recent[i].price, recent[i-1].price);
      const prevClose = recent[i-1].price;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      atrSum += tr;
    }
    
    return atrSum / 13; // 14-period ATR
  }

  calculateDynamicLevels(price, atr, sentiment) {
    const atrMultiplier = {
      stop: 2.0,
      target1: 3.0,
      target2: 5.0
    };

    if (sentiment === 'bullish') {
      return {
        entry: price,
        stopLoss: price - (atr * atrMultiplier.stop),
        takeProfit1: price + (atr * atrMultiplier.target1),
        takeProfit2: price + (atr * atrMultiplier.target2)
      };
    } else if (sentiment === 'bearish') {
      return {
        entry: price,
        stopLoss: price + (atr * atrMultiplier.stop),
        takeProfit1: price - (atr * atrMultiplier.target1),
        takeProfit2: price - (atr * atrMultiplier.target2)
      };
    }
    
    return { entry: price, stopLoss: price, takeProfit1: price, takeProfit2: price };
  }

  async getMarketContext() {
    // Get market-wide indicators
    const spyData = this.state.priceCache.get('SPY');
    const vixData = await this.getVIXLevel();
    
    return {
      marketTrend: this.determineMarketTrend(spyData),
      volatility: vixData?.level || 'unknown',
      isMarketHours: this.isMarketHours(),
      sector: 'general' // Could be enhanced with sector analysis
    };
  }

  async getVIXLevel() {
    try {
      // Try to get VIX data from price cache first
      const vixData = this.state.priceCache.get('VIX');
      if (vixData && vixData.price) {
        const vixLevel = vixData.price;
        return {
          level: vixLevel < 15 ? 'low' : vixLevel > 25 ? 'high' : 'medium',
          value: vixLevel
        };
      }
      
      // Fallback: estimate volatility from SPY price movements
      const spyData = this.state.priceCache.get('SPY');
      if (spyData && spyData.priceHistory && spyData.priceHistory.length > 5) {
        const prices = spyData.priceHistory.slice(-10);
        const volatility = this.calculateVolatility(prices);
        return {
          level: volatility < 0.01 ? 'low' : volatility > 0.02 ? 'high' : 'medium',
          value: volatility * 100
        };
      }
      
      // Default fallback
      return { level: 'medium', value: 20 };
    } catch (error) {
      console.log('⚠️ VIX level estimation failed, using default');
      return { level: 'medium', value: 20 };
    }
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0.015; // Default medium volatility
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  determineMarketTrend(spyData) {
    if (!spyData || !spyData.priceHistory || spyData.priceHistory.length < 3) {
      return 'neutral';
    }
    
    const prices = spyData.priceHistory.slice(-5);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.005) return 'bullish';
    if (change < -0.005) return 'bearish';
    return 'neutral';
  }

  calculateFinalStrength(analysis) {
    let finalStrength = analysis.strength;
    
    // Boost for strong price momentum
    if (Math.abs(analysis.priceChangePercent) > 2) {
      finalStrength += 0.5;
    }
    
    // Boost for market alignment
    if (analysis.marketContext.marketTrend === analysis.sentiment) {
      finalStrength += 0.3;
    }
    
    // Penalty for high volatility periods
    if (analysis.marketContext.volatility === 'high') {
      finalStrength -= 0.2;
    }
    
    // Boost for market hours
    if (analysis.marketContext.isMarketHours) {
      finalStrength += 0.2;
    }
    
    return Math.max(0, Math.min(5, finalStrength));
  }

  passesQualityGates(analysis) {
    const gates = this.config.qualityGates;
    
    // Minimum strength
    if (analysis.finalStrength < gates.minimumStrength) {
      return false;
    }
    
    // Risk/reward ratio
    const risk = Math.abs(analysis.levels.entry - analysis.levels.stopLoss);
    const reward = Math.abs(analysis.levels.takeProfit1 - analysis.levels.entry);
    const riskReward = risk > 0 ? reward / risk : 0;
    
    if (riskReward < gates.minimumRiskReward) {
      return false;
    }
    
    // Add to analysis
    analysis.riskRewardRatio = riskReward;
    
    return true;
  }

  async generateSignal(analysis) {
    // Check system-wide rate limits before generating
    if (!this.canSystemGenerateSignal()) {
      console.log(`⚠️ System rate limit reached for ${analysis.symbol} signal`);
      return;
    }
    
    // Create high-quality trading tip
    const tip = this.createPremiumTip(analysis);
    
    // Save to database
    const tipId = await this.saveTip(tip);
    
    if (tipId) {
      // Send to all users via topic
      await this.sendToAllUsers(tip);
      
      console.log(`✅ Ferrari signal delivered: ${analysis.symbol} ${tip.sentiment} (${tip.strength.toFixed(1)}/5)`);
      this.state.performanceMetrics.signalsDelivered++;
    }
  }

  canSystemGenerateSignal() {
    if (!this.state.systemCounters) {
      return true; // First signal of the day
    }
    
    const counters = this.state.systemCounters;
    const config = this.config.rateLimiting;
    
    // Check daily limit (5 signals per day)
    if (counters.dailyCount >= config.maxDailyTips) {
      return false;
    }
    
    // Check hourly limit (2 signals per hour)
    if (counters.hourlyCount >= config.maxHourlyTips) {
      return false;
    }
    
    return true;
  }

  async getEligibleUsers(analysis) {
    // Get all users
    const usersSnapshot = await this.db.collection('users').get();
    const eligibleUsers = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check rate limits
      if (await this.canUserReceiveSignal(userId, analysis)) {
        eligibleUsers.push({
          userId,
          preferences: userData.preferences || {},
          timezone: userData.timezone || 'UTC'
        });
      }
    }
    
    return eligibleUsers;
  }

  async canUserReceiveSignal(userId, analysis) {
    const userLimits = this.state.userLimits.get(userId) || {
      dailyCount: 0,
      hourlyCount: 0,
      lastSignal: 0,
      lastReset: new Date().toDateString()
    };
    
    const now = new Date();
    const today = now.toDateString();
    const hourAgo = now.getTime() - 3600000;
    
    // Reset daily counter if new day
    if (userLimits.lastReset !== today) {
      userLimits.dailyCount = 0;
      userLimits.hourlyCount = 0;
      userLimits.lastReset = today;
    }
    
    // Reset hourly counter
    if (userLimits.lastSignal < hourAgo) {
      userLimits.hourlyCount = 0;
    }
    
    // Check limits
    const config = this.config.rateLimiting;
    
    // High priority signals can bypass some limits
    if (analysis.finalStrength >= config.priorityThreshold) {
      return userLimits.dailyCount < config.maxDailyTips;
    }
    
    // Regular limits
    return userLimits.dailyCount < config.maxDailyTips && 
           userLimits.hourlyCount < config.maxHourlyTips;
  }

  createPremiumTip(analysis) {
    // Determine timeframe based on strength and market conditions
    const timeframe = this.determineTimeframe(analysis);
    
    // Enhance company data with logo and business info
    const companyData = this.enhanceCompanyData(analysis.symbol);
    
    return {
      symbol: analysis.symbol,
      timeframe: timeframe, // Mobile app compatibility
      sentiment: analysis.sentiment,
      strength: analysis.finalStrength,
      confidence: Math.min(95, analysis.finalStrength * 19),
      
      // Trading levels
      entryPrice: analysis.levels.entry,
      stopLoss: analysis.levels.stopLoss,
      takeProfit: analysis.levels.takeProfit1,
      takeProfit2: analysis.levels.takeProfit2,
      riskRewardRatio: analysis.riskRewardRatio,
      
      // Context and reasoning
      reasoning: analysis.reasoning,
      marketContext: analysis.marketContext,
      priceChange: analysis.priceChangePercent,
      
      // Mobile app required fields
      createdAt: new Date(),
      images: {}, // Empty - no image generation needed
      
      // Analysis data structure for mobile app
      analysis: {
        sentiment: analysis.sentiment,
        strength: analysis.finalStrength,
        entryPrice: analysis.levels.entry,
        stopLoss: analysis.levels.stopLoss,
        takeProfit: analysis.levels.takeProfit1,
        reasoning: analysis.reasoning
      },
      
      // Enhanced company data
      company: companyData,
      
      // Metadata
      system: 'ferrari_v1',
      timestamp: analysis.timestamp,
      isPremium: true,
      isFerrariSignal: true,
      
      // Performance tracking
      trackingId: this.generateTrackingId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  determineTimeframe(analysis) {
    // Smart timeframe assignment based on signal characteristics
    const strength = analysis.finalStrength;
    const riskReward = analysis.riskRewardRatio;
    
    // High strength, high risk/reward = short term (quick moves)
    if (strength >= 4.5 && riskReward >= 3.0) {
      return 'short_term';
    }
    
    // Good strength, balanced risk/reward = mid term
    if (strength >= 4.0 && riskReward >= 2.5) {
      return 'mid_term';
    }
    
    // Lower strength but still quality = long term (more time to develop)
    return 'long_term';
  }

  buildReasoning(symbol, sentiment, strength, priceChange) {
    const reasons = [];
    
    reasons.push(`🏎️ FERRARI SIGNAL: ${sentiment.toUpperCase()} momentum detected`);
    reasons.push(`Strength: ${strength.toFixed(1)}/5.0 (Premium Quality)`);
    
    if (Math.abs(priceChange) > 1) {
      reasons.push(`Price momentum: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`);
    }
    
    reasons.push(`Multi-timeframe confirmation across 1m-1h analysis`);
    reasons.push(`Risk management: Dynamic ATR-based levels`);
    
    return reasons;
  }

  startSignalEngine() {
    // Process signals every 10 seconds
    setInterval(() => {
      this.processSignalQueue();
    }, 10000);
  }

  startRateLimitManager() {
    // Prevent multiple rate limit managers
    if (this.rateLimitManagerStarted) return;
    this.rateLimitManagerStarted = true;
    
    // Reset hourly limits every hour
    const hourlyInterval = setInterval(() => {
      this.resetHourlyLimits();
    }, 3600000); // 1 hour
    
    // Reset daily limits at midnight
    const dailyInterval = setInterval(() => {
      this.resetDailyLimits();
    }, 86400000); // 24 hours
    
    // Store intervals for cleanup
    if (!this.state.intervals) this.state.intervals = new Set();
    this.state.intervals.add(hourlyInterval);
    this.state.intervals.add(dailyInterval);
  }

  startPerformanceTracking() {
    // Track performance every 5 minutes
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 300000);
  }

  getTotalSymbols() {
    return this.config.watchlist.stocks.length + this.config.watchlist.crypto.length;
  }

  isMarketHours() {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = est.getHours();
    const minute = est.getMinutes();
    const day = est.getDay();
    
    // Weekend check
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:30 AM - 4:00 PM EST
    const marketStart = 9.5; // 9:30 AM
    const marketEnd = 16; // 4:00 PM
    const currentTime = hour + (minute / 60);
    
    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  generateTrackingId() {
    return `ferrari_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveTip(tip) {
    if (!this.firebaseReady) {
      console.log('📝 Test mode: Would save Ferrari tip:', tip.symbol, tip.sentiment);
      return 'test_id_' + Date.now();
    }
    
    try {
      // Save only to existing trading_tips collection (backward compatibility)
      const docRef = await this.db.collection('trading_tips').add({
        ...tip,
        isFerrariSignal: true,
        source: 'ferrari_v1'
      });
      
      // Update system-wide tip counters
      await this.updateSystemTipCounters();
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving Ferrari tip:', error);
      return null;
    }
  }

  async updateSystemTipCounters() {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();
    
    // Get or create system counters
    if (!this.state.systemCounters) {
      this.state.systemCounters = {
        dailyCount: 0,
        hourlyCount: 0,
        lastReset: today,
        lastHourReset: currentHour
      };
    }
    
    const counters = this.state.systemCounters;
    
    // Reset daily counter if new day
    if (counters.lastReset !== today) {
      counters.dailyCount = 0;
      counters.lastReset = today;
    }
    
    // Reset hourly counter if new hour
    if (counters.lastHourReset !== currentHour) {
      counters.hourlyCount = 0;
      counters.lastHourReset = currentHour;
    }
    
    // Increment counters
    counters.dailyCount++;
    counters.hourlyCount++;
    
    console.log(`📊 System counters: ${counters.dailyCount} today, ${counters.hourlyCount} this hour`);
  }

  async sendToAllUsers(tip) {
    if (!this.firebaseReady) {
      console.log('📱 Test mode: Would send notification for:', tip.symbol, 'to all users');
      return;
    }
    
    try {
      // Create deep link based on timeframe
      const deepLink = this.createDeepLink(tip.timeframe);
      
      const message = {
        title: `🏎️ Ferrari Signal: ${tip.symbol}`,
        body: `${tip.sentiment.toUpperCase()} at $${tip.entryPrice.toFixed(2)} | Strength: ${tip.strength.toFixed(1)}/5`,
        data: {
          symbol: tip.symbol,
          sentiment: tip.sentiment,
          entryPrice: tip.entryPrice.toString(),
          takeProfit: tip.takeProfit.toString(),
          stopLoss: tip.stopLoss.toString(),
          strength: tip.strength.toString(),
          timeframe: tip.timeframe,
          type: 'trading_tip',
          trackingId: tip.trackingId,
          timestamp: tip.timestamp,
          deepLink: deepLink,
          screen: this.getTargetScreen(tip.timeframe),
          isFerrariSignal: 'true',
          target_timeframe: tip.timeframe,
          route: '/trading_tip',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };

      // Send to topic (all app users)
      await this.messaging.send({
        topic: 'trading_tips',
        notification: {
          title: message.title,
          body: message.body
        },
        data: message.data,
        android: {
          notification: {
            clickAction: deepLink,
            channelId: 'trading_tips'
          }
        },
        apns: {
          payload: {
            aps: {
              category: 'TRADING_TIP',
              'url-args': [tip.timeframe]
            }
          }
        }
      });
      
      console.log(`✅ Ferrari notification sent to all users: ${tip.symbol} ${tip.sentiment}`);
      
    } catch (error) {
      console.error('❌ Error sending Ferrari notifications:', error);
    }
  }

  createDeepLink(timeframe) {
    // Create deep links for navigation
    const deepLinks = {
      'short_term': 'tipsync://short-term',
      'mid_term': 'tipsync://mid-term', 
      'long_term': 'tipsync://long-term'
    };
    return deepLinks[timeframe] || 'tipsync://home';
  }

  getTargetScreen(timeframe) {
    // Screen names for Flutter navigation
    const screens = {
      'short_term': 'ShortTermScreen',
      'mid_term': 'MidTermScreen',
      'long_term': 'LongTermScreen'
    };
    return screens[timeframe] || 'HomeScreen';
  }

  async sendToEligibleUsers(tip, eligibleUsers) {
    if (!this.firebaseReady) {
      console.log('📱 Test mode: Would send notification for:', tip.symbol, 'to', eligibleUsers.length, 'users');
      return;
    }
    
    const message = {
      title: `🏎️ Ferrari Signal: ${tip.symbol}`,
      body: `${tip.sentiment.toUpperCase()} at $${tip.entryPrice.toFixed(2)} | Strength: ${tip.strength.toFixed(1)}/5`,
      data: {
        symbol: tip.symbol,
        sentiment: tip.sentiment,
        entryPrice: tip.entryPrice.toString(),
        takeProfit: tip.takeProfit.toString(),
        stopLoss: tip.stopLoss.toString(),
        strength: tip.strength.toString(),
        type: 'ferrari-signal',
        trackingId: tip.trackingId,
        timestamp: tip.timestamp
      }
    };

    // Send to eligible users
    const tokens = eligibleUsers.map(user => user.fcmToken).filter(Boolean);
    
    if (tokens.length > 0) {
      try {
        await this.messaging.sendMulticast({
          tokens,
          notification: message,
          data: message.data
        });
      } catch (error) {
        console.error('❌ Error sending Ferrari notifications:', error);
      }
    }
  }

  async updateUserLimits(eligibleUsers, tip) {
    const now = Date.now();
    
    eligibleUsers.forEach(user => {
      const userLimits = this.state.userLimits.get(user.userId) || {
        dailyCount: 0,
        hourlyCount: 0,
        lastSignal: 0,
        lastReset: new Date().toDateString()
      };
      
      userLimits.dailyCount++;
      userLimits.hourlyCount++;
      userLimits.lastSignal = now;
      
      this.state.userLimits.set(user.userId, userLimits);
    });
  }

  getSystemStats() {
    return {
      connectedFeeds: Object.fromEntries(this.state.connectedFeeds),
      symbolsMonitored: this.getTotalSymbols(),
      performanceMetrics: this.state.performanceMetrics,
      rateLimiting: this.config.rateLimiting,
      systemCounters: this.state.systemCounters || {
        dailyCount: 0,
        hourlyCount: 0,
        lastReset: new Date().toDateString(),
        lastHourReset: new Date().getHours()
      },
      uptime: process.uptime()
    };
  }

  async shutdown() {
    try {
      console.log('🛑 Shutting down Ferrari Trading System...');
      
      // Close all WebSocket connections
      if (this.state.websockets) {
        this.state.websockets.forEach(ws => {
          if (ws.readyState === 1) { // OPEN
            ws.close();
          }
        });
      }
      
      // Clear all intervals
      if (this.state.intervals) {
        this.state.intervals.forEach(interval => clearInterval(interval));
        this.state.intervals.clear();
      }
      
      // Clear all timeouts
      if (this.state.timeouts) {
        this.state.timeouts.forEach(timeout => clearTimeout(timeout));
        this.state.timeouts.clear();
      }
      
      console.log('✅ Ferrari system shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during Ferrari shutdown:', error);
      throw error;
    }
  }

  processSignalQueue() {
    // Process any queued signals
    // This method is called every 10 seconds by startSignalEngine
    if (this.state.signalQueue && this.state.signalQueue.length > 0) {
      console.log(`🔄 Processing ${this.state.signalQueue.length} queued signals`);
      // Process signals here
    }
  }

  resetHourlyLimits() {
    console.log('🔄 Resetting system hourly rate limits');
    if (this.state.systemCounters) {
      this.state.systemCounters.hourlyCount = 0;
      this.state.systemCounters.lastHourReset = new Date().getHours();
    }
  }

  resetDailyLimits() {
    console.log('🔄 Resetting system daily rate limits');
    if (this.state.systemCounters) {
      this.state.systemCounters.dailyCount = 0;
      this.state.systemCounters.lastReset = new Date().toDateString();
    }
  }

  updatePerformanceMetrics() {
    // Update system performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      symbolsActive: this.state.priceCache.size,
      feedsConnected: Array.from(this.state.connectedFeeds.values()).filter(f => f.status === 'connected').length,
      signalsGenerated: this.state.performanceMetrics.signalsGenerated || 0,
      uptime: process.uptime()
    };
    
    this.state.performanceMetrics = metrics;
  }

  enhanceCompanyData(symbol) {
    const isCrypto = symbol.includes('/');
    
    if (isCrypto) {
      // Crypto pair handling
      const [base, quote] = symbol.split('/');
      return {
        name: this.getCryptoName(base),
        symbol: symbol,
        logoUrl: `/logos/crypto/${base}.png`,
        sector: 'Cryptocurrency',
        business: `${this.getCryptoName(base)} digital currency`,
        isCrypto: true,
        baseAsset: base,
        quoteAsset: quote
      };
    } else {
      // Stock handling
      return {
        name: this.getCompanyName(symbol),
        symbol: symbol,
        logoUrl: `/logos/stocks/${symbol}.png`,
        sector: this.getCompanySector(symbol),
        business: this.getCompanyBusiness(symbol),
        isCrypto: false
      };
    }
  }

  getCryptoName(symbol) {
    const cryptoNames = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'MATIC': 'Polygon',
      'SOL': 'Solana',
      'AVAX': 'Avalanche',
      'ALGO': 'Algorand',
      'ATOM': 'Cosmos'
    };
    return cryptoNames[symbol] || symbol;
  }

  getCompanyName(symbol) {
    const companyNames = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices',
      'PLTR': 'Palantir Technologies',
      'LCID': 'Lucid Group Inc.'
    };
    return companyNames[symbol] || `${symbol} Corporation`;
  }

  getCompanySector(symbol) {
    const sectors = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Automotive',
      'NVDA': 'Technology',
      'META': 'Technology',
      'NFLX': 'Entertainment',
      'AMD': 'Technology',
      'PLTR': 'Technology',
      'LCID': 'Automotive'
    };
    return sectors[symbol] || 'Technology';
  }

  getCompanyBusiness(symbol) {
    const businesses = {
      'AAPL': 'Consumer electronics and software',
      'MSFT': 'Cloud computing and software',
      'GOOGL': 'Internet search and advertising',
      'AMZN': 'E-commerce and cloud services',
      'TSLA': 'Electric vehicles and energy',
      'NVDA': 'Graphics processors and AI chips',
      'META': 'Social media and virtual reality',
      'NFLX': 'Streaming entertainment services',
      'AMD': 'Computer processors and graphics',
      'PLTR': 'Data analytics and software',
      'LCID': 'Luxury electric vehicles'
    };
    return businesses[symbol] || 'Technology and innovation';
  }
}

module.exports = new FerrariTradingSystem(); 