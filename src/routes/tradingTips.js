const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firebase if not already done
let db;
try {
  db = admin.firestore();
} catch (error) {
  console.log('Firebase not initialized in routes, using test mode');
}

// Get latest Ferrari trading tips
router.get('/', async (req, res) => {
  try {
    const { limit = 20, timeframe, symbol } = req.query;
    
    if (!db) {
      return res.json({
        status: 'success',
        message: 'Ferrari Trading Tips API - Test Mode',
        tips: [],
        system: 'Ferrari v1.0',
        testMode: true
      });
    }

    let query = db.collection('trading_tips')
      .where('isFerrariSignal', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    // Filter by timeframe if specified
    if (timeframe) {
      query = query.where('timeframe', '==', timeframe);
    }

    // Filter by symbol if specified
    if (symbol) {
      query = query.where('symbol', '==', symbol.toUpperCase());
    }

    const snapshot = await query.get();
    const tips = [];

    snapshot.forEach(doc => {
      tips.push({
        id: doc.id,
        ...doc.data(),
        isFerrariSignal: true
      });
    });

    res.json({
      status: 'success',
      tips,
      count: tips.length,
      system: 'Ferrari v1.0',
      filters: { timeframe, symbol, limit }
    });

  } catch (error) {
    console.error('Error fetching Ferrari tips:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      system: 'Ferrari v1.0'
    });
  }
});

// Get Ferrari system statistics
router.get('/stats', async (req, res) => {
  try {
    if (!db) {
      return res.json({
        status: 'success',
        stats: {
          totalSignals: 0,
          todaySignals: 0,
          avgStrength: 0,
          successRate: 0
        },
        system: 'Ferrari v1.0',
        testMode: true
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's Ferrari signals
    const todaySnapshot = await db.collection('trading_tips')
      .where('isFerrariSignal', '==', true)
      .where('createdAt', '>=', today)
      .get();

    // Get total Ferrari signals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalSnapshot = await db.collection('trading_tips')
      .where('isFerrariSignal', '==', true)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    // Calculate statistics
    let totalStrength = 0;
    let strengthCount = 0;

    totalSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.strength) {
        totalStrength += data.strength;
        strengthCount++;
      }
    });

    const avgStrength = strengthCount > 0 ? totalStrength / strengthCount : 0;

    res.json({
      status: 'success',
      stats: {
        totalSignals: totalSnapshot.size,
        todaySignals: todaySnapshot.size,
        avgStrength: Math.round(avgStrength * 100) / 100,
        last30Days: totalSnapshot.size,
        qualityGate: 'Strength ≥4.0, R/R ≥2.5:1'
      },
      system: 'Ferrari v1.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Ferrari stats:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      system: 'Ferrari v1.0'
    });
  }
});

// Get Ferrari tips by symbol
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;

    if (!db) {
      return res.json({
        status: 'success',
        symbol: symbol.toUpperCase(),
        tips: [],
        system: 'Ferrari v1.0',
        testMode: true
      });
    }

    const snapshot = await db.collection('trading_tips')
      .where('isFerrariSignal', '==', true)
      .where('symbol', '==', symbol.toUpperCase())
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const tips = [];
    snapshot.forEach(doc => {
      tips.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      tips,
      count: tips.length,
      system: 'Ferrari v1.0'
    });

  } catch (error) {
    console.error('Error fetching symbol tips:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      system: 'Ferrari v1.0'
    });
  }
});

// Health check for trading tips API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Ferrari Trading Tips API',
    system: 'Ferrari v1.0',
    features: [
      'Real-time signal generation',
      'Multi-timeframe analysis', 
      'Quality gates (4.0+ strength)',
      'Smart rate limiting',
      'Professional risk management'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 