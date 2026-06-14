'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import EmptyState from '@/components/shared/empty-state';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';
import { formatDateTime } from '@/shared/utils';

const ACTIONS = [
  'AGENT_APPROVED', 'AGENT_REJECTED', 'AGENT_SUSPENDED',
  'USER_SUSPENDED', 'USER_ACTIVATED', 'USER_DELETED', 'AGENT_DELETED',
];

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => apiClient.get('/api/admin/audit-logs', {
      params: { page, limit: 50, action: actionFilter || undefined },
    }),
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total entries</p>
        </div>
        <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="w-52">
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="table" count={10} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit logs" description="Admin actions will be recorded here." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <Badge variant="outline">{log.action.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {log.admin?.name || log.admin?.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell font-mono text-xs">
                      {log.details?.userName || log.details?.agentName || log.target}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 50 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 50)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 50)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
