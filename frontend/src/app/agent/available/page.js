'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { HOSTELS } from '@/lib/constants';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export default function AvailableRequestsPage() {
  const queryClient = useQueryClient();
  const [hostelFilter, setHostelFilter] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['available-requests', hostelFilter],
    queryFn: () => apiClient.get('/api/requests', {
      params: { available: true, hostel: hostelFilter || undefined },
    }),
  });

  // Socket.IO — new requests appear in real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewRequest = () => {
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
    };

    socket.on('REQUEST_CREATED', handleNewRequest);

    return () => {
      socket.off('REQUEST_CREATED', handleNewRequest);
    };
  }, [queryClient]);

  const acceptMutation = useMutation({
    mutationFn: (requestId) => apiClient.patch(`/api/requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      queryClient.invalidateQueries({ queryKey: ['agent-requests'] });
      toast.success('Request accepted!');
    },
    onError: (err) => toast.error(err.message),
  });

  const requests = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Available Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and accept parcel pickup requests</p>
        </div>
        <Select
          value={hostelFilter}
          onChange={(e) => setHostelFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Hostels</option>
          {HOSTELS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No available requests"
          description="Check back later for new pickup requests."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{req.parcelName}</h3>
                      <p className="text-sm text-muted-foreground">{req.courierCompany}</p>
                    </div>
                    <span className="text-lg font-bold text-foreground">₹{req.rewardAmount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>{req.hostel}</span>
                    <span>·</span>
                    <span>{req.student?.name}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(req.createdAt)}</span>
                  </div>
                  <Button
                    onClick={() => acceptMutation.mutate(req.id)}
                    disabled={acceptMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    Accept Request
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
