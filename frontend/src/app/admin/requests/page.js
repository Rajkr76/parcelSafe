'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { REQUEST_STATUSES } from '@/lib/constants';

export default function AdminRequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-requests', page, search, statusFilter],
    queryFn: () => apiClient.get('/api/admin/requests', {
      params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined },
    }),
  });

  const requests = data?.data?.requests || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total requests</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-44">
            <option value="">All Status</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
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
      ) : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests found" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Parcel</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Reward</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{req.parcelName}</p>
                      <p className="text-xs text-muted-foreground">{req.courierCompany}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{req.student?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{req.assignment?.agent?.user?.name || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-sm text-foreground hidden lg:table-cell">₹{req.rewardAmount}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
