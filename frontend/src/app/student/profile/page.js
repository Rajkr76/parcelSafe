'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.get('/api/users/me'),
  });

  const user = data?.data;

  if (isLoading) return <LoadingSkeleton type="card" count={1} />;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Registration No.</span>
              <span className="text-sm font-medium text-foreground">{user?.registrationNo || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Hostel</span>
              <span className="text-sm font-medium text-foreground">{user?.hostel || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium text-foreground capitalize">{user?.role?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium text-foreground">{user?.createdAt ? formatDate(user.createdAt) : '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
