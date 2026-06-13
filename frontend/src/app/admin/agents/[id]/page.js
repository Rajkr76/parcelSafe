'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import RatingStars from '@/components/shared/rating-stars';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAgentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-agent', id],
    queryFn: () => apiClient.get(`/api/admin/agents/${id}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => apiClient.patch(`/api/admin/agents/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent', id] });
      toast.success('Agent status updated');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton type="card" count={2} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const agent = data?.data;
  if (!agent) return <ErrorState title="Agent not found" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/agents">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{agent.user?.name || 'Unknown Agent'}</h1>
          <p className="text-sm text-muted-foreground">{agent.user?.email}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base">Agent Profile</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 mb-6">
            {agent.user?.profilePhoto ? (
              <img src={agent.user.profilePhoto} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{agent.user?.name}</p>
              <RatingStars rating={agent.avgRating || 0} />
              <p className="text-sm text-muted-foreground mt-1">{agent.deliveryCount} deliveries</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Registration No.</span>
              <span className="text-sm font-medium text-foreground">{agent.user?.registrationNo || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Hostel</span>
              <span className="text-sm font-medium text-foreground">{agent.user?.hostel || '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium text-foreground">{formatDate(agent.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* College ID */}
      {agent.collegeIdPhoto && (
        <Card>
          <CardHeader><CardTitle className="text-base">College ID</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <img src={agent.collegeIdPhoto} alt="College ID" className="rounded-md max-h-64 object-contain w-full bg-muted" />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
        <CardContent className="pt-0 flex gap-3 flex-wrap">
          {agent.status === 'PENDING' && (
            <>
              <Button variant="success" onClick={() => updateStatusMutation.mutate('APPROVED')} disabled={updateStatusMutation.isPending}>
                Approve Agent
              </Button>
              <Button variant="destructive" onClick={() => updateStatusMutation.mutate('REJECTED')} disabled={updateStatusMutation.isPending}>
                Reject Agent
              </Button>
            </>
          )}
          {agent.status === 'APPROVED' && (
            <Button variant="destructive" onClick={() => updateStatusMutation.mutate('SUSPENDED')} disabled={updateStatusMutation.isPending}>
              Suspend Agent
            </Button>
          )}
          {agent.status === 'SUSPENDED' && (
            <Button variant="success" onClick={() => updateStatusMutation.mutate('APPROVED')} disabled={updateStatusMutation.isPending}>
              Reactivate Agent
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      {agent.assignments?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Deliveries ({agent.assignments.length})</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {agent.assignments.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.request?.parcelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.request?.student?.name} · {a.request?.student?.hostel} · {formatDate(a.assignedAt)}
                  </p>
                </div>
                <StatusBadge status={a.request?.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {agent.ratingsReceived?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Reviews</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {agent.ratingsReceived.slice(0, 10).map((r) => (
              <div key={r.id} className="py-2 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{r.rater?.name}</span>
                  <RatingStars rating={r.rating} size="sm" />
                </div>
                {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
