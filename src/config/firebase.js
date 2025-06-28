const admin = require('firebase-admin');
require('dotenv').config();

let app, db, messaging;

// Initialize Firebase Admin SDK with comprehensive error handling
function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      app = admin.app();
      db = admin.firestore();
      messaging = admin.messaging();
      return true;
    }
    
    // Method 1: Try with individual environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔧 Attempting Firebase init with individual env vars...');
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Handle different private key formats
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('🔧 Converted literal \\n to newlines');
      }
      
      // Validate private key format
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key missing BEGIN marker');
      }
      
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Private key missing END marker');
      }

      const firebaseConfig = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      };

      if (process.env.FIREBASE_STORAGE_BUCKET) {
        firebaseConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      }

      app = admin.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized with individual env vars');
    }
    
    // Method 2: Try with base64 encoded full credentials
    else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      console.log('🔧 Attempting Firebase init with base64 credentials...');
      
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString('utf-8')
      );

      const firebaseConfig = {
        credential: admin.credential.cert(credentials)
      };

      if (credentials.project_id) {
        firebaseConfig.projectId = credentials.project_id;
      }

      app = admin.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized with base64 credentials');
    }
    
    // Method 3: Try with JSON string credentials
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔧 Attempting Firebase init with JSON credentials...');
      
      const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      const firebaseConfig = {
        credential: admin.credential.cert(credentials)
      };

      app = admin.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized with JSON credentials');
    }
    
    else {
      throw new Error('No Firebase credentials found in environment variables');
    }
    
    // Initialize services
    db = admin.firestore();
    messaging = admin.messaging();
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('📊 Project:', app.options.projectId || process.env.FIREBASE_PROJECT_ID);
    console.log('📦 Storage:', process.env.FIREBASE_STORAGE_BUCKET || 'Not configured');
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.error('🔧 Error details:', error);
    
    // Debug environment variables (without exposing secrets)
    console.log('🔍 Debug - Available env vars:');
    console.log('   FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('   FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('   FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('   GOOGLE_CLOUD_CREDENTIALS:', !!process.env.GOOGLE_CLOUD_CREDENTIALS);
    console.log('   FIREBASE_SERVICE_ACCOUNT:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    
    if (process.env.FIREBASE_PRIVATE_KEY) {
      const key = process.env.FIREBASE_PRIVATE_KEY;
      console.log('   Private key length:', key.length);
      console.log('   Private key starts with:', key.substring(0, 30) + '...');
      console.log('   Contains \\n:', key.includes('\\n'));
      console.log('   Contains actual newlines:', key.includes('\n'));
      console.log('   Contains BEGIN:', key.includes('-----BEGIN PRIVATE KEY-----'));
      console.log('   Contains END:', key.includes('-----END PRIVATE KEY-----'));
    }
    
    // Set to null for test mode
    app = null;
    db = null;
    messaging = null;
    
    console.log('⚠️ Running in test mode without Firebase');
    return false;
  }
}

// Initialize on module load
const isInitialized = initializeFirebase();

// Export Firebase services
module.exports = { 
  admin, 
  app,
  db, 
  messaging,
  initializeFirebase,
  isInitialized
}; 