'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Truck, CheckCircle, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import RatingStars from '@/components/shared/rating-stars';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import EmptyState from '@/components/shared/empty-state';
import apiClient from '@/shared/api-client';
import { formatRelativeTime } from '@/shared/utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { getSocket } from '@/shared/socket';

export default function AgentDashboard() {
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: () => apiClient.get('/api/agents/me'),
  });

  const { data: requestsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['agent-requests'],
    queryFn: () => apiClient.get('/api/requests'),
  });

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const events = [
      'REQUEST_CREATED',
      'USER_CONFIRMED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'AGENT_APPROVED',
      'AGENT_REJECTED',
      'NEW_NOTIFICATION',
    ];

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['agent-requests'] });
      queryClient.invalidateQueries({ queryKey: ['agent-profile'] });
    };

    events.forEach((event) => socket.on(event, handleUpdate));

    return () => {
      events.forEach((event) => socket.off(event, handleUpdate));
    };
  }, [queryClient]);

  const agent = profileData?.data;
  const requests = requestsData?.data || [];
  const active = requests.filter((r) =>
    ['AGENT_ACCEPTED', 'PARCEL_PHOTO_UPLOADED', 'USER_CONFIRMED', 'OUT_FOR_DELIVERY'].includes(r.status)
  );

  // Pending approval state
  if (agent && agent.status === 'PENDING') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Pending Approval</h2>
          <p className="text-sm text-muted-foreground">
            Your agent registration is being reviewed by the admin. You&apos;ll be notified once approved.
          </p>
        </div>
      </div>
    );
  }

  if (agent && agent.status === 'REJECTED') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Registration Rejected</h2>
          <p className="text-sm text-muted-foreground">
            Your agent registration was rejected. Please contact the admin for more information.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Active Deliveries', value: active.length, icon: Truck, color: 'text-blue-400' },
    { label: 'Completed', value: agent?.deliveryCount || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Avg Rating', value: (agent?.avgRating || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your deliveries</p>
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

      {/* Active deliveries */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Active Deliveries</h2>
        {isLoading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : active.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No active deliveries"
            description="Check available requests to start delivering."
            action={
              <Link href="/agent/available">
                <button className="text-sm text-foreground underline">Browse Available</button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((req) => (
              <Link key={req.id} href={`/agent/requests/${req.id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{req.parcelName}</h3>
                        <p className="text-sm text-muted-foreground">{req.student?.name} · {req.hostel}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{req.courierCompany}</span>
                      <span className="text-foreground font-medium">₹{req.rewardAmount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {formatRelativeTime(req.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
