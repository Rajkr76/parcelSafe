const admin = require('firebase-admin');
const env = require('./env');
const fs = require('fs');
const path = require('path');

let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  const serviceAccountPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH);

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✓ Firebase Admin SDK initialized');
  } else {
    console.warn('⚠ Firebase service account not found. Push notifications will be disabled.');
    console.warn(`  Expected path: ${serviceAccountPath}`);
  }

  return firebaseApp;
}

async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized. Skipping push notification.');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-72.png',
        },
      },
    };

    const result = await admin.messaging().send(message);
    return result;
  } catch (error) {
    console.error('FCM send error:', error.message);
    return null;
  }
}

module.exports = { initializeFirebase, sendPushNotification };
