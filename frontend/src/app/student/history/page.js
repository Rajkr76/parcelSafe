'use client';

import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function StudentHistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-requests'],
    queryFn: () => apiClient.get('/api/requests'),
  });

  const requests = data?.data || [];
  const history = requests.filter((r) => ['DELIVERED', 'CANCELLED', 'FAILED'].includes(r.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Past deliveries and cancelled requests</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="No history yet" description="Completed and cancelled requests will appear here." />
      ) : (
        <div className="space-y-3">
          {history.map((r) => (
            <Link key={r.id} href={`/student/requests/${r.id}`}>
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{r.parcelName}</h3>
                    <p className="text-sm text-muted-foreground">{r.courierCompany} · {r.hostel}</p>
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
