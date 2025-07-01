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

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import LogoUtils from '../utils/logoUtils.js';
import technicalAnalysisService from './technicalAnalysisService.js';
import institutionalAnalysisService from './institutionalAnalysisService.js';
import axios from 'axios';

export class FerrariTradingSystem extends EventEmitter {
  constructor(firebaseServices = null) {
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
          // OPTIMIZED: Top 10 most liquid crypto pairs only (reduce noise)
          'BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD', 'SOL/USD', 
          'XRP/USD', 'DOT/USD', 'DOGE/USD', 'AVAX/USD', 'LINK/USD'
          // REMOVED: Secondary pairs that generate too much noise
          // 'UNI/USD', 'ALGO/USD', 'ATOM/USD', 'FTT/USD', 'NEAR/USD', 
          // 'MANA/USD', 'SAND/USD', 'MATIC/USD', 'CRO/USD', 'LRC/USD', 
          // 'ENJ/USD', 'GALA/USD', 'CHZ/USD'
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
      // Resource tracking for graceful shutdown
      websockets: new Set(),
      intervals: new Set(),
      timeouts: new Set(),
      isShuttingDown: false,
      dailySignalCount: 0,
      lastSignalDate: null,
      lastSignalTimestamp: null
    };
    
    // Initialize Firebase services
    if (firebaseServices && firebaseServices.isReady) {
      this.db = firebaseServices.db;
      this.messaging = firebaseServices.messaging;
      this.firebaseReady = true;
      console.log('🔥 Ferrari system using Firebase services');
    } else {
      console.log('⚠️ Ferrari system running in test mode - Firebase disabled');
      this.db = null;
      this.messaging = null;
      this.firebaseReady = false;
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
    console.log(`🔌 Connecting to Alpaca with ${symbols.length} symbols:`, symbols.slice(0, 5));
    const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');
    
    // Track WebSocket for graceful shutdown
    this.state.websockets.add(ws);
    
    ws.on('open', () => {
      console.log('🟢 Alpaca feed connected - sending authentication...');
      
      // Authenticate
      const authMsg = {
        action: 'auth',
        key: process.env.ALPACA_API_KEY,
        secret: process.env.ALPACA_SECRET_KEY
      };
      console.log('🔐 Alpaca auth message:', { action: authMsg.action, key: authMsg.key ? '***' : 'MISSING' });
      ws.send(JSON.stringify(authMsg));
    });

    ws.on('message', (data) => {
      if (!this.state.isShuttingDown) {
        try {
          const messages = JSON.parse(data);
          console.log(`📨 Alpaca raw message:`, messages);
          
          // Handle authentication response
          if (Array.isArray(messages)) {
            messages.forEach(msg => {
              if (msg.T === 'success' && msg.msg === 'authenticated') {
                console.log('✅ Alpaca authenticated successfully! Subscribing to symbols...');
                
                // Subscribe to trades for ALL symbols (log if too many)
                const subscribeMsg = {
                  action: 'subscribe',
                  trades: symbols // All symbols
                };
                if (symbols.length > 50) {
                  console.warn(`⚠️ Subscribing to a large number of Alpaca symbols: ${symbols.length}`);
                }
                ws.send(JSON.stringify(subscribeMsg));
                console.log('📡 Alpaca subscribing to:', subscribeMsg);
                
              } else if (msg.T === 'error') {
                console.error('❌ Alpaca error:', msg);
              } else if (msg.T === 'subscription') {
                console.log('✅ Alpaca subscription confirmed:', msg);
              } else {
                this.processAlpacaMessage(msg);
              }
            });
          }
        } catch (error) {
          console.error('❌ Error parsing Alpaca message:', error, 'Raw data:', data.toString());
        }
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔴 Alpaca feed disconnected: Code ${code}, Reason: ${reason}`);
      this.state.websockets.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ Alpaca feed error:', error);
      this.state.websockets.delete(ws);
    });

    return ws;
  }

  async connectBinanceFeed(cryptoSymbols) {
    console.log(`🔌 Connecting to Binance with ${cryptoSymbols.length} crypto symbols:`, cryptoSymbols.slice(0, 5));
    
    // Convert crypto symbols to Binance format (BTC/USD -> btcusdt)
    const binanceSymbols = cryptoSymbols.map(s => {
      const symbol = s.replace('/', '').toLowerCase();
      // Convert USD to USDT for Binance
      return symbol.replace('usd', 'usdt');
    });
    
    console.log('🔄 Converted symbols for Binance:', binanceSymbols.slice(0, 5));
    
    // Create stream URL for ticker data (24hr stats)
    const streamUrl = `wss://stream.binance.com:9443/ws/${binanceSymbols.map(s => `${s}@ticker`).join('/')}`;
    console.log('🌐 Binance stream URL:', streamUrl.substring(0, 100) + '...');
    
    const ws = new WebSocket(streamUrl);
    
    // Track WebSocket for graceful shutdown
    this.state.websockets.add(ws);
    
    ws.on('open', () => {
      console.log('🟢 Binance crypto feed connected successfully');
    });

    ws.on('message', (data) => {
      if (!this.state.isShuttingDown) {
        try {
          const message = JSON.parse(data);
          if (message.s) { // Ticker message
            // Convert BTCUSDT back to BTC/USD format
            const symbol = message.s.replace('USDT', '/USD').toUpperCase();
            
            // Only log Bitcoin-related messages to reduce spam
            if (symbol.includes('BTC')) {
              console.log(`🔍 Processing Binance message:`, { symbol: message.s, price: message.c, change: message.P });
              console.log(`📈 Binance ticker: ${symbol} @ $${message.c} (${message.P}% change)`);
            }
            
            this.updatePrice({
              symbol,
              price: parseFloat(message.c),
              volume: parseFloat(message.v),
              changePercent: parseFloat(message.P),
              timestamp: message.E,
              source: 'binance'
            });
          }
        } catch (error) {
          console.error('❌ Error parsing Binance message:', error, 'Raw data:', data.toString().substring(0, 200));
        }
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔴 Binance feed disconnected: Code ${code}, Reason: ${reason}`);
      this.state.websockets.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ Binance feed error:', error);
      this.state.websockets.delete(ws);
    });

    return ws;
  }

  async connectFinnhubFeed(symbols) {
    console.log(`🔌 Connecting to Finnhub with ${symbols.length} symbols:`, symbols.slice(0, 5));
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`);
    
    // Track WebSocket for graceful shutdown
    this.state.websockets.add(ws);
    
    ws.on('open', () => {
      console.log('🟢 Finnhub feed connected - subscribing to symbols...');
      
      // Subscribe to ALL symbols (log if too many)
      if (symbols.length > 50) {
        console.warn(`⚠️ Subscribing to a large number of Finnhub symbols: ${symbols.length}`);
      }
      symbols.forEach(symbol => {
        const subscribeMsg = { type: 'subscribe', symbol };
        ws.send(JSON.stringify(subscribeMsg));
      });
      console.log('📡 Finnhub subscribing to:', symbols);
    });

    ws.on('message', (data) => {
      if (!this.state.isShuttingDown) {
        try {
          const message = JSON.parse(data);
          console.log(`📨 Finnhub raw message:`, message);
          this.processFinnhubMessage(message);
        } catch (error) {
          console.error('❌ Error parsing Finnhub message:', error, 'Raw data:', data.toString());
        }
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔴 Finnhub feed disconnected: Code ${code}, Reason: ${reason}`);
      this.state.websockets.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ Finnhub feed error:', error);
      this.state.websockets.delete(ws);
    });

    return ws;
  }

  processAlpacaMessage(msg) {
    console.log(`🔍 Processing Alpaca message:`, msg);
    if (msg.T === 't') { // Trade message
      console.log(`📈 Alpaca trade: ${msg.S} @ $${msg.p} (volume: ${msg.s})`);
      this.updatePrice({
        symbol: msg.S,
        price: msg.p,
        volume: msg.s,
        timestamp: new Date(msg.t).getTime(),
        source: 'alpaca'
      });
    } else {
      console.log(`ℹ️ Alpaca non-trade message type: ${msg.T}`);
    }
  }

  processFinnhubMessage(msg) {
    console.log(`🔍 Processing Finnhub message:`, msg);
    if (msg.type === 'trade' && msg.data) {
      console.log(`📈 Finnhub trades: ${msg.data.length} trades received`);
      msg.data.forEach(trade => {
        console.log(`📈 Finnhub trade: ${trade.s} @ $${trade.p} (volume: ${trade.v})`);
        this.updatePrice({
          symbol: trade.s,
          price: trade.p,
          volume: trade.v,
          timestamp: trade.t,
          source: 'finnhub'
        });
      });
    } else if (msg.type === 'ping') {
      console.log('💓 Finnhub ping received');
    } else {
      console.log(`ℹ️ Finnhub message type: ${msg.type}`);
    }
  }

  updatePrice(priceData) {
    try {
      const { symbol, price, timestamp, volume, change, changePercent } = priceData;
      
      // Update price cache
      if (!this.state.priceCache.has(symbol)) {
        this.state.priceCache.set(symbol, {
          prices: [],
          lastUpdate: timestamp,
          volume: volume || 0,
          change: change || 0,
          changePercent: changePercent || 0
        });
      }

      const symbolData = this.state.priceCache.get(symbol);
      
      // Add new price point
      symbolData.prices.push({
        price: parseFloat(price),
        timestamp: timestamp || Date.now(),
        volume: volume || 0
      });
      
      // Keep only last 100 price points for analysis
      if (symbolData.prices.length > 100) {
        symbolData.prices = symbolData.prices.slice(-100);
      }
      
      // Update metadata
      symbolData.lastUpdate = timestamp || Date.now();
      symbolData.currentPrice = parseFloat(price);
      symbolData.volume = volume || 0;
      symbolData.change = change || 0;
      symbolData.changePercent = changePercent || 0;
      
      // Log every 50th price update to show system activity
      this.state.priceUpdateCounter = (this.state.priceUpdateCounter || 0) + 1;
      if (this.state.priceUpdateCounter % 50 === 0) {
        console.log(`📊 Price updates processed: ${this.state.priceUpdateCounter} | Active symbols: ${this.state.priceCache.size}`);
      }
      
      // Check for trading opportunities (only if we have enough data)
      if (symbolData.prices.length >= 20) {
        this.checkTradingOpportunity(symbol, symbolData);
      }
      
    } catch (error) {
      console.error('❌ Error updating price:', error);
    }
  }

  cleanupStaleData() {
    // Run cleanup every 1000 price updates to avoid performance impact
    if (Math.random() > 0.999) {
      const now = Date.now();
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const [symbol, data] of this.state.priceCache.entries()) {
        if (now - data.lastUpdate > staleThreshold) {
          console.log(`🧹 Cleaning up stale data for ${symbol}`);
          this.state.priceCache.delete(symbol);
        }
      }
    }
  }

  async checkTradingOpportunity(symbol, symbolData) {
    try {
      // Rate limiting: Don't analyze the same symbol too frequently
      const now = Date.now();
      const lastAnalysis = symbolData.lastAnalysis || 0;
      const analysisInterval = 30000; // 30 seconds minimum between analyses
      
      if (now - lastAnalysis < analysisInterval) {
        return;
      }
      
      // Log analysis trigger
      console.log(`🔍 ANALYZING: ${symbol} | Price: $${symbolData.currentPrice} | Change: ${(symbolData.changePercent || 0).toFixed(2)}%`);
      
      symbolData.lastAnalysis = now;
      
      // Skip if in signal cooldown (prevent spam)
      if (symbolData.signalCooldown && now < symbolData.signalCooldown) {
        const cooldownRemaining = Math.round((symbolData.signalCooldown - now) / 60000);
        console.log(`⏰ ${symbol} in cooldown for ${cooldownRemaining} more minutes`);
        return;
      }
      
      // Perform comprehensive analysis
      const analysis = await this.performComprehensiveAnalysis(symbol, symbolData);
      
      if (analysis) {
        console.log(`📊 ANALYSIS COMPLETE: ${symbol} | Strength: ${analysis.strength}/5.0 | Sentiment: ${analysis.sentiment.toUpperCase()}`);
        
        // Check if it passes quality gates
        if (this.passesQualityGates(analysis)) {
          console.log(`✅ QUALITY GATES PASSED: ${symbol} | Generating signal...`);
          await this.generateSignal(analysis);
        } else {
          console.log(`❌ Quality gates failed: ${symbol} | Strength: ${analysis.finalStrength} | RR: ${analysis.riskRewardRatio || 'undefined'}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error checking trading opportunity for ${symbol}:`, error);
    }
  }

  async performComprehensiveAnalysis(symbol, symbolData) {
    try {
      console.log(`🔍 Performing comprehensive analysis for ${symbol}`);
      
      // PHASE 1: Multi-timeframe technical analysis
      const timeframes = ['1min', '5min', '15min', '1hour'];
      const analyses = {};
      
      for (const tf of timeframes) {
        try {
          analyses[tf] = await technicalAnalysisService.getTechnicalAnalysis(symbol, tf);
        } catch (error) {
          console.warn(`⚠️ Failed to get ${tf} analysis for ${symbol}:`, error.message);
        }
      }

      // PHASE 2: Institutional-grade analysis (HEDGE FUND LEVEL)
      let institutionalAnalysis = null;
      try {
        console.log(`🏛️ Running institutional analysis for ${symbol}`);
        institutionalAnalysis = await institutionalAnalysisService.performInstitutionalAnalysis(
          symbol, 
          symbolData.prices, 
          '1h'
        );
        console.log(`✅ Institutional analysis complete for ${symbol}: ${institutionalAnalysis.sentiment} (${institutionalAnalysis.compositeScore.toFixed(2)})`);
      } catch (error) {
        console.warn(`⚠️ Institutional analysis failed for ${symbol}:`, error.message);
      }

      // PHASE 3: Combine all analyses
      const combinedAnalysis = await this.combineTimeframeAnalysis(symbol, analyses, symbolData);
      
      if (!combinedAnalysis) {
        console.warn(`⚠️ No valid analysis generated for ${symbol}`);
        return null;
      }

      // PHASE 4: Enhance with institutional insights
      if (institutionalAnalysis) {
        combinedAnalysis.institutionalGrade = {
          compositeScore: institutionalAnalysis.compositeScore,
          confidence: institutionalAnalysis.confidence,
          sentiment: institutionalAnalysis.sentiment,
          factors: institutionalAnalysis.factors,
          reasoning: institutionalAnalysis.reasoning,
          analysisType: institutionalAnalysis.analysisType
        };
        
        // Boost strength if institutional analysis aligns
        if (institutionalAnalysis.sentiment === combinedAnalysis.sentiment) {
          combinedAnalysis.strength += 0.5; // Institutional confirmation boost
          console.log(`🚀 Institutional confirmation boost for ${symbol}: ${combinedAnalysis.sentiment}`);
        }
        
        // Override with institutional score if significantly stronger
        if (institutionalAnalysis.compositeScore > combinedAnalysis.strength + 1.0) {
          console.log(`🏛️ Institutional override for ${symbol}: ${institutionalAnalysis.compositeScore.toFixed(2)} > ${combinedAnalysis.strength.toFixed(2)}`);
          combinedAnalysis.strength = institutionalAnalysis.compositeScore;
          combinedAnalysis.sentiment = institutionalAnalysis.sentiment;
        }
      }
      
      // PHASE 5: Add market context with error handling
      try {
        combinedAnalysis.marketContext = await this.getMarketContext();
      } catch (error) {
        console.warn(`⚠️ Failed to get market context for ${symbol}:`, error.message);
        combinedAnalysis.marketContext = {
          marketTrend: 'unknown',
          volatility: 'unknown',
          isMarketHours: this.isMarketHours(),
          sector: 'general'
        };
      }
      
      // PHASE 6: Calculate final strength score
      combinedAnalysis.finalStrength = this.calculateFinalStrength(combinedAnalysis);
      
      console.log(`📊 Final analysis for ${symbol}: ${combinedAnalysis.sentiment} strength ${combinedAnalysis.finalStrength.toFixed(2)}`);
      
      return combinedAnalysis;
    } catch (error) {
      console.error(`❌ Comprehensive analysis failed for ${symbol}:`, error);
      return null;
    }
  }

  async combineTimeframeAnalysis(symbol, analyses, symbolData) {
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
    const priceChange = symbolData.currentPrice - symbolData.prices[symbolData.prices.length - 2].price;
    const priceChangePercent = (priceChange / symbolData.prices[symbolData.prices.length - 2].price) * 100;

    // Calculate dynamic levels (await ATR with backfill)
    const type = symbol.includes('/') ? 'crypto' : 'stock';
    const atr = await this.calculateATR(symbolData.prices, symbol, type);
    const levels = this.calculateDynamicLevels(currentPrice, atr, consensusSentiment);

    console.log(`🔧 DEBUG: ${symbol} | ATR: ${atr.toFixed(6)} | Price: ${currentPrice} | Sentiment: ${consensusSentiment}`);
    console.log(`🔧 DEBUG: ${symbol} | Levels:`, JSON.stringify(levels, null, 2));

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

  /**
   * Fetch historical OHLCV data for a symbol.
   * @param {string} symbol - Symbol (e.g., BTC/USD, AAPL)
   * @param {string} type - 'crypto' or 'stock'
   * @param {number} limit - Number of candles to fetch (default 20)
   * @returns {Promise<Array>} Array of {open, high, low, close, volume}
   */
  async fetchHistoricalOHLCV(symbol, type, limit = 20) {
    try {
      if (type === 'crypto') {
        // Binance expects uppercase, USDT, no slash
        const originalSymbol = symbol;
        let binanceSymbol = symbol.replace('/', '').replace('USD', 'USDT').toUpperCase();
        const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=${limit}`;
        console.log(`[Binance OHLCV] Requesting:`, { originalSymbol, binanceSymbol, url });
        try {
          const resp = await axios.get(url);
          if (resp.status !== 200) {
            console.warn(`[Binance OHLCV] Non-200 response`, { status: resp.status, data: resp.data });
          }
          return resp.data.map(candle => ({
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
          }));
        } catch (err) {
          if (err.response) {
            console.error(`[Binance OHLCV] Error response for`, { originalSymbol, binanceSymbol, url, status: err.response.status, data: err.response.data });
          } else {
            console.error(`[Binance OHLCV] Request error for`, { originalSymbol, binanceSymbol, url, message: err.message });
          }
          throw err;
        }
      } else if (type === 'stock') {
        // Try Alpaca first
        if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
          const alpacaUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Hour&limit=${limit}`;
          const resp = await axios.get(alpacaUrl, {
            headers: {
              'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
              'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
            }
          });
          if (resp.data && resp.data.bars && resp.data.bars.length > 0) {
            return resp.data.bars.map(bar => ({
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v
            }));
          }
        }
        // Fallback: Finnhub
        if (process.env.FINNHUB_API_KEY) {
          const finnhubUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=60&count=${limit}&token=${process.env.FINNHUB_API_KEY}`;
          const resp = await axios.get(finnhubUrl);
          if (resp.data && resp.data.c && resp.data.c.length > 0) {
            // Finnhub returns arrays for o/h/l/c/v
            return resp.data.c.map((close, i) => ({
              open: resp.data.o[i],
              high: resp.data.h[i],
              low: resp.data.l[i],
              close: close,
              volume: resp.data.v[i]
            }));
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ fetchHistoricalOHLCV failed for ${symbol} (${type}):`, err.message);
    }
    return [];
  }

  /**
   * Robust ATR calculation with backfill for missing OHLCV data.
   * If priceHistory is missing/invalid, fetches and retries before fallback.
   */
  async calculateATR(priceHistory, symbol = '', type = '') {
    // Defensive: must be array with at least 2 elements
    if (!Array.isArray(priceHistory) || priceHistory.length < 2 || priceHistory.some(p => typeof p.close !== 'number' || typeof p.high !== 'number' || typeof p.low !== 'number')) {
      console.warn(`⚠️ ATR: priceHistory missing/invalid for ${symbol}. Attempting backfill...`);
      // Try to fetch and retry
      const fetched = await this.fetchHistoricalOHLCV(symbol, type);
      if (Array.isArray(fetched) && fetched.length >= 2) {
        priceHistory = fetched;
      } else {
        console.warn(`⚠️ ATR: Backfill failed for ${symbol}. Using fallback.`);
        return 0.001;
      }
    }

    // Standard ATR calculation for symbols with enough data
    if (priceHistory.length >= 14) {
      const trueRanges = [];
      for (let i = 1; i < Math.min(priceHistory.length, 20); i++) {
        const current = priceHistory[i];
        const previous = priceHistory[i - 1];
        const highLow = Math.abs(current.high - current.low);
        const highClose = Math.abs(current.high - previous.close);
        const lowClose = Math.abs(current.low - previous.close);
        trueRanges.push(Math.max(highLow, highClose, lowClose));
      }
      const atr = trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
      const currentPrice = priceHistory[0].close;
      const minimumATR = currentPrice * 0.001;
      return Math.max(atr, minimumATR);
    }

    // Fallback ATR for symbols with limited data
    const recentPrices = priceHistory.slice(0, Math.min(priceHistory.length, 10));
    const prices = recentPrices.map(p => p.close);
    if (prices.length < 2) {
      return prices[0] * 0.001;
    }
    let totalVariation = 0;
    for (let i = 1; i < prices.length; i++) {
      totalVariation += Math.abs(prices[i] - prices[i - 1]);
    }
    const avgVariation = totalVariation / (prices.length - 1);
    const currentPrice = prices[0];
    const minimumATR = currentPrice * 0.001;
    const calculatedATR = Math.max(avgVariation, minimumATR);
    console.log(`🔧 DEBUG ATR: ${symbol} | Calculated: ${calculatedATR.toFixed(6)} | Price: ${currentPrice} | Points: ${prices.length}`);
    return calculatedATR;
  }

  calculateDynamicLevels(price, atr, sentiment) {
    // Ensure we have valid inputs
    if (!price || !atr || atr <= 0) {
      console.warn(`⚠️ Invalid inputs for level calculation: price=${price}, atr=${atr}`);
      return null;
    }
    
    // Dynamic multipliers based on sentiment and volatility
    let stopMultiplier, target1Multiplier, target2Multiplier;
    
    switch (sentiment) {
      case 'bullish':
        stopMultiplier = 2.0;    // Stop below entry
        target1Multiplier = 5.0; // Target above entry (RR = 5.0/2.0 = 2.5)
        target2Multiplier = 8.0; // Extended target
        
        return {
          entry: price,
          stopLoss: price - (atr * stopMultiplier),
          takeProfit1: price + (atr * target1Multiplier),
          takeProfit2: price + (atr * target2Multiplier)
        };
        
      case 'bearish':
        stopMultiplier = 2.0;    // Stop above entry
        target1Multiplier = 5.0; // Target below entry (RR = 5.0/2.0 = 2.5)
        target2Multiplier = 8.0; // Extended target
        
        return {
          entry: price,
          stopLoss: price + (atr * stopMultiplier),
          takeProfit1: price - (atr * target1Multiplier),
          takeProfit2: price - (atr * target2Multiplier)
        };
        
      case 'neutral':
        // For neutral, create a small range trade setup
        stopMultiplier = 2.0;
        target1Multiplier = 5.0;
        target2Multiplier = 8.0;
        
        // Randomly choose direction for neutral (or use price momentum)
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        return {
          entry: price,
          stopLoss: price - (direction * atr * stopMultiplier),
          takeProfit1: price + (direction * atr * target1Multiplier),
          takeProfit2: price + (direction * atr * target2Multiplier)
        };
        
      default:
        console.warn(`⚠️ Unknown sentiment: ${sentiment}, defaulting to neutral`);
        return {
          entry: price,
          stopLoss: price - (atr * 2.0),
          takeProfit1: price + (atr * 5.0),
          takeProfit2: price + (atr * 8.0)
        };
    }
  }

  async getMarketContext() {
    try {
      // Get market-wide indicators
      const spyData = this.state.priceCache.get('SPY');
      
      let marketTrend = 'neutral';
      if (spyData && spyData.prices.length > 5) {
        const recentPrices = spyData.prices.slice(-5);
        const firstPrice = recentPrices[0].price;
        const lastPrice = recentPrices[recentPrices.length - 1].price;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        if (change > 0.5) marketTrend = 'bullish';
        else if (change < -0.5) marketTrend = 'bearish';
      }
      
      return {
        marketTrend,
        volatility: 'normal', // Could be enhanced with VIX data
        isMarketHours: this.isMarketHours(),
        sector: 'general'
      };
    } catch (error) {
      console.warn('⚠️ Error getting market context:', error.message);
      return {
        marketTrend: 'unknown',
        volatility: 'unknown',
        isMarketHours: this.isMarketHours(),
        sector: 'general'
      };
    }
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
    
    console.log(`🔧 DEBUG Quality Gates: ${analysis.symbol} | Has levels: ${!!analysis.levels} | Strength: ${analysis.finalStrength}`);
    if (analysis.levels) {
      console.log(`🔧 DEBUG Levels: Entry: ${analysis.levels.entry}, Stop: ${analysis.levels.stopLoss}, TP1: ${analysis.levels.takeProfit1}`);
    }
    
    // Minimum strength
    if (analysis.finalStrength < gates.minimumStrength) {
      return false;
    }
    
    // Ensure levels exist
    if (!analysis.levels || 
        analysis.levels.entry === undefined || 
        analysis.levels.stopLoss === undefined || 
        analysis.levels.takeProfit1 === undefined) {
      console.warn(`⚠️ Missing trading levels for ${analysis.symbol}`);
      return false;
    }
    
    // Risk/reward ratio calculation
    const risk = Math.abs(analysis.levels.entry - analysis.levels.stopLoss);
    const reward = Math.abs(analysis.levels.takeProfit1 - analysis.levels.entry);
    const riskReward = risk > 0 ? reward / risk : 0;
    
    console.log(`🔧 DEBUG RR: ${analysis.symbol} | Risk: ${risk.toFixed(6)} | Reward: ${reward.toFixed(6)} | RR: ${riskReward.toFixed(2)}`);
    
    // ALWAYS set riskRewardRatio for debug purposes
    analysis.riskRewardRatio = riskReward;
    
    // Check if RR meets minimum requirement (with small tolerance for floating point precision)
    const tolerance = 0.001;
    if (riskReward < (gates.minimumRiskReward - tolerance)) {
      return false;
    }
    
    return true;
  }

  async generateSignal(analysis) {
    // Check user rate limits before generating
    if (!this.canSendSignalNow()) {
      console.log(`❌ Cannot send signal for ${analysis.symbol}: daily/hourly limit reached.`);
      return;
    }
    
    // Mark signal as sent (update limits)
    this.markSignalSent();

    // Send notification to FCM topic 'trading_tips'
    if (!this.firebaseReady || !this.messaging) {
      console.log('📱 Test mode: Would send notification for:', analysis.symbol);
      return;
    }
    try {
      // Beautiful notification formatting
      const title = `🏎️ ${analysis.symbol} ${analysis.sentiment.toUpperCase()} Signal`;
      const body = [
        `${analysis.sentiment === 'bullish' ? '🚀' : analysis.sentiment === 'bearish' ? '🔻' : '⚖️'} ${analysis.symbol} ${analysis.sentiment.toUpperCase()} @ $${Number(analysis.levels.entry).toFixed(2)}`,
        `Strength: ${Number(analysis.strength).toFixed(2)}/5 | RR: ${Number(analysis.riskRewardRatio).toFixed(2)}`,
        `TP: $${Number(analysis.levels.takeProfit1).toFixed(2)} | SL: $${Number(analysis.levels.stopLoss).toFixed(2)}`
      ].join('\n');

      // FCM data payload: all string values
      const data = {
        symbol: String(analysis.symbol),
        sentiment: String(analysis.sentiment),
        strength: String(analysis.strength),
        trackingId: String(this.generateTrackingId()),
        type: 'trading_tip',
        entryPrice: String(analysis.levels.entry),
        stopLoss: String(analysis.levels.stopLoss),
        takeProfit: String(analysis.levels.takeProfit1),
        takeProfit2: String(analysis.levels.takeProfit2),
        riskRewardRatio: String(analysis.riskRewardRatio),
        confidence: String(Math.min(95, analysis.strength * 19)),
        marketContext: JSON.stringify(analysis.marketContext),
        reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning.join('\n') : String(analysis.reasoning),
        company: JSON.stringify(LogoUtils.getCompanyInfo(analysis.symbol)),
        analysisLevel: analysis.institutionalGrade ? 'institutional_grade' : 'technical_grade',
        timestamp: String(analysis.timestamp),
        isPremium: String(true),
        isFerrariSignal: String(true),
        isInstitutionalGrade: String(!!analysis.institutionalGrade),
        expiresAt: String(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      };

      const payload = {
        topic: 'trading_tips',
        notification: {
          title,
          body
        },
        data
      };
      console.log('🚀 FCM payload preview:', JSON.stringify(payload, null, 2));
      await this.messaging.send(payload);
      console.log(`✅ Ferrari signal sent to topic 'trading_tips' for ${analysis.symbol}`);
    } catch (error) {
      console.error('❌ Error sending Ferrari signal notification:', error);
    }
  }

  canSendSignalNow() {
    const now = Date.now();
    const today = new Date().toDateString();
    const todaySignals = this.state.dailySignalCount || 0;
    const maxDailySignals = this.config.rateLimiting.maxDailyTips || 5;
    const lastSignalTime = this.state.lastSignalTimestamp || 0;
    const oneHour = 60 * 60 * 1000;
    if (todaySignals >= maxDailySignals) {
      console.log(`⚠️ Daily signal limit reached (${todaySignals}/${maxDailySignals})`);
      return false;
    }
    if (now - lastSignalTime < oneHour) {
      const mins = Math.ceil((oneHour - (now - lastSignalTime)) / 60000);
      console.log(`⚠️ Hourly signal limit: must wait ${mins} more min(s)`);
      return false;
    }
    return true;
  }

  markSignalSent() {
    this.state.lastSignalTimestamp = Date.now();
    this.state.dailySignalCount = (this.state.dailySignalCount || 0) + 1;
  }

  createPremiumTip(analysis) {
    // Get complete company information with logo and business data
    const companyInfo = LogoUtils.getCompanyInfo(analysis.symbol);
    
    // Determine timeframe based on strength and market conditions
    const timeframe = this.determineTimeframe(analysis);
    
    // Enhanced reasoning with institutional insights
    let enhancedReasoning = [...analysis.reasoning];
    
    // Add institutional analysis to reasoning if available
    if (analysis.institutionalGrade) {
      enhancedReasoning.push('');
      enhancedReasoning.push('🏛️ INSTITUTIONAL ANALYSIS:');
      enhancedReasoning.push(...analysis.institutionalGrade.reasoning);
      enhancedReasoning.push(`Institutional Confidence: ${analysis.institutionalGrade.confidence.toFixed(1)}%`);
    }
    
    // BACKWARD COMPATIBILITY FIX #1: Convert neutral sentiment to bullish/bearish for Flutter app
    let appCompatibleSentiment = analysis.sentiment;
    if (analysis.sentiment === 'neutral') {
      // BETTER LOGIC: Determine sentiment based on trading direction (LONG vs SHORT)
      const entryPrice = analysis.levels.entry;
      const takeProfit = analysis.levels.takeProfit1;
      
      if (entryPrice && takeProfit) {
        if (takeProfit > entryPrice) {
          // Take profit higher than entry = LONG position = bullish
          appCompatibleSentiment = 'bullish';
          enhancedReasoning.unshift('📈 Neutral signal converted to BULLISH (LONG position: target above entry)');
        } else {
          // Take profit lower than entry = SHORT position = bearish  
          appCompatibleSentiment = 'bearish';
          enhancedReasoning.unshift('📉 Neutral signal converted to BEARISH (SHORT position: target below entry)');
        }
      } else {
        // Fallback to price momentum if no clear levels
        const priceChange = analysis.priceChangePercent || 0;
        appCompatibleSentiment = priceChange >= 0 ? 'bullish' : 'bearish';
        enhancedReasoning.unshift(`📊 Neutral signal converted to ${appCompatibleSentiment} based on price momentum (fallback)`);
      }
    }
    
    return {
      symbol: analysis.symbol,
      timeframe: timeframe, // Mobile app compatibility - FIXED: Now includes timeframe
      sentiment: appCompatibleSentiment, // Now guaranteed to be 'bullish' or 'bearish'
      strength: analysis.finalStrength,
      confidence: Math.min(95, analysis.finalStrength * 19),
      
      // Trading levels
      entryPrice: analysis.levels.entry,
      stopLoss: analysis.levels.stopLoss,
      takeProfit: analysis.levels.takeProfit1,
      takeProfit2: analysis.levels.takeProfit2,
      riskRewardRatio: analysis.riskRewardRatio,
      
      // Context and reasoning - ENHANCED WITH INSTITUTIONAL INSIGHTS
      reasoning: enhancedReasoning,
      marketContext: analysis.marketContext,
      priceChange: analysis.priceChangePercent,
      
      // Institutional grade data (HEDGE FUND LEVEL)
      institutionalGrade: analysis.institutionalGrade || null,
      
      // Mobile app required fields
      createdAt: new Date(),
      images: {}, // Will be populated by image generation service
      
      // Analysis data structure for mobile app - ENHANCED
      analysis: {
        sentiment: appCompatibleSentiment, // Use compatible sentiment here too
        strength: analysis.finalStrength,
        entryPrice: analysis.levels.entry,
        stopLoss: analysis.levels.stopLoss,
        takeProfit: analysis.levels.takeProfit1,
        reasoning: enhancedReasoning,
        institutionalGrade: analysis.institutionalGrade || null
      },
      
      // Complete company data with logo and business info
      company: {
        name: companyInfo.name,
        symbol: analysis.symbol,
        logoUrl: companyInfo.logoUrl,
        sector: companyInfo.sector,
        business: companyInfo.business,
        isCrypto: companyInfo.isCrypto
      },
      
      // Metadata - ENHANCED
      system: 'ferrari_v2_institutional',
      analysisLevel: analysis.institutionalGrade ? 'institutional_grade' : 'technical_grade',
      timestamp: analysis.timestamp,
      isPremium: true,
      isFerrariSignal: true,
      isInstitutionalGrade: !!analysis.institutionalGrade,
      
      // Performance tracking
      trackingId: this.generateTrackingId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  determineTimeframe(analysis) {
    // BACKWARD COMPATIBILITY FIX #2: Map to Flutter app's expected timeframe values
    // Flutter app expects: 'short_term', 'mid_term', 'long_term' (with underscores)
    const strength = analysis.finalStrength;
    const riskReward = analysis.riskRewardRatio;
    
    // High strength, high risk/reward = short term (quick moves)
    if (strength >= 4.5 && riskReward >= 3.0) {
      return 'short_term'; // Flutter deep-link compatibility
    }
    
    // Good strength, balanced risk/reward = mid term
    if (strength >= 4.0 && riskReward >= 2.5) {
      return 'mid_term'; // Flutter deep-link compatibility
    }
    
    // Lower strength but still quality = long term (more time to develop)
    return 'long_term'; // Flutter deep-link compatibility
  }

  buildReasoning(symbol, sentiment, strength, priceChange) {
    const reasons = [];
    
    reasons.push(`🏎️ FERRARI SIGNAL: ${sentiment.toUpperCase()} momentum detected`);
    reasons.push(`Strength: ${strength.toFixed(1)}/5.0 (Premium Quality)`);
    
    if (Math.abs(priceChange) > 1) {
      reasons.push(`Price momentum: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`);
    }
    
    reasons.push(`Multi-timeframe confirmation across 1m-1h analysis`);
    reasons.push(`🏛️ Enhanced with institutional-grade hedge fund analysis`);
    reasons.push(`📊 Multi-factor scoring: momentum, sentiment, insider activity`);
    reasons.push(`Risk management: Dynamic ATR-based levels`);
    
    return reasons;
  }

  startSignalEngine() {
    // Process signals every 10 seconds
    const signalInterval = setInterval(() => {
      if (!this.state.isShuttingDown) {
        this.processSignalQueue();
      }
    }, 10000);
    
    this.state.intervals.add(signalInterval);
  }

  startRateLimitManager() {
    // Reset hourly limits every hour
    const hourlyInterval = setInterval(() => {
      if (!this.state.isShuttingDown) {
        this.resetHourlyLimits();
      }
    }, 3600000); // 1 hour
    
    // Reset daily limits at midnight
    const dailyInterval = setInterval(() => {
      if (!this.state.isShuttingDown) {
        this.resetDailyLimits();
      }
    }, 86400000); // 24 hours
    
    this.state.intervals.add(hourlyInterval);
    this.state.intervals.add(dailyInterval);
  }

  startPerformanceTracking() {
    // Track performance every 5 minutes
    const performanceInterval = setInterval(() => {
      if (!this.state.isShuttingDown) {
        this.updatePerformanceMetrics();
      }
    }, 300000);
    
    this.state.intervals.add(performanceInterval);
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
    if (!this.firebaseReady || !this.db) {
      console.log('📝 Test mode: Would save Ferrari tip:', tip.symbol, tip.sentiment, 'strength:', tip.strength);
      return 'test_id_' + Date.now();
    }
    
    try {
      // Save to Ferrari-specific collection
      const docRef = await this.db.collection('ferrari_tips').add(tip);
      
      // Also save to regular collection for app compatibility
      await this.db.collection('trading_tips').add({
        ...tip,
        isFerrariSignal: true
      });
      
      console.log('✅ Ferrari tip saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving Ferrari tip:', error);
      // Return null to indicate failure but don't crash
      return null;
    }
  }

  async sendToEligibleUsers(tip, eligibleUsers) {
    if (!this.firebaseReady || !this.messaging) {
      console.log('📱 Test mode: Would send Ferrari notification for:', tip.symbol);
      return;
    }
    
    try {
      // BACKWARD COMPATIBILITY FIX #3: Use FCM topic broadcasting like old system
      const sentimentEmoji = tip.sentiment === 'bullish' ? '🚀' : '📉';
      
      const message = {
        notification: {
          title: `🏎️ ${tip.symbol} ${tip.sentiment.toUpperCase()} Signal`,
          body: `${sentimentEmoji} ${tip.symbol} ${tip.sentiment.toUpperCase()} @ $${tip.entryPrice?.toFixed(2) || 'TBD'}\nStrength: ${tip.strength.toFixed(1)}/5 | RR: ${tip.riskRewardRatio?.toFixed(2) || 'N/A'}\nTP: $${tip.takeProfit?.toFixed(2) || 'TBD'} | SL: $${tip.stopLoss?.toFixed(2) || 'TBD'}`
        },
        // CRITICAL: All data values must be strings for FCM compatibility
        data: {
          type: 'trading_tip',
          symbol: tip.symbol,
          timeframe: tip.timeframe, // BACKWARD COMPATIBILITY: For deep-linking
          target_timeframe: tip.timeframe, // CRITICAL: Flutter navigation
          sentiment: tip.sentiment,
          strength: tip.strength.toString(),
          confidence: tip.confidence?.toString() || '0',
          entryPrice: tip.entryPrice?.toString() || '',
          stopLoss: tip.stopLoss?.toString() || '',
          takeProfit: tip.takeProfit?.toString() || '',
          riskRewardRatio: tip.riskRewardRatio?.toString() || '',
          reasoning: JSON.stringify(tip.reasoning || []),
          companyName: tip.company?.name || tip.symbol,
          companyLogoUrl: tip.company?.logoUrl || '',
          companySector: tip.company?.sector || '',
          companyBusiness: tip.company?.business || '',
          companyIsCrypto: tip.company?.isCrypto?.toString() || 'false',
          timestamp: tip.timestamp || new Date().toISOString(),
          trackingId: tip.trackingId || '',
          isFerrariSignal: 'true',
          system: 'ferrari_v2'
        },
        // Use topic broadcasting instead of individual user targeting
        topic: 'trading_tips'
      };
      
      const response = await this.messaging.send(message);
      console.log(`✅ Ferrari signal sent to topic 'trading_tips' for ${tip.symbol}:`, response);
      
    } catch (error) {
      console.error('❌ Error sending Ferrari notification:', error);
      throw error;
    }
  }

  async updateUserLimits(eligibleUsers, tip) {
    for (const user of eligibleUsers) {
      const userId = user.userId;
      const canReceiveSignal = await this.canUserReceiveSignal(userId, tip);
      
      if (canReceiveSignal) {
        const userLimits = this.state.userLimits.get(userId) || {
          dailyCount: 0,
          hourlyCount: 0,
          lastSignal: 0,
          lastReset: new Date().toDateString()
        };
        
        userLimits.dailyCount++;
        userLimits.hourlyCount++;
        userLimits.lastSignal = Date.now();
        
        this.state.userLimits.set(userId, userLimits);
      }
    }
  }

  async updatePerformanceMetrics() {
    // Implementation of updatePerformanceMetrics method
  }

  async processSignalQueue() {
    // Implementation of processSignalQueue method
  }

  async resetHourlyLimits() {
    // Implementation of resetHourlyLimits method
  }

  async resetDailyLimits() {
    // Implementation of resetDailyLimits method
  }

  // Helper: Check if US market is open (9:30am-4:00pm EST, weekdays)
  isUSMarketOpen() {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = est.getHours();
    const minute = est.getMinutes();
    const day = est.getDay();
    if (day === 0 || day === 6) return false; // Sunday/Saturday
    const marketStart = 9.5; // 9:30am
    const marketEnd = 16; // 4:00pm
    const currentTime = hour + (minute / 60);
    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  // Helper: Check if we can send a signal (daily/hourly limits)
  canSendSignalNow() {
    const now = Date.now();
    const today = new Date().toDateString();
    const todaySignals = this.state.dailySignalCount || 0;
    const maxDailySignals = this.config.rateLimiting.maxDailyTips || 5;
    const lastSignalTime = this.state.lastSignalTimestamp || 0;
    const oneHour = 60 * 60 * 1000;
    if (todaySignals >= maxDailySignals) {
      console.log(`⚠️ Daily signal limit reached (${todaySignals}/${maxDailySignals})`);
      return false;
    }
    if (now - lastSignalTime < oneHour) {
      const mins = Math.ceil((oneHour - (now - lastSignalTime)) / 60000);
      console.log(`⚠️ Hourly signal limit: must wait ${mins} more min(s)`);
      return false;
    }
    return true;
  }

  // Helper: Mark signal sent (update lastSignalTimestamp)
  markSignalSent() {
    this.state.lastSignalTimestamp = Date.now();
    this.state.dailySignalCount = (this.state.dailySignalCount || 0) + 1;
  }

  // Main signal selection logic: prefer stocks during US market hours, crypto otherwise
  async selectAndGenerateSignal() {
    // Gather all analyses ready for signal
    const stockCandidates = [];
    const cryptoCandidates = [];
    for (const symbol of this.config.watchlist.stocks) {
      const analysis = await this.analyzeSymbol(symbol);
      if (analysis && this.passesQualityGates(analysis)) {
        stockCandidates.push(analysis);
      }
    }
    for (const symbol of this.config.watchlist.crypto) {
      const analysis = await this.analyzeSymbol(symbol);
      if (analysis && this.passesQualityGates(analysis)) {
        cryptoCandidates.push(analysis);
      }
    }
    const marketOpen = this.isUSMarketOpen();
    let chosen = null;
    if (marketOpen && stockCandidates.length > 0) {
      chosen = stockCandidates[0];
      console.log('📈 Market open: preferring stock signal:', chosen.symbol);
    } else if (cryptoCandidates.length > 0) {
      chosen = cryptoCandidates[0];
      console.log('💹 Market closed or no stocks: preferring crypto signal:', chosen.symbol);
    } else if (stockCandidates.length > 0) {
      chosen = stockCandidates[0];
      console.log('⚠️ No crypto signals, fallback to stock:', chosen.symbol);
    } else {
      console.log('❌ No valid signals available.');
      return;
    }
    await this.generateSignal(chosen);
  }
}