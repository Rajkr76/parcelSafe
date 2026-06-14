'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HOSTELS, COURIER_COMPANIES } from '@/shared/constants';
import apiClient from '@/shared/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [otpDisplay, setOtpDisplay] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    parcelName: '',
    courierCompany: '',
    trackingNumber: '',
    hostel: '',
    rewardAmount: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/requests', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-requests'] });
      setOtpDisplay(res.data.otp);
      if (res.data.request?.id) {
        localStorage.setItem(`otp_${res.data.request.id}`, res.data.otp);
      }
      toast.success('Request created! Save your OTP.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create request');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.parcelName || !form.courierCompany || !form.hostel || !form.rewardAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate({
      ...form,
      rewardAmount: parseFloat(form.rewardAmount),
    });
  }

  function copyOtp() {
    navigator.clipboard.writeText(otpDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Show OTP after creation
  if (otpDisplay) {
    return (
      <div className="max-w-md mx-auto py-8">
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
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground">
                  {otpDisplay}
                </span>
                <Button variant="ghost" size="icon" onClick={copyOtp}>
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                OTP expires in 30 minutes. A new one can be generated if needed.
              </p>
              <Button onClick={() => router.push('/student/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">New Request</h1>
            <p className="text-sm text-muted-foreground">Create a parcel pickup request</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="parcelName">Parcel Name *</Label>
                <Input
                  id="parcelName"
                  value={form.parcelName}
                  onChange={(e) => setForm({ ...form, parcelName: e.target.value })}
                  placeholder="e.g., Nike Shoes, Phone Case"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courierCompany">Courier Company *</Label>
                <Select
                  id="courierCompany"
                  value={form.courierCompany}
                  onChange={(e) => setForm({ ...form, courierCompany: e.target.value })}
                  required
                >
                  <option value="">Select courier</option>
                  {COURIER_COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={form.trackingNumber}
                  onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostel">Delivery Hostel *</Label>
                <Select
                  id="hostel"
                  value={form.hostel}
                  onChange={(e) => setForm({ ...form, hostel: e.target.value })}
                  required
                >
                  <option value="">Select hostel</option>
                  {HOSTELS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewardAmount">Reward Amount (₹) *</Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.rewardAmount}
                  onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
                  placeholder="e.g., 30"
                  required
                />
                <p className="text-xs text-muted-foreground">Only prepaid parcels. COD not supported.</p>
              </div>

              <Button type="submit" className="w-full h-11" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
