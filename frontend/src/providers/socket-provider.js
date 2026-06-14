'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/shared/socket';
import { initializeFirebase, requestNotificationPermission, onForegroundMessage } from '@/shared/firebase';
import apiClient from '@/shared/api-client';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect socket
    const s = connectSocket(token);
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      console.log('✓ Socket connected');
    };
    const onDisconnect = () => {
      setIsConnected(false);
      console.log('✗ Socket disconnected');
    };
    const onNewNotification = (data) => {
      // Show an in-app toast immediately when socket receives a notification
      toast.info(data.title, { description: data.message });

      // Trigger the native Chrome System Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        // We only want to show the system notification if the document is NOT focused (in a background tab)
        // or if the user explicitly wants them while the app is open. 
        // We'll show it anyway as per user request for "Chrome notifications"
        new Notification(data.title, { 
          body: data.message,
          icon: '/favicon.ico'
        });
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('NEW_NOTIFICATION', onNewNotification);

    if (s.connected) setIsConnected(true);

    // Initialize Firebase & register FCM token
    initializeFirebaseMessaging();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('NEW_NOTIFICATION', onNewNotification);
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

async function initializeFirebaseMessaging() {
  try {
    const app = initializeFirebase();
    if (!app) return;

    if (!('Notification' in window)) return;

    const saveToken = async () => {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        try {
          await apiClient.post('/api/notifications/fcm-token', { token: fcmToken });
          console.log('✓ FCM token registered');
        } catch (err) {
          console.warn('Failed to save FCM token:', err.message);
        }
      }
    };

    if (Notification.permission === 'granted') {
      await saveToken();
    } else if (Notification.permission !== 'denied') {
      toast('Enable Push Notifications', {
        description: 'Get instant updates when your parcel is out for delivery!',
        action: {
          label: 'Enable',
          onClick: saveToken,
        },
        duration: 15000, // Show for 15 seconds so they have time to click
      });
    }
  } catch (err) {
    console.warn('Firebase init error:', err.message);
  }
}
