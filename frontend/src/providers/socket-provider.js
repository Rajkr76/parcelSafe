'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { initializeFirebase, requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import apiClient from '@/lib/api-client';
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
    initializeFirebaseMessaging(token);

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

    const fcmToken = await requestNotificationPermission();
    if (fcmToken) {
      // Save FCM token to backend
      try {
        await apiClient.post('/api/notifications/fcm-token', { token: fcmToken });
        console.log('✓ FCM token registered');
      } catch (err) {
        console.warn('Failed to save FCM token:', err.message);
      }
    }

    // Listen for foreground messages
    onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        toast.info(title, { description: body });
      }
    });
  } catch (err) {
    console.warn('Firebase init error:', err.message);
  }
}
