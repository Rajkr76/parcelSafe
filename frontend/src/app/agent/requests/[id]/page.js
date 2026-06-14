'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Truck, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import Timeline from '@/components/shared/timeline';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import ErrorState from '@/components/shared/error-state';
import { buttonVariants } from '@/components/ui/button';
import apiClient from '@/shared/api-client';
import { formatDateTime } from '@/shared/utils';
import { toast } from 'sonner';
import { getSocket } from '@/shared/socket';

export default function AgentRequestDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [otp, setOtp] = useState('');

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const events = [
      'USER_CONFIRMED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'REQUEST_CANCELLED',
    ];

    const handlers = {};
    events.forEach((event) => {
      handlers[event] = (data) => {
        if (data.requestId === id) {
          queryClient.invalidateQueries({ queryKey: ['request', id] });
          const messages = {
            USER_CONFIRMED: 'Student confirmed the parcel photo! ✅',
            OUT_FOR_DELIVERY: 'Marked as out for delivery!',
            DELIVERED: 'Delivery completed! 🎉',
            REQUEST_CANCELLED: 'Student cancelled the request.',
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['request', id],
    queryFn: () => apiClient.get(`/api/requests/${id}`),
  });

  const outForDeliveryMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/requests/${id}/out-for-delivery`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Marked as out for delivery!');
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (otpValue) => apiClient.post(`/api/requests/${id}/verify-otp`, { otp: otpValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Delivery completed! 🎉');
    },
    onError: (err) => toast.error(err.message),
  });

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('photo', compressedFile);
      await apiClient.post(`/api/upload/parcel-photo/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Parcel photo uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input value so the same file can be selected again if it failed
      if (e.target) e.target.value = '';
    }
  }

  if (isLoading) return <LoadingSkeleton type="card" count={2} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const request = data?.data;
  if (!request) return <ErrorState title="Request not found" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{request.parcelName}</h1>
          <p className="text-sm text-muted-foreground">{request.student?.name} · {request.hostel}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Details */}
      <Card>
        <CardContent className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Courier</p>
            <p className="text-sm font-medium text-foreground">{request.courierCompany}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-sm font-medium text-foreground">₹{request.rewardAmount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hostel</p>
            <p className="text-sm font-medium text-foreground">{request.hostel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground">{formatDateTime(request.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions based on status */}
      {request.status === 'AGENT_ACCEPTED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Parcel Photo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo of the parcel at the collection center for student verification.
            </p>
            <input 
              id="camera-upload"
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="absolute w-0 h-0 opacity-0" 
              disabled={uploading}
            />
            <label
              htmlFor="camera-upload"
              className={buttonVariants({ variant: 'outline', className: 'w-full gap-2 cursor-pointer' })}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </label>
          </CardContent>
        </Card>
      )}

      {request.status === 'USER_CONFIRMED' && (
        <Card>
          <CardContent className="p-5">
            <Button
              onClick={() => outForDeliveryMutation.mutate()}
              disabled={outForDeliveryMutation.isPending}
              className="w-full gap-2"
              variant="success"
            >
              <Truck className="h-4 w-4" />
              Mark Out for Delivery
            </Button>
          </CardContent>
        </Card>
      )}

      {request.status === 'OUT_FOR_DELIVERY' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verify Delivery OTP</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ask the student for their 6-digit OTP to complete the delivery.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="text-center text-xl tracking-[0.3em] font-mono"
            />
            <Button
              onClick={() => verifyOtpMutation.mutate(otp)}
              disabled={otp.length !== 6 || verifyOtpMutation.isPending}
              className="w-full gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & Complete'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {request.photos?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Parcel Photos</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {request.photos.map((photo) => (
                <img key={photo.id} src={photo.url} alt="Parcel" className="rounded-md object-cover w-full h-40" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {request.timeline?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <Timeline events={request.timeline} />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
