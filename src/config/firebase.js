const admin = require('firebase-admin');
require('dotenv').config();

let app, db, messaging;

// Initialize Firebase Admin SDK with proper error handling
function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      app = admin.app();
      db = admin.firestore();
      messaging = admin.messaging();
      return;
    }
    
    // Validate required environment variables
    const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
    }

    // Process private key according to Firebase best practices
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    if (privateKey.includes('\\n')) {
      // Convert literal \n to actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure proper BEGIN/END format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - missing BEGIN marker');
    }
    
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - missing END marker');
    }

    // Initialize Firebase with credentials
    const firebaseConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    };

    // Add optional storage bucket
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      firebaseConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }

    // Initialize the app
    app = admin.initializeApp(firebaseConfig);
    
    // Initialize services
    db = admin.firestore();
    messaging = admin.messaging();
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('📊 Project:', process.env.FIREBASE_PROJECT_ID);
    console.log('📦 Storage:', process.env.FIREBASE_STORAGE_BUCKET || 'Not configured');
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    
    // Set to null for test mode
    app = null;
    db = null;
    messaging = null;
    
    console.log('⚠️ Running in test mode without Firebase');
    return false;
  }
}

// Initialize on module load
initializeFirebase();

// Export Firebase services
module.exports = { 
  admin, 
  app,
  db, 
  messaging,
  initializeFirebase 
}; 