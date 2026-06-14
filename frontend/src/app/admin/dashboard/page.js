'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Shield, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get('/api/admin/dashboard'),
  });

  const stats = data?.data;

  const cards = [
    { label: 'Total Students', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Total Agents', value: stats?.totalAgents || 0, icon: Shield, color: 'text-purple-400' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Active Requests', value: stats?.activeRequests || 0, icon: Package, color: 'text-cyan-400' },
    { label: 'Completed Deliveries', value: stats?.completedDeliveries || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Failed Deliveries', value: stats?.failedDeliveries || 0, icon: XCircle, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="stats" count={6} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                    </div>
                    <card.icon className={`h-8 w-8 ${card.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
