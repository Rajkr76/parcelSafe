import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect based on role (will be determined after auth sync)
  // For now redirect to a generic page
  redirect('/auth/signin');
}
