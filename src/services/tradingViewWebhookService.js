/**
 * TRADINGVIEW WEBHOOK SERVICE
 * ===========================
 * 
 * Processes real-time alerts from TradingView webhooks and converts them
 * into actionable trading tips for the mobile app.
 * 
 * Features:
 * ✓ TradingView webhook endpoint handling
 * ✓ Custom Pine Script strategy integration
 * ✓ Real-time signal validation
 * ✓ Automatic tip generation and notification
 * ✓ Multi-timeframe alert support
 * ✓ Signal strength filtering
 */

const express = require('express');
const crypto = require('crypto');

class TradingViewWebhookService {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
    this.validStrategies = [
      'ema_crossover_strategy',
      'rsi_oversold_strategy', 
      'breakout_strategy',
      'momentum_strategy',
      'support_resistance_strategy'
    ];
  }

  setupRoutes() {
    // Main webhook endpoint for TradingView alerts
    this.router.post('/tradingview-webhook', this.handleTradingViewAlert.bind(this));
    
    // Test endpoint for webhook validation
    this.router.get('/webhook-test', (req, res) => {
      res.json({ 
        status: 'active', 
        timestamp: new Date().toISOString(),
        message: 'TradingView webhook service is running'
      });
    });
  }

  async handleTradingViewAlert(req, res) {
    try {
      console.log('📨 Received TradingView webhook alert');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      
      // Validate webhook authenticity (optional security measure)
      if (!this.validateWebhook(req)) {
        return res.status(401).json({ error: 'Unauthorized webhook' });
      }
      
      // Parse the alert data
      const alertData = this.parseAlertData(req.body);
      
      if (!alertData) {
        return res.status(400).json({ error: 'Invalid alert data format' });
      }
      
      // Validate alert data
      const validation = this.validateAlertData(alertData);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      // Process the alert and generate trading tip
      const result = await this.processAlert(alertData);
      
      if (result.success) {
        res.json({ 
          status: 'success', 
          message: 'Alert processed successfully',
          tipId: result.tipId,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          status: 'error', 
          message: result.error 
        });
      }
      
    } catch (error) {
      console.error('❌ Error processing TradingView webhook:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error' 
      });
    }
  }

  parseAlertData(body) {
    try {
      // TradingView sends JSON in the body
      if (typeof body === 'string') {
        return JSON.parse(body);
      }
      return body;
    } catch (error) {
      console.error('❌ Failed to parse alert data:', error);
      return null;
    }
  }

  validateAlertData(data) {
    const required = ['ticker', 'action', 'price'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }
    
    // Validate action
    const validActions = ['buy', 'sell', 'exit', 'close'];
    if (!validActions.includes(data.action.toLowerCase())) {
      return {
        isValid: false,
        error: `Invalid action: ${data.action}. Must be one of: ${validActions.join(', ')}`
      };
    }
    
    // Validate price
    if (isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
      return {
        isValid: false,
        error: 'Invalid price value'
      };
    }
    
    return { isValid: true };
  }

  validateWebhook(req) {
    // Optional: Implement webhook signature validation
    // You can add a secret key validation here for security
    const userAgent = req.headers['user-agent'];
    
    // TradingView webhooks come from specific user agents
    if (userAgent && userAgent.includes('TradingView')) {
      return true;
    }
    
    // For now, allow all webhooks (you can tighten this in production)
    return true;
  }

  async processAlert(alertData) {
    try {
      console.log(`🔄 Processing ${alertData.action.toUpperCase()} alert for ${alertData.ticker}`);
      
      // Extract and normalize data
      const symbol = alertData.ticker.toUpperCase();
      const action = alertData.action.toLowerCase();
      const price = parseFloat(alertData.price);
      const strategy = alertData.strategy || 'tradingview_webhook';
      const timeframe = alertData.timeframe || 'short_term';
      
      // Get additional context from technical analysis
      const technicalAnalysisService = require('./technicalAnalysisService');
      const tradingTipsService = require('./tradingTipsServiceOptimized');
      
      // Perform quick technical analysis to validate the signal
      const analysis = await technicalAnalysisService.getTechnicalAnalysis(symbol, timeframe);
      
      // Create enhanced trading tip from webhook data
      const tipData = this.createTipFromWebhook(alertData, analysis);
      
      // Validate signal strength
      if (tipData.strength < 2.0) {
        console.log(`⚠️ Signal strength too low (${tipData.strength}), skipping tip generation`);
        return { success: false, error: 'Signal strength below threshold' };
      }
      
      // Save the trading tip
      const tipId = await tradingTipsService.saveLiveTradingTip(tipData, 'tradingview_webhook');
      
      if (tipId) {
        // Send immediate notification
        await this.sendWebhookNotification(tipData);
        
        console.log(`✅ TradingView webhook processed successfully for ${symbol}`);
        return { success: true, tipId };
      } else {
        return { success: false, error: 'Failed to save trading tip' };
      }
      
    } catch (error) {
      console.error('❌ Error processing alert:', error);
      return { success: false, error: error.message };
    }
  }

  createTipFromWebhook(alertData, technicalAnalysis) {
    const symbol = alertData.ticker.toUpperCase();
    const action = alertData.action.toLowerCase();
    const entryPrice = parseFloat(alertData.price);
    
    // Calculate trading levels
    const atr = technicalAnalysis.indicators?.atr?.value || (entryPrice * 0.02);
    const timeframeMultipliers = {
      'short_term': { stop: 1.5, target: 2.5 },
      'mid_term': { stop: 2.0, target: 4.0 },
      'long_term': { stop: 3.0, target: 6.0 }
    };
    
    const timeframe = alertData.timeframe || 'short_term';
    const multiplier = timeframeMultipliers[timeframe];
    
    let stopLoss, takeProfit, sentiment;
    
    if (action === 'buy') {
      sentiment = 'bullish';
      stopLoss = entryPrice - (atr * multiplier.stop);
      takeProfit = entryPrice + (atr * multiplier.target);
    } else if (action === 'sell') {
      sentiment = 'bearish';
      stopLoss = entryPrice + (atr * multiplier.stop);
      takeProfit = entryPrice - (atr * multiplier.target);
    } else {
      // Exit signals
      sentiment = 'neutral';
      stopLoss = entryPrice;
      takeProfit = entryPrice;
    }
    
    // Calculate risk-reward ratio
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const riskRewardRatio = risk > 0 ? reward / risk : 1;
    
    // Determine signal strength based on various factors
    let strength = 2.5; // Base strength for webhook signals
    
    // Boost strength based on technical analysis agreement
    if (technicalAnalysis.analysis) {
      const techSentiment = technicalAnalysis.analysis.sentiment;
      if ((sentiment === 'bullish' && techSentiment === 'bullish') ||
          (sentiment === 'bearish' && techSentiment === 'bearish')) {
        strength += 1.0; // Agreement bonus
      }
      
      // Use technical analysis strength if available
      if (technicalAnalysis.analysis.strength > 0) {
        strength = Math.max(strength, technicalAnalysis.analysis.strength);
      }
    }
    
    // Create reasoning
    const reasoning = [
      `🚨 TradingView ${alertData.strategy || 'Strategy'} Alert: ${action.toUpperCase()} signal triggered`,
      `Entry at $${entryPrice.toFixed(2)} based on ${timeframe} analysis`,
      `Risk/Reward: 1:${riskRewardRatio.toFixed(2)} | ATR: ${atr.toFixed(2)}`
    ];
    
    // Add technical analysis reasoning if available
    if (technicalAnalysis.analysis?.reasoning) {
      reasoning.push(...technicalAnalysis.analysis.reasoning.slice(0, 2));
    }
    
    return {
      symbol,
      timeframe,
      sentiment,
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      strength,
      confidence: Math.min(95, strength * 20), // Convert to percentage
      reasoning,
      indicators: technicalAnalysis.indicators || {},
      currentPrice: entryPrice,
      analysis: {
        sentiment,
        strength,
        confidence: Math.min(95, strength * 20),
        tradingAction: action,
        entryPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio,
        reasoning
      },
      timestamp: new Date().toISOString(),
      
      // Webhook specific metadata
      webhookData: {
        originalAlert: alertData,
        strategy: alertData.strategy || 'unknown',
        alertTime: alertData.time || new Date().toISOString(),
        source: 'tradingview_webhook'
      }
    };
  }

  async sendWebhookNotification(tipData) {
    try {
      const notificationService = require('./notificationService');
      
      const action = tipData.analysis.tradingAction.toUpperCase();
      const emoji = action === 'BUY' ? '🟢' : action === 'SELL' ? '🔴' : '⚪';
      
      const message = {
        title: `${emoji} TradingView Alert: ${tipData.symbol}`,
        body: `${action} signal at $${tipData.entryPrice.toFixed(2)} | Target: $${tipData.takeProfit.toFixed(2)}`,
        data: {
          symbol: tipData.symbol,
          action: tipData.analysis.tradingAction,
          entryPrice: tipData.entryPrice.toString(),
          takeProfit: tipData.takeProfit.toString(),
          stopLoss: tipData.stopLoss.toString(),
          type: 'tradingview-webhook',
          strategy: tipData.webhookData.strategy,
          timestamp: tipData.timestamp,
          priority: 'high'
        }
      };
      
      await notificationService.sendToAllUsers(message);
      console.log(`📱 TradingView webhook notification sent for ${tipData.symbol}`);
      
    } catch (error) {
      console.error('❌ Error sending webhook notification:', error);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new TradingViewWebhookService(); 