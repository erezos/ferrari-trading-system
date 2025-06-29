import { FerrariTradingSystem } from './src/services/ferrariTradingSystem.js';
import firebaseConfig from './src/config/firebase.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Ferrari Trading System - Production Startup
 * With HTTP health checks for Railway deployment
 */

class FerrariSystemManager {
  constructor() {
    this.ferrariSystem = null;
    this.isShuttingDown = false;
    this.shutdownTimeout = null;
    this.firebaseServices = null;
    this.httpServer = null;
    this.app = express();
  }

  async start() {
    try {
      console.log('🏎️ Ferrari Trading System v2.0 - Starting...');
      console.log('📅 Started at:', new Date().toISOString());
      console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
      console.log('🚀 Node.js version:', process.version);
      
      // Start HTTP server first for Railway health checks
      await this.startHttpServer();
      
      // Initialize Firebase
      console.log('🔥 Initializing Firebase services...');
      this.firebaseServices = await firebaseConfig.initialize();
      
      if (this.firebaseServices.isReady) {
        console.log('✅ Firebase services ready');
      } else {
        console.log('⚠️ Running in test mode - Firebase disabled');
      }
      
      // Validate environment variables
      await this.validateEnvironment();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      // Initialize Ferrari system with Firebase services
      this.ferrariSystem = new FerrariTradingSystem(this.firebaseServices);
      await this.ferrariSystem.initialize();
      
      console.log('✅ Ferrari Trading System successfully started!');
      console.log('🎯 System ready for real-time signal generation');
      
      // Keep process alive
      this.keepAlive();
      
    } catch (error) {
      console.error('💥 Failed to start Ferrari system:', error);
      process.exit(1);
    }
  }

