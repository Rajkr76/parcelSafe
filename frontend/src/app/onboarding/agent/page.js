'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { HOSTELS } from '@/lib/constants';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export default function AgentOnboarding() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    registrationNo: '',
    hostel: '',
  });

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setCollegeIdFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.registrationNo || !form.hostel) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Register as agent
      await apiClient.post('/api/agents/register', form);

      // Upload college ID if provided
      if (collegeIdFile) {
        const formData = new FormData();
        formData.append('photo', collegeIdFile);
        await apiClient.post('/api/upload/college-id', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Agent registration submitted! Awaiting admin approval.');
      router.push('/agent/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Package className="h-8 w-8 text-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Become a Delivery Agent</h1>
          <p className="text-sm text-muted-foreground">
            Register to start accepting delivery requests from students
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

          <div className="space-y-2">
            <Label>College ID Card Photo</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-foreground/30 transition-colors"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="College ID" className="max-h-40 rounded-md object-contain" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload your college ID</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG (max 5MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/onboarding/student')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Register as a student instead
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
