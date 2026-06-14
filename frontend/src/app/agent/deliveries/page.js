'use client';

import { useQuery } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import RatingStars from '@/components/shared/rating-stars';
import apiClient from '@/shared/api-client';
import { formatDate } from '@/shared/utils';

export default function AgentDeliveriesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['agent-requests'],
    queryFn: () => apiClient.get('/api/requests'),
  });

  const requests = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">All your delivery history</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : requests.length === 0 ? (
        <EmptyState icon={Truck} title="No deliveries yet" description="Accept requests to start delivering." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/agent/requests/${r.id}`}>
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{r.parcelName}</h3>
                    <p className="text-sm text-muted-foreground">{r.student?.name} · {r.hostel}</p>
                    {r.rating && <RatingStars rating={r.rating.rating} size="sm" className="mt-1" />}
                    <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="text-sm font-medium text-foreground mt-1">₹{r.rewardAmount}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
