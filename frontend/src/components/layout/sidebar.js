'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, History, User,
  Truck, ListChecks, Users, Shield,
  BarChart3, FileText, ClipboardList, CheckSquare
} from 'lucide-react';

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/requests', label: 'My Requests', icon: Package },
  { href: '/student/history', label: 'History', icon: History },
  { href: '/student/profile', label: 'Profile', icon: User },
];

const agentLinks = [
  { href: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agent/available', label: 'Available', icon: ListChecks },
  { href: '/agent/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/agent/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/agents', label: 'Agents', icon: Shield },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
];

export default function Sidebar({ role }) {
  const pathname = usePathname();

  const links = role === 'ADMIN'
    ? adminLinks
    : role === 'AGENT'
    ? agentLinks
    : studentLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Package className="h-6 w-6 text-foreground" />
        <span className="text-lg font-bold text-foreground tracking-tight">ParcelSafe</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground/60">
          ParcelSafe v1.0
        </p>
      </div>
    </aside>
  );
}
