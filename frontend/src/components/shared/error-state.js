import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading data.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-destructive/20 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
