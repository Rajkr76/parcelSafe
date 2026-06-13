'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AdminUserDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => apiClient.get(`/api/admin/users/${id}`),
  });

  if (isLoading) return <LoadingSkeleton type="card" count={2} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const user = data?.data;
  if (!user) return <ErrorState title="User not found" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{user.name || 'Unknown User'}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant={user.suspended ? 'destructive' : 'secondary'}>
          {user.suspended ? 'Suspended' : user.role?.toLowerCase()}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 mb-6">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-foreground font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Registration No.</span>
              <span className="text-sm font-medium text-foreground">{user.registrationNo || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Hostel</span>
              <span className="text-sm font-medium text-foreground">{user.hostel || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium text-foreground">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Profile Completed</span>
              <span className="text-sm font-medium text-foreground">{user.profileCompleted ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests */}
      {user.requests?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests ({user.requests.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {user.requests.slice(0, 10).map((req) => (
              <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{req.parcelName}</p>
                  <p className="text-xs text-muted-foreground">{req.courierCompany} · {formatDate(req.createdAt)}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
