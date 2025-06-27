#!/usr/bin/env node

/**
 * 🏎️ Ferrari Trading System - Standalone Startup Script
 * 
 * This script starts the Ferrari system as a standalone service
 * Perfect for deployment on Railway, DigitalOcean, or Google Cloud
 */

console.log('🏎️ FERRARI TRADING SYSTEM - STARTING UP');
console.log('=========================================');

// Environment check
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY', 
  'FIREBASE_CLIENT_EMAIL',
  'ALPACA_API_KEY',
  'ALPACA_SECRET_KEY',
  'FINNHUB_API_KEY'
];

console.log('\n🔍 Environment Check:');
const missingVars = [];
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: Configured`);
  } else {
    console.log(`   ❌ ${envVar}: Missing`);
    missingVars.push(envVar);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n📖 Please check the deployment guide for configuration details.');
  process.exit(1);
}

// Import Ferrari system
const FerrariTradingSystem = require('./src/services/ferrariTradingSystem');
const express = require('express');

async function startFerrariSystem() {
  try {
    console.log('\n🏎️ Initializing Ferrari Trading System...');
    
    // Initialize Ferrari
    await FerrariTradingSystem.initialize();
    
    // Create health check server
    const app = express();
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      const stats = FerrariTradingSystem.getSystemStats();
      res.json({
        status: 'Ferrari System Active',
        system: 'Ferrari Trading System v1.0',
        ...stats,
        timestamp: new Date().toISOString()
      });
    });
    
    // Status endpoint
    app.get('/status', (req, res) => {
      res.json({
        status: '🏎️ Ferrari System Running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
    
    // Ferrari control endpoints
    app.post('/restart', async (req, res) => {
      try {
        console.log('🔄 Restarting Ferrari system...');
        await FerrariTradingSystem.shutdown();
        await FerrariTradingSystem.initialize();
        res.json({ status: 'success', message: 'Ferrari system restarted' });
      } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
      }
    });
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`\n✅ 🏎️ FERRARI SYSTEM IS LIVE!`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status: http://localhost:${PORT}/status`);
      console.log(`🔄 Restart: POST http://localhost:${PORT}/restart`);
      console.log('\n🎯 SYSTEM READY:');
      console.log('   📈 Monitoring 200+ symbols');
      console.log('   🎯 Quality gates: 4.0+ strength, 2.5:1+ R/R');
      console.log('   📱 Max 5 premium signals per user per day');
      console.log('   ⚡ Sub-10 second signal delivery');
      console.log('\n🏁 Ferrari Trading System is now delivering premium signals!');
    });
    
  } catch (error) {
    console.error('\n❌ Ferrari startup failed:', error);
    console.error('🔧 Check your environment variables and try again.');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Ferrari system gracefully...');
  try {
    await FerrariTradingSystem.shutdown();
    console.log('✅ Ferrari system stopped');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Ferrari system gracefully...');
  try {
    await FerrariTradingSystem.shutdown();
    console.log('✅ Ferrari system stopped');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the Ferrari system
startFerrariSystem(); 