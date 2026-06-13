'use client';

import { signOut } from 'next-auth/react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import MobileNav from './mobile-nav';

export default function Header({ user, role, unreadCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page info */}
        <div className="flex-1 lg:flex-none" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profilePhoto || user?.image} alt={user?.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role?.toLowerCase()}</p>
            </div>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile nav */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} role={role} />
    </>
  );
}