  async startHttpServer() {
    const port = process.env.PORT || 3000;
    
    // Configure CORS
    this.app.use(cors());
    this.app.use(express.json());
    
    // Health check endpoint for Railway
    this.app.get('/health', (req, res) => {
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: 'ferrari_trading_system',
        version: '2.0.0'
      };
      
      if (this.ferrariSystem) {
        try {
          const systemStats = this.ferrariSystem.getSystemStats();
          status.ferrari = {
            active: true,
            symbolsMonitored: systemStats.symbolsMonitored,
            connectedFeeds: Object.keys(systemStats.connectedFeeds).length,
            signalsGenerated: systemStats.signalsGenerated
          };
        } catch (error) {
          status.ferrari = { active: false, error: 'Stats unavailable' };
        }
      }
      
      res.json(status);
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Ferrari Trading System',
        version: '2.0.0',
        status: 'operational',
        description: 'Real-time institutional-grade trading signals',
        endpoints: {
          health: '/health',
          status: '/status'
        }
      });
    });
    
    // Status endpoint with detailed system info
    this.app.get('/status', (req, res) => {
      const status = {
        system: 'Ferrari Trading System',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        firebase: this.firebaseServices?.isReady ? 'connected' : 'test_mode',
        trading: {
          active: !!this.ferrariSystem,
          symbolsMonitored: 73,
          qualityGates: {
            minimumStrength: 4.0,
            minimumRiskReward: 2.5,
            maxDailyTips: 5
          }
        }
      };
      
      if (this.ferrariSystem) {
        try {
          const systemStats = this.ferrariSystem.getSystemStats();
          status.trading = {
            ...status.trading,
            ...systemStats
          };
        } catch (error) {
          status.trading.error = 'Stats unavailable';
        }
      }
      
      res.json(status);
    });
    
    // Start HTTP server
    return new Promise((resolve, reject) => {
      this.httpServer = this.app.listen(port, '0.0.0.0', (err) => {
        if (err) {
          console.error('❌ Failed to start HTTP server:', err);
          reject(err);
        } else {
          console.log(`🌐 HTTP server running on port ${port}`);
          console.log(`🏥 Health check: http://localhost:${port}/health`);
          console.log(`📊 Status endpoint: http://localhost:${port}/status`);
          resolve();
        }
      });
    });
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    // Check API keys for data feeds
    const apiKeys = {
      'Alpaca API Key': process.env.ALPACA_API_KEY,
      'Alpaca Secret': process.env.ALPACA_SECRET_KEY,
      'Finnhub API Key': process.env.FINNHUB_API_KEY
    };
    
    const missingKeys = Object.entries(apiKeys)
      .filter(([name, value]) => !value)
      .map(([name]) => name);
    
    if (missingKeys.length > 0) {
      console.warn('⚠️ Missing API keys (will affect data feeds):', missingKeys.join(', '));
    } else {
      console.log('✅ All API keys configured');
    }
    
    // Railway-specific checks
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('🚂 Running on Railway platform');
      console.log('📦 Railway service:', process.env.RAILWAY_SERVICE_NAME || 'unknown');
    }
    
    console.log('✅ Environment validation completed');
  }

  setupGracefulShutdown() {
    console.log('🛡️ Setting up graceful shutdown handlers...');
    
    // Handle SIGTERM (Railway sends this)
    process.on('SIGTERM', () => {
      console.log('📨 Received SIGTERM signal');
      this.gracefulShutdown('SIGTERM');
    });
    
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('📨 Received SIGINT signal');
      this.gracefulShutdown('SIGINT');
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });
    
    console.log('✅ Graceful shutdown handlers configured');
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      console.log('🔄 Shutdown already in progress...');
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`🛑 Initiating graceful shutdown (signal: ${signal})`);
    
    // Set shutdown timeout (Railway gives us 30 seconds)
    this.shutdownTimeout = setTimeout(() => {
      console.error('⏰ Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 25000); // 25 seconds to be safe
    
    try {
      // Shutdown HTTP server first
      if (this.httpServer) {
        console.log('🌐 Shutting down HTTP server...');
        await new Promise((resolve) => {
          this.httpServer.close(resolve);
        });
        console.log('✅ HTTP server shutdown completed');
      }
      
      // Shutdown Ferrari system
      if (this.ferrariSystem) {
        console.log('🏎️ Shutting down Ferrari Trading System...');
        await this.ferrariSystem.shutdown();
        console.log('✅ Ferrari system shutdown completed');
      }
      
      // Shutdown Firebase services
      if (this.firebaseServices && this.firebaseServices.isReady) {
        console.log('🔥 Shutting down Firebase services...');
        await firebaseConfig.shutdown();
        console.log('✅ Firebase shutdown completed');
      }
      
      // Clear timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      console.log('🎯 Graceful shutdown completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      process.exit(1);
    }
  }

  keepAlive() {
    // Keep the process alive with minimal resource usage
    const keepAliveInterval = setInterval(() => {
      if (this.isShuttingDown) {
        clearInterval(keepAliveInterval);
        return;
      }
      
      // Log system status every 5 minutes
      if (Date.now() % 300000 < 1000) { // Roughly every 5 minutes
        console.log('💓 Ferrari system heartbeat - System operational');
        
        // Log system stats
        if (this.ferrariSystem) {
          try {
            const stats = this.ferrariSystem.getSystemStats();
            console.log('📊 System stats:', {
              symbolsMonitored: stats.symbolsMonitored,
              connectedFeeds: Object.keys(stats.connectedFeeds).length,
              uptime: Math.round(stats.uptime / 60) + ' minutes',
              signalsGenerated: stats.signalsGenerated
            });
          } catch (error) {
            console.log('📊 System stats: unavailable');
          }
        }
      }
    }, 1000);
    
    // Cleanup interval on shutdown
    process.on('exit', () => {
      clearInterval(keepAliveInterval);
    });
  }
}

// Start the Ferrari system
const manager = new FerrariSystemManager();
manager.start().catch(error => {
  console.error('💥 Critical startup error:', error);
  process.exit(1);
}); 