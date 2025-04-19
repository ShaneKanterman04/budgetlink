"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: string;
  details: {
    category?: string;
    counterparty?: {
      name?: string;
      type?: string;
    };
  };
  status: string;
  type: string;
  accountName: string;
  institution: string;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/account/getData?userId=${user.userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  // Format currency amount
  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'auto'
    }).format(numAmount);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="card p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Transactions</h1>
          <p className="text-sm opacity-75">View and manage your transaction history</p>
        </div>
        
        <div className="card p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <div className="flex space-x-2">
              <button className="btn-primary text-sm py-1">Filter</button>
              <button className="btn-primary text-sm py-1">Export</button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium opacity-75 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium opacity-75 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium opacity-75 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium opacity-75 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium opacity-75 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.length === 0 ? (
                    <tr className="text-sm">
                      <td className="px-6 py-4 whitespace-nowrap">-</td>
                      <td className="px-6 py-4">No transactions available</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4">-</td>
                    </tr>
                  ) : (
                    transactions.map(transaction => (
                      <tr key={transaction.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
                        <td className="px-6 py-4">{transaction.description}</td>
                        <td className="px-6 py-4">{transaction.details?.category || 'N/A'}</td>
                        <td className="px-6 py-4">{transaction.accountName}</td>
                        <td className={`px-6 py-4 whitespace-nowrap ${parseFloat(transaction.amount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {formatAmount(transaction.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
