'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Star, Copy, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/shared/status-badge';
import Timeline from '@/components/shared/timeline';
import RatingStars from '@/components/shared/rating-stars';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import apiClient from '@/shared/api-client';
import { formatDateTime } from '@/shared/utils';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/shared/socket';

export default function StudentRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [otpDisplay, setOtpDisplay] = useState(null);
  const [copied, setCopied] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);

  // Load saved OTP from localStorage
  useEffect(() => {
    if (id) {
      const savedOtp = localStorage.getItem(`otp_${id}`);
      if (savedOtp) setOtpDisplay(savedOtp);
    }
  }, [id]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const events = [
      'REQUEST_ACCEPTED',
      'PARCEL_PHOTO_UPLOADED',
      'USER_CONFIRMED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const handleUpdate = (data) => {
      if (data.requestId === id) {
        // Refetch request data
        queryClient.invalidateQueries({ queryKey: ['request', id] });
        
        // Show toast based on event
        const messages = {
          REQUEST_ACCEPTED: `Agent ${data.agentName || ''} accepted your request!`,
          PARCEL_PHOTO_UPLOADED: 'Agent uploaded a parcel photo. Please verify.',
          USER_CONFIRMED: 'Photo confirmed!',
          OUT_FOR_DELIVERY: 'Your parcel is on the way!',
          DELIVERED: 'Parcel delivered! 🎉',
        };

        for (const event of events) {
          if (data.requestId && messages[event]) {
            // We don't know which event fired, but the invalidation handles it
          }
        }
      }
    };

    // Listen for specific events
    const handlers = {};
    events.forEach((event) => {
      handlers[event] = (data) => {
        if (data.requestId === id) {
          queryClient.invalidateQueries({ queryKey: ['request', id] });
          const messages = {
            REQUEST_ACCEPTED: `Agent ${data.agentName || ''} accepted your request!`,
            PARCEL_PHOTO_UPLOADED: 'Agent uploaded a parcel photo. Please verify.',
            USER_CONFIRMED: 'Photo confirmed!',
            OUT_FOR_DELIVERY: 'Your parcel is on the way! 🚀',
            DELIVERED: 'Parcel delivered successfully! 🎉',
          };
          toast.success(messages[event] || 'Request updated');
        }
      };
      socket.on(event, handlers[event]);
    });

    // Notification listener
    const handleNotification = (notif) => {
      if (notif.data?.requestId === id) {
        queryClient.invalidateQueries({ queryKey: ['request', id] });
      }
    };
    socket.on('NEW_NOTIFICATION', handleNotification);

    return () => {
      events.forEach((event) => {
        socket.off(event, handlers[event]);
      });
      socket.off('NEW_NOTIFICATION', handleNotification);
    };
  }, [id, queryClient]);

  function copyOtp() {
    if (otpDisplay) {
      navigator.clipboard.writeText(otpDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['request', id],
    queryFn: () => apiClient.get(`/api/requests/${id}`),
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/requests/${id}/confirm-photo`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Photo confirmed!');
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/requests/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Request cancelled');
    },
    onError: (err) => toast.error(err.message),
  });

  const rateMutation = useMutation({
    mutationFn: (data) => apiClient.post(`/api/requests/${id}/rate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Rating submitted!');
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateOtpMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/requests/${id}/regenerate-otp`),
    onSuccess: (res) => {
      const newOtp = res.data.otp;
      setOtpDisplay(newOtp);
      setOtpExpired(false);
      localStorage.setItem(`otp_${id}`, newOtp);
      toast.success('New OTP generated!');
    },
    onError: (err) => toast.error(err.message || 'Failed to regenerate OTP'),
  });

  // Check OTP expiry
  useEffect(() => {
    if (data?.data?.otp?.expiresAt) {
      const expiresAt = new Date(data.data.otp.expiresAt);
      if (new Date() > expiresAt && !data.data.otp.verified) {
        setOtpExpired(true);
      } else {
        setOtpExpired(false);
      }
    }
  }, [data]);

  if (isLoading) return <LoadingSkeleton type="card" count={2} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const request = data?.data;
  if (!request) return <ErrorState title="Request not found" />;

  // Show OTP section for active (non-delivered/cancelled) requests
  const showOtp = !['DELIVERED', 'CANCELLED', 'FAILED'].includes(request.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/student/requests">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{request.parcelName}</h1>
          <p className="text-sm text-muted-foreground">{request.courierCompany}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Details */}
      <Card>
        <CardContent className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Hostel</p>
            <p className="text-sm font-medium text-foreground">{request.hostel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-sm font-medium text-foreground">₹{request.rewardAmount}</p>
          </div>
          {request.trackingNumber && (
            <div>
              <p className="text-xs text-muted-foreground">Tracking</p>
              <p className="text-sm font-medium text-foreground">{request.trackingNumber}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground">{formatDateTime(request.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* OTP Section */}
      {showOtp && (
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Your Delivery OTP</CardTitle>
                <CardDescription>
                  Share this OTP with the agent when they deliver your parcel.
                  Do NOT share it before delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {otpDisplay && !otpExpired ? (
                  <>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground">
                        {otpDisplay}
                      </span>
                      <Button variant="ghost" size="icon" onClick={copyOtp}>
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      OTP expires in 30 minutes. Click regenerate if it expires.
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-400 font-medium">
                      {otpExpired ? '⚠ OTP has expired' : 'No OTP available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Generate a new OTP for this delivery.
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => regenerateOtpMutation.mutate()}
                  disabled={regenerateOtpMutation.isPending}
                  variant={otpExpired || !otpDisplay ? 'default' : 'outline'}
                  className="gap-2"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerateOtpMutation.isPending ? 'animate-spin' : ''}`} />
                  {regenerateOtpMutation.isPending ? 'Generating...' : 'Regenerate OTP'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Agent info */}
      {request.assignment?.agent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Agent</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {request.assignment.agent.user?.name?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {request.assignment.agent.user?.name}
              </p>
              <RatingStars rating={request.assignment.agent.avgRating || 0} size="sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcel Photo - Confirm */}
      {request.status === 'PARCEL_PHOTO_UPLOADED' && request.photos?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verify Parcel Photo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <img
              src={request.photos[request.photos.length - 1].url}
              alt="Parcel"
              className="w-full max-h-64 object-contain rounded-md bg-muted"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="flex-1 gap-2"
                variant="success"
              >
                <Check className="h-4 w-4" />
                This is my parcel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel button */}
      {['REQUEST_CREATED', 'AGENT_ACCEPTED'].includes(request.status) && (
        <Button
          variant="destructive"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="w-full gap-2"
        >
          <X className="h-4 w-4" />
          Cancel Request
        </Button>
      )}

      {/* Rating */}
      {request.status === 'DELIVERED' && !request.rating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <RatingStars rating={rating} interactive onChange={setRating} size="lg" showValue={false} />
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Leave a review (optional)"
            />
            <Button
              onClick={() => rateMutation.mutate({ rating, review })}
              disabled={rating === 0 || rateMutation.isPending}
              className="w-full"
            >
              Submit Rating
            </Button>
          </CardContent>
        </Card>
      )}

      {request.rating && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Your Rating</p>
            <RatingStars rating={request.rating.rating} />
            {request.rating.review && (
              <p className="text-sm text-foreground mt-2">{request.rating.review}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {request.timeline?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Timeline events={request.timeline} />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
