import { FerrariTradingSystem } from './src/services/ferrariTradingSystem.js';
import firebaseConfig from './src/config/firebase.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

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
      this.logWithTimestamp('🚀 Ferrari Trading System starting...');
      this.logWithTimestamp('📊 Node.js version:', process.version);
      this.logWithTimestamp('🖥️  Platform:', process.platform);
      this.logWithTimestamp('🏗️  Architecture:', process.arch);
      this.logWithTimestamp('💾 Memory limit:', process.env.NODE_OPTIONS || 'default');

      // Set startup phase
      this.startupPhase = 'INITIALIZING';

      // Start HTTP server first
      this.startupPhase = 'HTTP_SERVER';
      this.logWithTimestamp('📡 Phase: Starting HTTP server...');
      await this.startHttpServer();

      // Start monitoring systems
      this.startMemoryMonitoring();
      this.startHeartbeat();

      // Initialize Firebase
      this.startupPhase = 'FIREBASE';
      this.logWithTimestamp('📡 Phase: Initializing Firebase...');
      await this.initializeFirebaseServices();

      // Setup graceful shutdown
      this.startupPhase = 'SHUTDOWN_HANDLERS';
      this.logWithTimestamp('📡 Phase: Setting up shutdown handlers...');
      this.setupGracefulShutdown();

      // Initialize Ferrari system
      this.startupPhase = 'FERRARI_SYSTEM';
      this.logWithTimestamp('📡 Phase: Initializing Ferrari system...');
      await this.initializeFerrariSystemAsync();

      // Mark as completed
      this.startupPhase = 'COMPLETED';
      const totalTime = Date.now() - this.startupStartTime;
      this.logWithTimestamp('⏱️ Total startup time:', totalTime, 'ms');

      // Railway-specific: Trigger initial health check
      if (this.isRailway) {
        this.logWithTimestamp('🚂 Railway detected - triggering self health check...');
        setTimeout(() => {
          this.triggerSelfHealthCheck();
        }, 2000);
        
        // Start Railway health check watchdog
        this.startRailwayWatchdog();
      }

      this.logWithTimestamp('✅ Ferrari Trading System ACTIVE');
      this.logWithTimestamp('🎯 Delivering only the best 5 signals per day per user');

    } catch (error) {
      this.logWithTimestamp('❌ Failed to start Ferrari Trading System:', error);
      this.logWithTimestamp('📊 Error stack:', error.stack);
      throw error;
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
      // Increment health check counter
      this.railwayHealthCheckCount++;
      
      const response = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        phase: this.startupPhase,
        ready: this.isReady
      };
      
      this.logWithTimestamp('🏥 Health check #' + this.railwayHealthCheckCount + ':', JSON.stringify(response));
      
      // Set proper headers for Railway
      res.set({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
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
    this.logWithTimestamp('📨 Received', signal, 'signal');
    this.logWithTimestamp('🛑 Initiating graceful shutdown (signal: ' + signal + ')');
    this.logWithTimestamp('🕐 Signal received at uptime:', process.uptime().toFixed(2), 'seconds');
    this.logWithTimestamp('🔍 Current phase:', this.startupPhase);
    this.logWithTimestamp('📊 Health checks received:', this.railwayHealthCheckCount);

    let shutdownSteps = [];

    try {
      // Stop memory monitoring
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
        shutdownSteps.push('Memory monitoring stopped');
        this.logWithTimestamp('🧠 Memory monitoring stopped');
      }

      // Stop HTTP server
      if (this.httpServer) {
        this.logWithTimestamp('🌐 Shutting down HTTP server...');
        await new Promise((resolve) => {
          this.httpServer.close(() => {
            shutdownSteps.push('HTTP server shutdown');
            this.logWithTimestamp('✅ HTTP server shutdown completed');
            resolve();
          });
        });
      }

      // Stop Ferrari system
      if (this.ferrariSystem) {
        this.logWithTimestamp('🏎️ Shutting down Ferrari Trading System...');
        await this.ferrariSystem.shutdown();
        shutdownSteps.push('Ferrari system shutdown');
        this.logWithTimestamp('✅ Ferrari system shutdown completed');
      }

      // Stop Firebase services
      if (this.firebaseServices) {
        this.logWithTimestamp('🔥 Shutting down Firebase services...');
        await this.firebaseServices.shutdown();
        shutdownSteps.push('Firebase shutdown');
        this.logWithTimestamp('✅ Firebase shutdown completed');
      }

      this.logWithTimestamp('🎯 Graceful shutdown completed successfully');
      this.logWithTimestamp('📋 Shutdown steps completed:', shutdownSteps.join(', '));

    } catch (error) {
      this.logWithTimestamp('❌ Error during graceful shutdown:', error);
    }

    // Force exit after a delay
    setTimeout(() => {
      this.logWithTimestamp('🔴 Force exit after graceful shutdown timeout');
      process.exit(0);
    }, 5000);
  }

  // Railway-specific: Trigger self health check to help Railway detect service
  triggerSelfHealthCheck() {
    try {
      // Simple approach - use dynamic import for http module
      import('http').then(({ default: http }) => {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/health',
          method: 'GET',
          timeout: 5000
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            this.logWithTimestamp('🚂 Self health check completed:', res.statusCode, data);
          });
        });

        req.on('error', (error) => {
          this.logWithTimestamp('🚂 Self health check failed:', error.message);
        });

        req.on('timeout', () => {
          this.logWithTimestamp('🚂 Self health check timeout');
          req.destroy();
        });

        req.setTimeout(5000);
        req.end();
      }).catch(error => {
        this.logWithTimestamp('🚂 Self health check import error:', error.message);
      });
      
    } catch (error) {
      this.logWithTimestamp('🚂 Self health check error:', error.message);
    }
  }

  // Railway health check watchdog - periodically trigger self health checks
  startRailwayWatchdog() {
    if (!this.isRailway) return;
    
    this.logWithTimestamp('🐕 Starting Railway health check watchdog...');
    
    // Trigger self health checks every 30 seconds to help Railway detect the service
    this.railwayWatchdogInterval = setInterval(() => {
      if (this.railwayHealthCheckCount === 0) {
        this.logWithTimestamp('🐕 Watchdog: No health checks received, triggering self check...');
        this.triggerSelfHealthCheck();
      } else {
        this.logWithTimestamp('🐕 Watchdog: Health checks working normally (' + this.railwayHealthCheckCount + ' received)');
      }
    }, 30000); // Every 30 seconds
  }
}

// Create and start the system
const manager = new FerrariSystemManager();
manager.start().catch(error => {
  console.error('💥 Failed to start Ferrari System Manager:', error);
  process.exit(1);
}); 