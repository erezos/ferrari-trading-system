const express = require('express');
const cors = require('cors');
const tradingTipsRoutes = require('./routes/tradingTips');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static logo files (must be before API routes)
app.use('/logos', express.static('public/logos'));

// API Routes
app.use('/api/trading-tips', tradingTipsRoutes);

// Ferrari Trading System - The new real-time engine
const ferrariTradingSystem = require('./services/ferrariTradingSystem');

// TradingView webhook routes (keep for additional signals)
const tradingViewWebhookService = require('./services/tradingViewWebhookService');
app.use('/api/webhooks', tradingViewWebhookService.getRouter());

// Ferrari system status endpoint
app.get('/api/ferrari/status', (req, res) => {
  const stats = ferrariTradingSystem.getSystemStats();
  res.json({
    status: 'success',
    system: 'Ferrari Trading System v1.0',
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Ferrari system control endpoints
app.post('/api/ferrari/start', async (req, res) => {
  try {
    await ferrariTradingSystem.initialize();
    res.json({ status: 'success', message: 'Ferrari system started' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/ferrari/stop', async (req, res) => {
  try {
    await ferrariTradingSystem.shutdown();
    res.json({ status: 'success', message: 'Ferrari system stopped' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Initialize Ferrari system
let ferrariInitialized = false;

async function initializeFerrariSystem() {
  if (ferrariInitialized) return;
  
  try {
    console.log('🏎️ Initializing Ferrari Trading System...');
    console.log('🔥 Premium real-time signals loading...');
    
    await ferrariTradingSystem.initialize();
    ferrariInitialized = true;
    
    console.log('✅ 🏎️ FERRARI SYSTEM IS NOW LIVE!');
    console.log('📈 Monitoring 200+ symbols with real-time analysis');
    console.log('🎯 Quality gates: Strength ≥4.0, Risk/Reward ≥2.5:1');
    console.log('📱 Maximum 5 premium signals per user per day');
    console.log('⚡ Sub-10 second signal delivery');
    
  } catch (error) {
    console.error('❌ Ferrari system initialization failed:', error);
    console.log('🔄 Retrying in 30 seconds...');
    setTimeout(initializeFerrariSystem, 30000);
  }
}

// Initialize Ferrari system when server starts
setTimeout(initializeFerrariSystem, 5000); // Wait 5 seconds after server start

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏎️ Ferrari Trading System - Premium Real-Time Signals',
    version: '3.0.0-ferrari',
    system: 'Ferrari v1.0',
    features: [
      '🏎️ Ferrari-grade real-time analysis',
      '📊 Multi-timeframe signal confirmation', 
      '🎯 Quality gates (Strength ≥4.0, RR ≥2.5:1)',
      '📱 Smart rate limiting (5 premium signals/day)',
      '⚡ Sub-10 second signal delivery',
      '💎 200+ symbols monitored (stocks + crypto)',
      '🔥 Professional-grade trading platform'
    ],
    endpoints: {
      logos: '/logos/stocks/{SYMBOL}.png or /logos/crypto/{SYMBOL}.png',
      tradingTips: '/api/trading-tips',
      ferrariStatus: '/api/ferrari/status',
      ferrariControl: '/api/ferrari/{start|stop}',
      webhooks: '/api/webhooks/tradingview-webhook',
      health: '/health'
    },
    ferrariActive: ferrariInitialized,
    qualityGates: {
      minimumStrength: '4.0/5.0',
      minimumRiskReward: '2.5:1',
      maxDailySignals: 5,
      maxHourlySignals: 2
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  const stats = ferrariInitialized ? ferrariTradingSystem.getSystemStats() : {};
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ferrari: {
      active: ferrariInitialized,
      system: 'Ferrari Trading System v1.0',
      ...stats
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down Ferrari system gracefully...');
  if (ferrariInitialized) {
    await ferrariTradingSystem.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Ferrari system gracefully...');
  if (ferrariInitialized) {
    await ferrariTradingSystem.shutdown();
  }
  process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Ferrari system error:', err.stack);
  res.status(500).json({ error: err.message, system: 'Ferrari v1.0' });
});

module.exports = app; 