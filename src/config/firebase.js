const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK with better error handling
try {
  console.log('🔥 Initializing Firebase Admin SDK...');
  
  // Validate required environment variables
  const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }

  // Debug: Check private key format
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  console.log('🔑 Private key length:', privateKey ? privateKey.length : 'undefined');
  console.log('🔑 Private key starts with:', privateKey ? privateKey.substring(0, 30) + '...' : 'undefined');

  // Initialize with proper error handling
  const firebaseConfig = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  };

  // Add storage bucket if provided (optional)
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    firebaseConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    console.log('📦 Storage bucket configured:', process.env.FIREBASE_STORAGE_BUCKET);
  }

  admin.initializeApp(firebaseConfig);
  
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log('📊 Project ID:', process.env.FIREBASE_PROJECT_ID);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('🔧 Error details:', error);
  
  // Continue without Firebase (test mode)
  console.log('⚠️ Continuing in test mode without Firebase');
}

let db, messaging;

try {
  db = admin.firestore();
  messaging = admin.messaging();
  console.log('✅ Firebase services initialized');
} catch (error) {
  console.log('⚠️ Firebase services not available - test mode active');
  db = null;
  messaging = null;
}

module.exports = { admin, db, messaging }; 