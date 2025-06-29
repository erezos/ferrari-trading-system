import { FerrariTradingSystem } from './src/services/ferrariTradingSystem.js';
import firebaseConfig from './src/config/firebase.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Ferrari Trading System - Production Startup
 * With comprehensive Railway logging and debugging
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
    this.memoryMonitorInterval = null;
    this.lastMemoryWarning = 0;
    this.heartbeatInterval = null;
    this.startupPhase = 'INITIALIZING';
    this.railwayHealthCheckCount = 0;
  }

  async start() {
    try {
      this.logWithTimestamp('🏎️ Ferrari Trading System v2.0 - Starting...');
      this.logWithTimestamp('📅 Started at:', new Date().toISOString());
      this.logWithTimestamp('🌍 Environment:', process.env.NODE_ENV || 'development');
      this.logWithTimestamp('🚀 Node.js version:', process.version);
      
      // Log all Railway environment variables for debugging
      if (this.isRailway) {
        this.logWithTimestamp('🚂 Running on Railway platform');
        this.logWithTimestamp('📦 Railway service:', process.env.RAILWAY_SERVICE_NAME || 'unknown');
        this.logWithTimestamp('🔧 Railway environment variables:');
        Object.keys(process.env).filter(key => key.startsWith('RAILWAY')).forEach(key => {
          this.logWithTimestamp(`   ${key}:`, process.env[key]);
        });
        
        // Log Node.js settings
        if (process.env.NODE_OPTIONS) {
          this.logWithTimestamp('🧠 Node options:', process.env.NODE_OPTIONS);
        }
      }

      // Log process information
      this.logWithTimestamp('🔍 Process information:');
      this.logWithTimestamp('   PID:', process.pid);
      this.logWithTimestamp('   Platform:', process.platform);
      this.logWithTimestamp('   Architecture:', process.arch);
      this.logWithTimestamp('   Memory limit:', process.env.NODE_OPTIONS || 'default');

      this.startupPhase = 'HTTP_SERVER';
      this.logWithTimestamp('📡 Phase: Starting HTTP server...');

      // Start memory monitoring for Railway
      this.startMemoryMonitoring();

      // Start heartbeat logging
      this.startHeartbeat();

      // Start HTTP server first for Railway health checks
      await this.startHttpServer();
      
      this.startupPhase = 'FIREBASE';
      this.logWithTimestamp('📡 Phase: Initializing Firebase...');
      
      // Initialize Firebase services
      await this.initializeFirebaseServices();
      
      this.startupPhase = 'SHUTDOWN_HANDLERS';
      this.logWithTimestamp('📡 Phase: Setting up shutdown handlers...');
      
      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
      
      this.startupPhase = 'FERRARI_SYSTEM';
      this.logWithTimestamp('📡 Phase: Initializing Ferrari system...');
      
      // Initialize Ferrari system (async, don't block health checks)
      this.initializeFerrariSystemAsync();
      
      this.startupPhase = 'COMPLETED';
      this.logWithTimestamp('✅ Ferrari Trading System successfully started!');
      this.logWithTimestamp('🎯 System ready for real-time signal generation');
      this.logWithTimestamp('⏱️ Total startup time:', Date.now() - this.startupStartTime, 'ms');
      
    } catch (error) {
      this.logWithTimestamp('❌ Failed to start Ferrari Trading System:', error);
      process.exit(1);
    }
  }

  logWithTimestamp(...args) {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime().toFixed(2);
    console.log(`[${timestamp}] [${uptime}s]`, ...args);
  }

  startHeartbeat() {
    this.logWithTimestamp('💓 Starting heartbeat monitoring...');
    
    // Log heartbeat every 60 seconds to show system is alive
    this.heartbeatInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
      
      this.logWithTimestamp('💓 HEARTBEAT - System alive');
      this.logWithTimestamp('   Phase:', this.startupPhase);
      this.logWithTimestamp('   Ready:', this.isReady);
      this.logWithTimestamp('   Memory:', memUsageMB, 'MB RSS');
      this.logWithTimestamp('   Health checks received:', this.railwayHealthCheckCount);
      
      if (this.ferrariSystem) {
        try {
          const stats = this.ferrariSystem.getSystemStats();
          this.logWithTimestamp('   Ferrari signals generated:', stats.signalsGenerated || 0);
          this.logWithTimestamp('   Ferrari symbols monitored:', stats.symbolsMonitored || 0);
        } catch (error) {
          this.logWithTimestamp('   Ferrari system error:', error.message);
        }
      }
      
    }, 60000); // Every 60 seconds
  }

  startMemoryMonitoring() {
    if (!this.isRailway) return;
    
    this.logWithTimestamp('🧠 Starting memory monitoring for Railway...');
    
    // Monitor memory every 30 seconds
    this.memoryMonitorInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      // Log memory usage every 5 minutes or if memory is high
      const now = Date.now();
      const memoryHigh = memUsageMB.rss > 800; // Above 800MB
      
      if (memoryHigh || (now - this.lastMemoryWarning) > 300000) { // 5 minutes
        this.logWithTimestamp('🧠 Memory usage:', memUsageMB, 'MB');
        
        if (memoryHigh) {
          this.logWithTimestamp('⚠️ High memory usage detected:', memUsageMB.rss, 'MB RSS');
          this.lastMemoryWarning = now;
          
          // Force garbage collection if available
          if (global.gc) {
            this.logWithTimestamp('🗑️ Running garbage collection...');
            global.gc();
          }
        }
        
        // Update last log time
        if (!memoryHigh) {
          this.lastMemoryWarning = now;
        }
      }
      
      // Emergency memory cleanup if approaching limits
      if (memUsageMB.rss > 1200) { // Above 1.2GB
        this.logWithTimestamp('🚨 Critical memory usage:', memUsageMB.rss, 'MB - initiating emergency cleanup');
        this.emergencyMemoryCleanup();
      }
      
    }, 30000); // Every 30 seconds
  }

  emergencyMemoryCleanup() {
    try {
      // Force garbage collection
      if (global.gc) {
        global.gc();
        this.logWithTimestamp('✅ Emergency garbage collection completed');
      }
      
      // Log memory after cleanup
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
      this.logWithTimestamp('🧠 Memory after cleanup:', memUsageMB, 'MB RSS');
      
    } catch (error) {
      this.logWithTimestamp('❌ Emergency memory cleanup failed:', error);
    }
  }

  async startHttpServer() {
    const port = process.env.PORT || 3000;
    
    // Configure CORS
    this.app.use(cors());
    this.app.use(express.json());
    
    // Log all incoming requests for debugging
    this.app.use((req, res, next) => {
      this.logWithTimestamp('📨 HTTP Request:', req.method, req.path, 'from', req.ip);
      if (req.path === '/health') {
        this.railwayHealthCheckCount++;
      }
      next();
    });

    // Railway health check - MUST be fast and simple
    this.app.get('/health', (req, res) => {
      const response = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        phase: this.startupPhase,
        ready: this.isReady
      };
      
      this.logWithTimestamp('🏥 Health check response:', JSON.stringify(response));
      res.status(200).json(response);
    });

    // Detailed health check for monitoring
    this.app.get('/healthz', (req, res) => {
      const uptime = process.uptime();
      const startupTime = Date.now() - this.startupStartTime;
      const memUsage = process.memoryUsage();
      
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${uptime.toFixed(2)}s`,
        startupTime: `${startupTime}ms`,
        system: 'ferrari_trading_system',
        version: '2.0.0',
        railway: !!this.isRailway,
        ready: this.isReady,
        phase: this.startupPhase,
        healthCheckCount: this.railwayHealthCheckCount,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        }
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
        res.status(200).json({ 
          ready: true, 
          timestamp: new Date().toISOString(),
          phase: this.startupPhase
        });
      } else {
        res.status(503).json({ 
          ready: false, 
          initializing: true,
          phase: this.startupPhase
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ferrari Trading System v2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        phase: this.startupPhase,
        ready: this.isReady,
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
        const memUsage = process.memoryUsage();
        const status = {
          service: 'Ferrari Trading System v2.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          ready: this.isReady,
          phase: this.startupPhase,
          healthCheckCount: this.railwayHealthCheckCount,
          environment: {
            node: process.version,
            platform: process.platform,
            railway: !!this.isRailway,
            env: process.env.NODE_ENV || 'development',
            port: port
          },
          memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
          },
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
          this.logWithTimestamp('❌ HTTP server failed to start:', error);
          reject(error);
        } else {
          this.logWithTimestamp('🌐 HTTP server running on port', port);
          this.logWithTimestamp('🏥 Health check: http://localhost:' + port + '/health');
          this.logWithTimestamp('📊 Status endpoint: http://localhost:' + port + '/status');
          resolve();
        }
      });

      // Log server errors
      this.httpServer.on('error', (error) => {
        this.logWithTimestamp('🚨 HTTP server error:', error);
      });

      // Log when server starts listening
      this.httpServer.on('listening', () => {
        this.logWithTimestamp('👂 HTTP server is now listening on port', port);
      });
    });
  }

  async initializeFirebaseServices() {
    this.logWithTimestamp('🔥 Initializing Firebase services...');
    
    try {
      this.firebaseServices = await firebaseConfig.initialize();
      this.logWithTimestamp('✅ Firebase services ready');
    } catch (error) {
      this.logWithTimestamp('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async initializeFerrariSystemAsync() {
    try {
      this.logWithTimestamp('🏎️ Initializing Ferrari Trading System...');
      
      // Create Ferrari system
      this.ferrariSystem = new FerrariTradingSystem(this.firebaseServices);
      
      // Initialize the system
      await this.ferrariSystem.initialize();
      
      this.isReady = true;
      this.logWithTimestamp('🏎️ Ferrari Trading System fully operational');
      
      // Log environment validation
      this.validateEnvironment();
      
    } catch (error) {
      this.logWithTimestamp('❌ Ferrari system initialization failed:', error);
      // Don't exit - let health checks continue to work
      // The system can retry initialization
    }
  }

  validateEnvironment() {
    this.logWithTimestamp('🔍 Validating environment configuration...');
    
    const requiredEnvVars = [
      'ALPACA_API_KEY',
      'ALPACA_SECRET_KEY', 
      'FINNHUB_API_KEY',
      'BINANCE_API_KEY',
      'BINANCE_SECRET_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logWithTimestamp('⚠️ Missing environment variables:', missingVars);
    } else {
      this.logWithTimestamp('✅ All API keys configured');
    }
    
    if (this.isRailway) {
      this.logWithTimestamp('🚂 Running on Railway platform');
      this.logWithTimestamp('📦 Railway service:', process.env.RAILWAY_SERVICE_NAME || 'trading-tips-system');
    }
    
    this.logWithTimestamp('✅ Environment validation completed');
  }

  setupGracefulShutdown() {
    this.logWithTimestamp('🛡️ Setting up graceful shutdown handlers...');
    
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        this.logWithTimestamp(`📨 Received ${signal} signal`);
        this.logWithTimestamp('🕐 Signal received at uptime:', process.uptime().toFixed(2), 'seconds');
        this.logWithTimestamp('🔍 Current phase:', this.startupPhase);
        this.logWithTimestamp('✅ System ready status:', this.isReady);
        this.gracefulShutdown(signal);
      });
    });
    
    process.on('uncaughtException', (error) => {
      this.logWithTimestamp('💥 Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logWithTimestamp('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });
    
    this.logWithTimestamp('✅ Graceful shutdown handlers configured');
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      this.logWithTimestamp('⏳ Shutdown already in progress...');
      return;
    }
    
    this.isShuttingDown = true;
    this.logWithTimestamp(`🛑 Initiating graceful shutdown (signal: ${signal})`);
    this.logWithTimestamp('⏱️ System uptime at shutdown:', process.uptime().toFixed(2), 'seconds');
    this.logWithTimestamp('📊 Health checks received:', this.railwayHealthCheckCount);
    
    // Set a maximum shutdown time
    this.shutdownTimeout = setTimeout(() => {
      this.logWithTimestamp('⏰ Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 25000); // 25 seconds to allow Railway's 30-second limit
    
    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.logWithTimestamp('💓 Heartbeat monitoring stopped');
      }
      
      // Stop memory monitoring
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.logWithTimestamp('🧠 Memory monitoring stopped');
      }
      
      // Shutdown HTTP server first
      if (this.httpServer) {
        this.logWithTimestamp('🌐 Shutting down HTTP server...');
        await new Promise((resolve) => {
          this.httpServer.close(() => {
            this.logWithTimestamp('✅ HTTP server shutdown completed');
            resolve();
          });
        });
      }
      
      // Shutdown Ferrari system
      if (this.ferrariSystem) {
        this.logWithTimestamp('🏎️ Shutting down Ferrari Trading System...');
        await this.ferrariSystem.shutdown();
        this.logWithTimestamp('✅ Ferrari system shutdown completed');
      }
      
      // Shutdown Firebase services
      if (this.firebaseServices) {
        this.logWithTimestamp('🔥 Shutting down Firebase services...');
        await firebaseConfig.shutdown();
        this.logWithTimestamp('✅ Firebase shutdown completed');
      }
      
      // Clear the timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      this.logWithTimestamp('🎯 Graceful shutdown completed successfully');
      process.exit(0);
      
    } catch (error) {
      this.logWithTimestamp('❌ Error during graceful shutdown:', error);
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