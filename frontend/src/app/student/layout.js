'use client';

import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function StudentLayout({ children }) {
  const { data: session } = useSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="STUDENT" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session?.user} role="STUDENT" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
