import { FerrariTradingSystem } from './src/services/ferrariTradingSystem.js';
import firebaseConfig from './src/config/firebase.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Ferrari Trading System - Production Startup
 * With Railway-optimized health checks
 */

class FerrariSystemManager {
  constructor() {
    this.ferrariSystem = null;
    this.isShuttingDown = false;
    this.shutdownTimeout = null;
    this.firebaseServices = null;
    this.httpServer = null;
    this.app = express();
    this.isReady = false;
  }

  async start() {
    try {
      console.log('🏎️ Ferrari Trading System v2.0 - Starting...');
      console.log('📅 Started at:', new Date().toISOString());
      console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
      console.log('🚀 Node.js version:', process.version);
      
      // Start HTTP server FIRST for Railway health checks
      await this.startHttpServer();
      
      // Initialize Firebase (async, don't block health checks)
      this.initializeFirebaseAsync();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      // Mark as ready for basic health checks
      this.isReady = true;
      
      console.log('✅ Ferrari Trading System successfully started!');
      console.log('🎯 System ready for real-time signal generation');
      
      // Keep process alive
      this.keepAlive();
      
    } catch (error) {
      console.error('💥 Failed to start Ferrari system:', error);
      process.exit(1);
    }
  }

  async initializeFirebaseAsync() {
    try {
      console.log('🔥 Initializing Firebase services...');
      this.firebaseServices = await firebaseConfig.initialize();
      
      if (this.firebaseServices.isReady) {
        console.log('✅ Firebase services ready');
        
        // Now initialize Ferrari system
        this.ferrariSystem = new FerrariTradingSystem(this.firebaseServices);
        await this.ferrariSystem.initialize();
        console.log('🏎️ Ferrari Trading System fully operational');
      } else {
        console.log('⚠️ Running in test mode - Firebase disabled');
      }
      
      // Validate environment variables
      await this.validateEnvironment();
      
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      // Don't exit - continue with limited functionality
    }
  }

  async startHttpServer() {
    const port = process.env.PORT || 3000;
    
    // Configure middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '1mb' }));
    
    // Railway health check endpoint - MUST be fast and simple
    this.app.get('/health', (req, res) => {
      // Railway expects a 200 OK response quickly
      res.status(200).send('OK');
    });
    
    // Alternative health check endpoints
    this.app.get('/healthz', (req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        ready: this.isReady,
        timestamp: new Date().toISOString()
      });
    });
    
    this.app.get('/ready', (req, res) => {
      if (this.isReady) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
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
          healthz: '/healthz',
          ready: '/ready',
          status: '/status'
        }
      });
    });
    
    // Detailed status endpoint
    this.app.get('/status', (req, res) => {
      const status = {
        system: 'Ferrari Trading System',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        ready: this.isReady,
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        firebase: this.firebaseServices?.isReady ? 'connected' : 'initializing',
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
    
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('HTTP Error:', err);
      res.status(500).json({ error: 'Internal server error' });
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
      
      // Handle server errors
      this.httpServer.on('error', (err) => {
        console.error('HTTP Server Error:', err);
        reject(err);
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
      // Shutdown Ferrari system first
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
      
      // Shutdown HTTP server last
      if (this.httpServer) {
        console.log('🌐 Shutting down HTTP server...');
        await new Promise((resolve) => {
          this.httpServer.close(resolve);
        });
        console.log('✅ HTTP server shutdown completed');
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