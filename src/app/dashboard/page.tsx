"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="card p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-lg mb-2">Welcome back, {user?.email}</p>
          <p className="text-sm opacity-75">Manage your financial data and budget tracking below</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-3">Accounts</h2>
            <p className="mb-4">View and manage your connected accounts</p>
            <button className="btn-primary">View Accounts</button>
          </div>
          
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-3">Transactions</h2>
            <p className="mb-4">Browse your recent transactions</p>
            <button className="btn-primary">View Transactions</button>
          </div>
          
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-3">Connect Bank</h2>
            <p className="mb-4">Link a new bank account to BudgetLink</p>
            <button className="btn-primary">Connect Account</button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
