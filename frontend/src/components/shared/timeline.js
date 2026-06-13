import { formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Package, UserCheck, Camera, CheckCircle,
  Truck, PackageCheck, XCircle, AlertTriangle
} from 'lucide-react';

const statusIcons = {
  REQUEST_CREATED: Package,
  AGENT_ACCEPTED: UserCheck,
  PARCEL_PHOTO_UPLOADED: Camera,
  USER_CONFIRMED: CheckCircle,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
  FAILED: AlertTriangle,
};

export default function Timeline({ events = [] }) {
  if (!events.length) return null;

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = statusIcons[event.status] || Package;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                isLast ? 'border-foreground/30 bg-foreground/10' : 'border-border bg-card'
              )}>
                <Icon className={cn('h-4 w-4', isLast ? 'text-foreground' : 'text-muted-foreground')} />
              </div>
              {index < events.length - 1 && (
                <div className="w-px h-8 bg-border" />
              )}
            </div>
            {/* Content */}
            <div className="pb-6 pt-1">
              <p className={cn(
                'text-sm font-medium',
                isLast ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {getStatusLabel(event.status)}
              </p>
              {event.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {formatDateTime(event.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
