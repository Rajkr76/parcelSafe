'use client';

import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function AgentLayout({ children }) {
  const { data: session } = useSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="AGENT" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session?.user} role="AGENT" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
