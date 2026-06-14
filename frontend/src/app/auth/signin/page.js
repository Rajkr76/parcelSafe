'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import apiClient from '@/shared/api-client';
import { toast } from 'sonner';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (session?.user && !syncing) {
      setSyncing(true);
      syncUser(session.user);
    }
  }, [session]);

  async function syncUser(user) {
    try {
      const res = await apiClient.post('/api/auth/sync', {
        email: user.email,
        name: user.name,
        image: user.image,
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        const userData = res.data.user;

        if (!userData.profileCompleted) {
          if (userData.role === 'AGENT') {
            router.push('/onboarding/agent');
          } else {
            router.push('/onboarding/student');
          }
        } else {
          const roleRoutes = {
            ADMIN: '/admin/dashboard',
            AGENT: '/agent/dashboard',
            STUDENT: '/student/dashboard',
          };
          router.push(roleRoutes[userData.role] || '/student/dashboard');
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncing(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/signin' });
    } catch (err) {
      if(err.message === 'Too many authentication attempts.'){
        toast.error('Too many authentication attempts. Please try again later.');
      }
      console.error('Sign in error:', err);
      setLoading(false);
    }
  }

  if (status === 'loading' || syncing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {syncing ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-8 w-8 text-foreground" />
            <span className="text-2xl font-bold tracking-tight">ParcelSafe</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your college Google account to continue
          </p>
        </div>

        <Button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full h-12 text-sm font-medium gap-3"
          variant="outline"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <p className="text-xs text-muted-foreground/60 text-center mt-6">
          Only college email addresses are supported
        </p>
      </motion.div>
    </div>
  );
}
