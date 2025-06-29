#!/usr/bin/env node

/**
 * Railway Health Check Test Script
 * Tests all health endpoints and Railway compatibility
 */

const http = require('http');

const BASE_URL = process.env.RAILWAY_URL || 'http://localhost:3000';
const ENDPOINTS = [
  '/health',
  '/healthz', 
  '/ready',
  '/status',
  '/'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = BASE_URL + endpoint;
    const startTime = Date.now();
    
    console.log(`🧪 Testing ${endpoint}...`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${endpoint}: ${res.statusCode} (${responseTime}ms)`);
          console.log(`   Status: ${parsed.status || parsed.service || 'unknown'}`);
          if (parsed.ready !== undefined) console.log(`   Ready: ${parsed.ready}`);
          if (parsed.phase) console.log(`   Phase: ${parsed.phase}`);
          if (parsed.uptime) console.log(`   Uptime: ${parsed.uptime}s`);
          
          resolve({
            endpoint,
            success: true,
            statusCode: res.statusCode,
            responseTime,
            data: parsed
          });
        } catch (error) {
          console.log(`✅ ${endpoint}: ${res.statusCode} (${responseTime}ms) - Non-JSON response`);
          resolve({
            endpoint,
            success: true,
            statusCode: res.statusCode,
            responseTime,
            data: data.substring(0, 100)
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${endpoint}: Error (${responseTime}ms) - ${error.message}`);
      resolve({
        endpoint,
        success: false,
        error: error.message,
        responseTime
      });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${endpoint}: Timeout`);
      req.destroy();
      resolve({
        endpoint,
        success: false,
        error: 'Timeout',
        responseTime: 10000
      });
    });
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Railway Health Check Tests');
  console.log('📍 Base URL:', BASE_URL);
  console.log('');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success && r.statusCode === 200);
  const failed = results.filter(r => !r.success || r.statusCode !== 200);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  const healthResult = results.find(r => r.endpoint === '/health');
  if (healthResult && healthResult.success) {
    console.log('\n🏥 Health Check Analysis:');
    console.log(`   Response time: ${healthResult.responseTime}ms`);
    console.log(`   Ready for Railway: ${healthResult.responseTime < 5000 ? 'YES' : 'NO'}`);
  }
}

if (require.main === module) {
  main();
}
