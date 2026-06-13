'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, Package, LayoutDashboard, ListChecks, History, User, Users, Shield, BarChart3, FileText, Truck, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const links = {
  STUDENT: [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/requests', label: 'My Requests', icon: Package },
    { href: '/student/history', label: 'History', icon: History },
    { href: '/student/profile', label: 'Profile', icon: User },
  ],
  AGENT: [
    { href: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agent/available', label: 'Available', icon: ListChecks },
    { href: '/agent/deliveries', label: 'Deliveries', icon: Truck },
    { href: '/agent/profile', label: 'Profile', icon: User },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/agents', label: 'Agents', icon: Shield },
    { href: '/admin/requests', label: 'Requests', icon: ClipboardList },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ],
};

export default function MobileNav({ open, onClose, role }) {
  const pathname = usePathname();
  const navLinks = links[role] || links.STUDENT;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                <span className="text-lg font-bold tracking-tight">ParcelSafe</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
