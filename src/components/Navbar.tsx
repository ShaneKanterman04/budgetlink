"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-lg font-bold">
              BudgetLink
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                  Dashboard
                </Link>
                <Link href="/transactions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                  Transactions
                </Link>
                <Link href="/connect" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                  Connect
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
