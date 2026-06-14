'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';
import { formatRelativeTime } from '@/shared/utils';

export default function StudentRequestsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-requests'],
    queryFn: () => apiClient.get('/api/requests'),
  });

  const requests = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">All your parcel pickup requests</p>
        </div>
        <Link href="/student/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No requests yet"
          description="Create your first parcel pickup request."
          action={
            <Link href="/student/requests/new">
              <Button variant="outline" size="sm">Create Request</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <Link key={request.id} href={`/student/requests/${request.id}`}>
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
                  <p className="text-xs text-muted-foreground/60 mt-3">
                    {formatRelativeTime(request.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
