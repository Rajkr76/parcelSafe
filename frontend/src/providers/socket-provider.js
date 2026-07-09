'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '@/shared/socket';
import { initializeFirebase, requestNotificationPermission, onForegroundMessage } from '@/shared/firebase';
import apiClient from '@/shared/api-client';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { status } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    // If not authenticated, disconnect and return
    if (status === 'unauthenticated') {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    // We might be authenticated via session but token isn't in localStorage yet.
    // Wait until we have a token.
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

    // Socket Event Listeners for Real-time Data Refresh
    const handleGlobalUpdate = () => {
      // Invalidate relevant queries so UI auto-refreshes seamlessly
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      queryClient.invalidateQueries({ queryKey: ['agent-requests'] });
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['agent-profile'] });
    };

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleRequestAccepted = (data) => {
      handleGlobalUpdate();
      if (data?.requestId) queryClient.invalidateQueries({ queryKey: ['request', data.requestId] });
      toast.success('Your parcel request has been accepted by an agent!');
    };

    const handleOutForDelivery = (data) => {
      handleGlobalUpdate();
      if (data?.requestId) queryClient.invalidateQueries({ queryKey: ['request', data.requestId] });
      toast.info('Your parcel is out for delivery!');
    };

    const handleDelivered = (data) => {
      handleGlobalUpdate();
      if (data?.requestId) queryClient.invalidateQueries({ queryKey: ['request', data.requestId] });
      toast.success('Your parcel has been delivered successfully!');
    };

    // Attach base listeners
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // Attach data listeners
    s.on('REQUEST_CREATED', handleGlobalUpdate);
    s.on('USER_CONFIRMED', handleGlobalUpdate);
    s.on('PARCEL_PHOTO_UPLOADED', handleGlobalUpdate);
    s.on('NEW_NOTIFICATION', handleNewNotification);
    s.on('REQUEST_ACCEPTED', handleRequestAccepted);
    s.on('OUT_FOR_DELIVERY', handleOutForDelivery);
    s.on('DELIVERED', handleDelivered);

    if (s.connected) setIsConnected(true);

    // Initialize Firebase & register FCM token
    initializeFirebaseMessaging();

    return () => {
      // Clean up base listeners
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      
      // Clean up data listeners
      s.off('REQUEST_CREATED', handleGlobalUpdate);
      s.off('USER_CONFIRMED', handleGlobalUpdate);
      s.off('PARCEL_PHOTO_UPLOADED', handleGlobalUpdate);
      s.off('NEW_NOTIFICATION', handleNewNotification);
      s.off('REQUEST_ACCEPTED', handleRequestAccepted);
      s.off('OUT_FOR_DELIVERY', handleOutForDelivery);
      s.off('DELIVERED', handleDelivered);
      
      disconnectSocket();
    };
  }, [status, queryClient]);

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
        duration: 15000,
      });
    }
  } catch (err) {
    console.warn('Firebase init error:', err.message);
  }
}
