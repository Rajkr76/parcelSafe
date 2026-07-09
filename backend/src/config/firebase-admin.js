const admin = require('firebase-admin');
const env = require('./env');
const fs = require('fs');
const path = require('path');

let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

 try {
  
  let serviceAccount;
  console.log(
  "FIREBASE_SERVICE_ACCOUNT_JSON exists:",
  !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
);

console.log(
  "FIREBASE_SERVICE_ACCOUNT_PATH:",
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  const serviceAccountPath = path.resolve(
    process.cwd(),
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  );

  serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
}

    serviceAccount.private_key =
      serviceAccount.private_key.replace(/\\n/g, '\n');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✓ Firebase Admin SDK initialized');
  } catch (error) {
    console.warn('⚠ Firebase service account not found. Push notifications will be disabled.');
    console.warn(`  Check FIREBASE_SERVICE_ACCOUNT_PATH environment variable. Error: ${error.message}`);
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
