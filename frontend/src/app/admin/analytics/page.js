'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Percent, MapPin, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiClient.get('/api/admin/analytics'),
  });

  const analytics = data?.data;

  const stats = [
    { label: 'Requests Today', value: analytics?.requestsToday || 0, icon: BarChart3, color: 'text-blue-400' },
    { label: 'Deliveries Today', value: analytics?.deliveriesToday || 0, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Avg Delivery Time', value: `${analytics?.avgDeliveryTime || 0}m`, icon: Clock, color: 'text-yellow-400' },
    { label: 'Success Rate', value: `${analytics?.successRate || 0}%`, icon: Percent, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform performance metrics</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="stats" count={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Most Active Hostels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Most Active Hostels
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {analytics?.mostActiveHostels?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mostActiveHostels.map((h, i) => (
                      <div key={h.hostel} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm text-foreground">{h.hostel}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{h.count} requests</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" /> Top Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {analytics?.topAgents?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topAgents.map((a, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm text-foreground">{a.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-foreground">{a.deliveryCount} deliveries</span>
                          <span className="text-xs text-muted-foreground ml-2">★ {a.avgRating?.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
