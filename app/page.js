'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

// just sends you to the right place
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? '/notes' : '/login');
  }, [user, loading, router]);

  return <p className="loading">Loading...</p>;
}
