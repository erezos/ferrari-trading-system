#!/usr/bin/env node

/**
 * Simple health check test for Railway deployment
 * This script tests the health endpoints to ensure they're working correctly
 */

import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          path,
          status: res.statusCode,
          expected: expectedStatus,
          success: res.statusCode === expectedStatus,
          data: data
        };
        resolve(result);
      });
    });

    req.on('error', (error) => {
      reject({ path, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ path, error: 'Request timeout' });
    });

    req.end();
  });
}

async function runHealthTests() {
  console.log('🔍 Testing Railway health endpoints...');
  console.log(`📡 Target: http://${HOST}:${PORT}`);
  console.log('');

  const endpoints = [
    { path: '/health', expectedStatus: 200 },
    { path: '/healthz', expectedStatus: 200 },
    { path: '/ready', expectedStatus: 200 }, // May be 503 if not ready
    { path: '/status', expectedStatus: 200 },
    { path: '/', expectedStatus: 200 }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.path}...`);
      const result = await testEndpoint(endpoint.path, endpoint.expectedStatus);
      
      if (result.success) {
        console.log(`✅ ${endpoint.path} - Status: ${result.status}`);
        
        // Parse and log key information
        try {
          const parsed = JSON.parse(result.data);
          if (parsed.status) console.log(`   Status: ${parsed.status}`);
          if (parsed.phase) console.log(`   Phase: ${parsed.phase}`);
          if (parsed.ready !== undefined) console.log(`   Ready: ${parsed.ready}`);
          if (parsed.uptime) console.log(`   Uptime: ${parsed.uptime}`);
        } catch (e) {
          // Not JSON, that's okay
          console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${endpoint.path} - Status: ${result.status} (expected: ${endpoint.expectedStatus})`);
      }
      
    } catch (error) {
      console.log(`💥 ${endpoint.path} - Error: ${error.error}`);
    }
    
    console.log('');
  }

  console.log('🏁 Health check tests completed');
}

// Run the tests
runHealthTests().catch(error => {
  console.error('💥 Health test failed:', error);
  process.exit(1);
}); 