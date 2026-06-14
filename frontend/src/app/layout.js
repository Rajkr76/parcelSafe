import './globals.css';
import QueryProvider from '@/providers/query-provider';
import AuthSessionProvider from '@/providers/session-provider';
import ToastProvider from '@/providers/toast-provider';
import SocketProvider from '@/providers/socket-provider';

export const metadata = {
  title: 'ParcelSafe — Campus Parcel Pickup & Delivery',
  description: 'Request verified student agents to collect your parcels from the campus parcel center and deliver them to your hostel.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ParcelSafe',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <AuthSessionProvider>
          <QueryProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
            <ToastProvider />
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
