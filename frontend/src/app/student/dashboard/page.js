'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, CheckCircle, XCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';
import { formatRelativeTime } from '@/shared/utils';
import { useEffect } from 'react';
import { getSocket } from '@/shared/socket';

export default function StudentDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-requests'],
    queryFn: () => apiClient.get('/api/requests'),
  });

  // Socket.IO real-time updates for dashboard
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const events = [
      'REQUEST_ACCEPTED',
      'PARCEL_PHOTO_UPLOADED',
      'USER_CONFIRMED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'NEW_NOTIFICATION',
    ];

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
    };

    events.forEach((event) => socket.on(event, handleUpdate));

    return () => {
      events.forEach((event) => socket.off(event, handleUpdate));
    };
  }, [queryClient]);

  const requests = data?.data || [];
  const active = requests.filter((r) =>
    ['REQUEST_CREATED', 'AGENT_ACCEPTED', 'PARCEL_PHOTO_UPLOADED', 'USER_CONFIRMED', 'OUT_FOR_DELIVERY'].includes(r.status)
  );
  const completed = requests.filter((r) => r.status === 'DELIVERED');
  const failed = requests.filter((r) => ['CANCELLED', 'FAILED'].includes(r.status));

  const stats = [
    { label: 'Active Requests', value: active.length, icon: Package, color: 'text-blue-400' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Cancelled/Failed', value: failed.length, icon: XCircle, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your parcel deliveries</p>
        </div>
        <Link href="/student/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Requests */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Active Requests</h2>
        {isLoading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : active.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No active requests"
            description="Create a new request to get your parcels delivered to your hostel."
            action={
              <Link href="/student/requests/new">
                <Button variant="outline" size="sm">Create Request</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((request, i) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/student/requests/${request.id}`}>
                  <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-foreground">{request.parcelName}</h3>
                          <p className="text-sm text-muted-foreground">{request.courierCompany}</p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{request.hostel}</span>
                        <span className="text-foreground font-medium">₹{request.rewardAmount}</span>
                      </div>
                      {request.assignment?.agent?.user && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {request.assignment.agent.user.name?.[0]}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {request.assignment.agent.user.name}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {formatRelativeTime(request.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
