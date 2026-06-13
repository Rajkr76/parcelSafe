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

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'ParcelSafe', {
    body: body || 'You have a new notification',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  });
});
