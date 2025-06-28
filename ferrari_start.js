#!/usr/bin/env node

/**
 * 🏎️ Ferrari Trading System - Standalone Startup Script
 * 
 * This script starts the Ferrari system as a standalone service
 * Perfect for deployment on Railway, DigitalOcean, or Google Cloud
 * 
 * Implements proper graceful shutdown for containerized environments
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

// Global state for graceful shutdown
let server;
let isShuttingDown = false;
const gracefulShutdownTimeout = 30000; // 30 seconds

async function startFerrariSystem() {
  try {
    console.log('\n🏎️ Initializing Ferrari Trading System...');
    
    // Initialize Ferrari
    await FerrariTradingSystem.initialize();
    
    // Create health check server
    const app = express();
    app.use(express.json());
    
    // Middleware to handle shutdown state
    app.use((req, res, next) => {
      if (isShuttingDown) {
        res.setHeader('Connection', 'close');
        return res.status(503).json({
          status: 'shutting_down',
          message: 'Ferrari system is shutting down gracefully'
        });
      }
      next();
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      if (isShuttingDown) {
        return res.status(503).json({
          status: 'shutting_down',
          message: 'Ferrari system is shutting down'
        });
      }
      
      const stats = FerrariTradingSystem.getSystemStats();
      res.json({
        status: 'healthy',
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
        version: '1.0.0',
        shuttingDown: isShuttingDown
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
    server = app.listen(PORT, () => {
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
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Ferrari startup failed:', error);
    console.error('🔧 Check your environment variables and try again.');
    process.exit(1);
  }
}

// Comprehensive graceful shutdown function
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`⚠️ ${signal} received again, forcing exit...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 ${signal} received - Starting graceful shutdown...`);
  
  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    console.log('⚠️ Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, gracefulShutdownTimeout);
  
  try {
    // Step 1: Stop accepting new requests
    if (server) {
      console.log('🔄 Closing HTTP server...');
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('❌ Error closing server:', err);
          } else {
            console.log('✅ HTTP server closed');
          }
          resolve();
        });
      });
    }
    
    // Step 2: Shutdown Ferrari trading system
    console.log('🔄 Shutting down Ferrari trading system...');
    await FerrariTradingSystem.shutdown();
    console.log('✅ Ferrari system stopped');
    
    // Step 3: Clean up any remaining resources
    console.log('🔄 Cleaning up resources...');
    
    // Clear the force exit timer
    clearTimeout(forceExitTimer);
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

// Signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Keep the process alive and handle any cleanup on exit
process.on('exit', (code) => {
  console.log(`🏁 Ferrari process exiting with code: ${code}`);
});

// Start the Ferrari system
startFerrariSystem(); 