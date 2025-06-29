import { FerrariTradingSystem } from './src/services/ferrariTradingSystem.js';
import firebaseConfig from './src/config/firebase.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Ferrari Trading System - Production Startup
 * With Railway-optimized health checks and startup sequence
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
    this.startupStartTime = Date.now();
    this.isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  }

  async start() {
    try {
      console.log('🏎️ Ferrari Trading System v2.0 - Starting...');
      console.log('📅 Started at:', new Date().toISOString());
      console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
      console.log('🚀 Node.js version:', process.version);
      
      if (this.isRailway) {
        console.log('🚂 Running on Railway platform');
        console.log('📦 Railway service:', process.env.RAILWAY_SERVICE_NAME || 'unknown');
      }

      // Start HTTP server first for Railway health checks
      await this.startHttpServer();
      
      // Initialize Firebase services
      await this.initializeFirebaseServices();
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      // Initialize Ferrari system (async, don't block health checks)
      this.initializeFerrariSystemAsync();
      
      console.log('✅ Ferrari Trading System successfully started!');
      console.log('🎯 System ready for real-time signal generation');
      
    } catch (error) {
      console.error('❌ Failed to start Ferrari Trading System:', error);
      process.exit(1);
    }
  }

  async startHttpServer() {
    const port = process.env.PORT || 3000;
    
    // Configure CORS
    this.app.use(cors());
    this.app.use(express.json());
    
    // Railway health check - MUST be fast and simple
    this.app.get('/health', (req, res) => {
      // Always return OK for Railway health checks
      res.status(200).send('OK');
    });

    // Detailed health check for monitoring
    this.app.get('/healthz', (req, res) => {
      const uptime = process.uptime();
      const startupTime = Date.now() - this.startupStartTime;
      
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${uptime.toFixed(2)}s`,
        startupTime: `${startupTime}ms`,
        system: 'ferrari_trading_system',
        version: '2.0.0',
        railway: !!this.isRailway,
        ready: this.isReady
      };
      
      if (this.ferrariSystem) {
        try {
          const systemStats = this.ferrariSystem.getSystemStats();
          status.ferrari = {
            active: true,
            symbolsMonitored: systemStats.symbolsMonitored,
            connectedFeeds: Object.keys(systemStats.connectedFeeds).length,
            signalsGenerated: systemStats.signalsGenerated,
            lastHeartbeat: systemStats.lastHeartbeat
          };
        } catch (error) {
          status.ferrari = { 
            active: false, 
            error: error.message,
            initializing: !this.isReady
          };
        }
      } else {
        status.ferrari = { 
          active: false, 
          initializing: true 
        };
      }
      
      res.json(status);
    });

    // Ready check for Railway
    this.app.get('/ready', (req, res) => {
      if (this.isReady && this.ferrariSystem) {
        res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
      } else {
        res.status(503).json({ ready: false, initializing: true });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ferrari Trading System v2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          detailed: '/healthz', 
          ready: '/ready',
          status: '/status'
        }
      });
    });

    // Status endpoint with comprehensive information
    this.app.get('/status', async (req, res) => {
      try {
        const status = {
          service: 'Ferrari Trading System v2.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          ready: this.isReady,
          environment: {
            node: process.version,
            platform: process.platform,
            railway: !!this.isRailway,
            env: process.env.NODE_ENV || 'development'
          },
          memory: process.memoryUsage(),
          firebase: {
            initialized: !!this.firebaseServices,
            ready: !!this.firebaseServices
          }
        };

        if (this.ferrariSystem) {
          const systemStats = this.ferrariSystem.getSystemStats();
          status.ferrari = systemStats;
        }

        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get status',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Start server
    return new Promise((resolve, reject) => {
      this.httpServer = this.app.listen(port, '0.0.0.0', (error) => {
        if (error) {
          reject(error);
        } else {
          console.log('🌐 HTTP server running on port', port);
          console.log('🏥 Health check: http://localhost:' + port + '/health');
          console.log('📊 Status endpoint: http://localhost:' + port + '/status');
          resolve();
        }
      });
    });
  }

  async initializeFirebaseServices() {
    console.log('🔥 Initializing Firebase services...');
    
    try {
      this.firebaseServices = await firebaseConfig.initialize();
      console.log('✅ Firebase services ready');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async initializeFerrariSystemAsync() {
    try {
      console.log('🏎️ Initializing Ferrari Trading System...');
      
      // Create Ferrari system
      this.ferrariSystem = new FerrariTradingSystem(this.firebaseServices);
      
      // Initialize the system
      await this.ferrariSystem.initialize();
      
      this.isReady = true;
      console.log('🏎️ Ferrari Trading System fully operational');
      
      // Log environment validation
      this.validateEnvironment();
      
    } catch (error) {
      console.error('❌ Ferrari system initialization failed:', error);
      // Don't exit - let health checks continue to work
      // The system can retry initialization
    }
  }

  validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    const requiredEnvVars = [
      'ALPACA_API_KEY',
      'ALPACA_SECRET_KEY', 
      'FINNHUB_API_KEY',
      'BINANCE_API_KEY',
      'BINANCE_SECRET_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingVars);
    } else {
      console.log('✅ All API keys configured');
    }
    
    if (this.isRailway) {
      console.log('🚂 Running on Railway platform');
      console.log('📦 Railway service:', process.env.RAILWAY_SERVICE_NAME || 'trading-tips-system');
    }
    
    console.log('✅ Environment validation completed');
  }

  setupGracefulShutdown() {
    console.log('🛡️ Setting up graceful shutdown handlers...');
    
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`📨 Received ${signal} signal`);
        this.gracefulShutdown(signal);
      });
    });
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });
    
    console.log('✅ Graceful shutdown handlers configured');
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      console.log('⏳ Shutdown already in progress...');
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`🛑 Initiating graceful shutdown (signal: ${signal})`);
    
    // Set a maximum shutdown time
    this.shutdownTimeout = setTimeout(() => {
      console.log('⏰ Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 25000); // 25 seconds to allow Railway's 30-second limit
    
    try {
      // Shutdown HTTP server first
      if (this.httpServer) {
        console.log('🌐 Shutting down HTTP server...');
        await new Promise((resolve) => {
          this.httpServer.close(() => {
            console.log('✅ HTTP server shutdown completed');
            resolve();
          });
        });
      }
      
      // Shutdown Ferrari system
      if (this.ferrariSystem) {
        console.log('🏎️ Shutting down Ferrari Trading System...');
        await this.ferrariSystem.shutdown();
        console.log('✅ Ferrari system shutdown completed');
      }
      
      // Shutdown Firebase services
      if (this.firebaseServices) {
        console.log('🔥 Shutting down Firebase services...');
        await firebaseConfig.shutdown();
        console.log('✅ Firebase shutdown completed');
      }
      
      // Clear the timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      console.log('🎯 Graceful shutdown completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start the system
const manager = new FerrariSystemManager();
manager.start().catch(error => {
  console.error('💥 Failed to start Ferrari System Manager:', error);
  process.exit(1);
}); 