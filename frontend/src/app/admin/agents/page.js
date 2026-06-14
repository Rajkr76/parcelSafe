'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import StatusBadge from '@/components/shared/status-badge';
import RatingStars from '@/components/shared/rating-stars';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';
import { formatDate } from '@/shared/utils';
import { toast } from 'sonner';

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-agents', page, search, statusFilter],
    queryFn: () => apiClient.get('/api/admin/agents', {
      params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined },
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/agents/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      toast.success('Agent status updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const agents = data?.data?.agents || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total agents</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="pl-9" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : agents.length === 0 ? (
        <EmptyState icon={Shield} title="No agents found" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Hostel</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Deliveries</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <Link href={`/admin/agents/${agent.id}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                          {agent.user?.profilePhoto ? (
                            <img src={agent.user.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {agent.user?.name?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{agent.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.user?.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{agent.user?.hostel || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={agent.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><RatingStars rating={agent.avgRating} /></td>
                    <td className="px-4 py-3 text-sm text-foreground hidden lg:table-cell">{agent.deliveryCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {agent.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-emerald-400" onClick={() => updateStatusMutation.mutate({ id: agent.id, status: 'APPROVED' })}>
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => updateStatusMutation.mutate({ id: agent.id, status: 'REJECTED' })}>
                              Reject
                            </Button>
                          </>
                        )}
                        {agent.status === 'APPROVED' && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: agent.id, status: 'SUSPENDED' })}>
                            Suspend
                          </Button>
                        )}
                        {agent.status === 'SUSPENDED' && (
                          <Button variant="ghost" size="sm" className="text-emerald-400" onClick={() => updateStatusMutation.mutate({ id: agent.id, status: 'APPROVED' })}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
