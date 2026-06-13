'use client';

import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(0 0% 10%)',
          border: '1px solid hsl(0 0% 18%)',
          color: 'hsl(0 0% 98%)',
          fontSize: '14px',
        },
      }}
      richColors
      closeButton
    />
  );
}
