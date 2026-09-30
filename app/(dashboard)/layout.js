'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';

// everything in this folder needs a logged in user.
// This only controls what the UI shows, the API checks permissions on every request.
export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (!user) return <p className="loading">Loading...</p>;

  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
    </>
  );
}
