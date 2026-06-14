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

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) setIsConnected(true);

    // Initialize Firebase & register FCM token
    initializeFirebaseMessaging();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
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

    // Listen for FCM foreground messages
    onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        // Show in-app toast
        toast.info(title, { description: body });
        
        // ALSO trigger the native Chrome System Notification directly from FCM!
        if (Notification.permission === 'granted') {
          new Notification(title, { 
            body: body,
            icon: '/favicon.ico'
          });
        }
      }
    });

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
