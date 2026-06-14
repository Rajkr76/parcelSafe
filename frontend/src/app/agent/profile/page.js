'use client';

import { useQuery } from '@tanstack/react-query';
import { User, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import RatingStars from '@/components/shared/rating-stars';
import StatusBadge from '@/components/shared/status-badge';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import apiClient from '@/shared/api-client';
import { formatDate } from '@/shared/utils';

export default function AgentProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: () => apiClient.get('/api/agents/me'),
  });

  const agent = data?.data;

  if (isLoading) return <LoadingSkeleton type="card" count={1} />;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {agent?.user?.profilePhoto ? (
              <img src={agent.user.profilePhoto} alt={agent.user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{agent?.user?.name}</h2>
              <p className="text-sm text-muted-foreground">{agent?.user?.email}</p>
              <StatusBadge status={agent?.status} className="mt-1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Registration No.</span>
              <span className="text-sm font-medium text-foreground">{agent?.user?.registrationNo}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Hostel</span>
              <span className="text-sm font-medium text-foreground">{agent?.user?.hostel}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Deliveries</span>
              <span className="text-sm font-medium text-foreground">{agent?.deliveryCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Rating</span>
              <RatingStars rating={agent?.avgRating || 0} />
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium text-foreground">{formatDate(agent?.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
