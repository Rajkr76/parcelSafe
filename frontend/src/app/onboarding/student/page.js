'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { HOSTELS } from '@/shared/constants';
import apiClient from '@/shared/api-client';
import { toast } from 'sonner';

export default function StudentOnboarding() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    registrationNo: '',
    hostel: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.registrationNo || !form.hostel) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/api/users/me/onboarding', form);
      toast.success('Profile completed!');
      router.push('/student/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Package className="h-8 w-8 text-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Set up your student profile to start requesting deliveries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">College Email</Label>
            <Input id="email" value={session?.user?.email || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNo">Registration Number</Label>
            <Input
              id="registrationNo"
              value={form.registrationNo}
              onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
              placeholder="e.g., 21BCE1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostel">Hostel</Label>
            <Select
              id="hostel"
              value={form.hostel}
              onChange={(e) => setForm({ ...form, hostel: e.target.value })}
              required
            >
              <option value="">Select your hostel</option>
              {HOSTELS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </Select>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/onboarding/agent')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Want to be a delivery agent instead?
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
