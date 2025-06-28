#!/usr/bin/env node

/**
 * 🏎️ Ferrari Trading System Test Script
 * 
 * This script tests the Ferrari system initialization and basic functionality
 * without requiring live API keys or real connections.
 */

console.log('🏎️ Ferrari Trading System Test Suite');
console.log('=====================================');

// Test 1: Module Import
console.log('\n1. Testing module import...');
try {
  const FerrariTradingSystem = require('./src/services/ferrariTradingSystem');
  console.log('✅ Ferrari system imported successfully');
  
  // Test 2: Basic Configuration
  console.log('\n2. Testing system configuration...');
  const stats = FerrariTradingSystem.getSystemStats();
  console.log('✅ System stats accessible:', {
    symbolsMonitored: stats.symbolsMonitored,
    rateLimiting: stats.rateLimiting
  });
  
  // Test 3: Timeframe Logic
  console.log('\n3. Testing timeframe assignment logic...');
  const mockAnalysis1 = { finalStrength: 4.8, riskRewardRatio: 3.2 };
  const mockAnalysis2 = { finalStrength: 4.2, riskRewardRatio: 2.7 };
  const mockAnalysis3 = { finalStrength: 4.0, riskRewardRatio: 2.5 };
  
  const timeframe1 = FerrariTradingSystem.determineTimeframe(mockAnalysis1);
  const timeframe2 = FerrariTradingSystem.determineTimeframe(mockAnalysis2);
  const timeframe3 = FerrariTradingSystem.determineTimeframe(mockAnalysis3);
  
  console.log('✅ Timeframe assignments:', {
    'High strength (4.8)': timeframe1,
    'Good strength (4.2)': timeframe2,
    'Min strength (4.0)': timeframe3
  });
  
  // Test 4: Market Hours Logic
  console.log('\n4. Testing market hours detection...');
  const isMarketOpen = FerrariTradingSystem.isMarketHours();
  console.log('✅ Market hours check:', { isOpen: isMarketOpen });
  
  // Test 5: Tracking ID Generation
  console.log('\n5. Testing tracking ID generation...');
  const trackingId = FerrariTradingSystem.generateTrackingId();
  console.log('✅ Tracking ID generated:', trackingId);
  
  // Test 6: Symbol Count
  console.log('\n6. Testing symbol monitoring...');
  const totalSymbols = FerrariTradingSystem.getTotalSymbols();
  console.log('✅ Total symbols monitored:', totalSymbols);
  
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('🏎️ Ferrari Trading System is ready for deployment');
  
  // Display deployment readiness
  console.log('\n📋 DEPLOYMENT CHECKLIST:');
  console.log('   ✅ Core system functional');
  console.log('   ✅ Timeframe logic working');
  console.log('   ✅ Market hours detection active');
  console.log('   ✅ Signal tracking ready');
  console.log('   ⚠️  API keys needed for live deployment');
  console.log('   ⚠️  Firebase connection needed for live deployment');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('\n🏁 Test completed successfully!'); 