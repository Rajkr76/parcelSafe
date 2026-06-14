import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase config not set. Push notifications disabled.');
    return null;
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase messaging not supported:', err.message);
  }

  return app;
}

export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    // 1. Check if browser supports service workers and push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser (or it is not HTTPS).');
      return null;
    }

    // 2. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // 3. Explicitly register the Service Worker
    // This is much more reliable than letting Firebase guess
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // 4. Get FCM Token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: registration
    });
    
    return token;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
