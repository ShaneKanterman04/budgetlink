"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect based on authentication status
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
