// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of the public directory

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDOhLhWc3XdmJLaA5Np64dYieE8G41zgz8',
  authDomain: 'parcelsafe.firebaseapp.com',
  projectId: 'parcelsafe',
  messagingSenderId: '674062125270',
  appId: '1:674062125270:web:adfec2c0ec492075dd2177',
});

const messaging = firebase.messaging();

// Firebase SDK automatically handles background messages that contain a 'notification' payload.
// We do not need to call messaging.onBackgroundMessage() manually unless we want to handle
// data-only payloads. Since the backend sends 'notification' payloads, Firebase will
// automatically display the browser notification when the app is in the background or closed.
