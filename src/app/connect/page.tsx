"use client";
import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function Connect() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<{message: string, isError: boolean} | null>(null);
  const tellerConnectRef = useRef(null);
  const { user } = useAuth();

  const handleTellerButtonClick = () => {
    if (tellerConnectRef.current) {
      tellerConnectRef.current.open();
    }
  };

  // Initialize Teller Connect after the script is loaded
  useEffect(() => {
    if (isScriptLoaded && typeof window !== 'undefined' && window.TellerConnect) {
      tellerConnectRef.current = window.TellerConnect.setup({
        applicationId: "app_pcg1pd1k5drjtjfmbe000", // Replace with your actual application ID
        products: ["verify", "balance", "transactions"], // Adjust based on your needs
        environment: "sandbox", // Use "production" for live environments
        onInit: function() {
          console.log("Teller Connect has initialized");
        },
        onSuccess: async function(enrollment) {
          console.log("User enrolled successfully", enrollment);
          
          // Only proceed if we have a user ID
          if (!user?.userId) {
            setEnrollmentStatus({
              message: "Cannot store enrollment: user not authenticated properly",
              isError: true
            });
            return;
          }
          
          setIsEnrolling(true);
          setEnrollmentStatus(null);
          
          try {
            // Send the enrollment data to our backend
            const response = await fetch('/api/account/enroll', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.userId,
                enrollments: JSON.stringify(enrollment)
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to store enrollment data');
            }

            setEnrollmentStatus({
              message: "Your bank account was successfully connected!",
              isError: false
            });
          } catch (error) {
            console.error('Error storing enrollment:', error);
            setEnrollmentStatus({
              message: error instanceof Error ? error.message : 'An error occurred while storing your bank connection',
              isError: true
            });
          } finally {
            setIsEnrolling(false);
          }
        },
        onExit: function() {
          console.log("User closed Teller Connect");
        },
        onFailure: function(failure) {
          console.error("Teller Connect failure:", failure);
          setEnrollmentStatus({
            message: "Connection failed: " + (failure.message || "Please try again later"),
            isError: true
          });
        }
      });
    }
  }, [isScriptLoaded, user]);
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="card p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Connect Your Bank Account</h1>
          <p className="text-sm opacity-75">Link your bank accounts to BudgetLink to start managing your finances</p>
        </div>
        
        {enrollmentStatus && (
          <div className={`card p-4 mb-6 ${enrollmentStatus.isError ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
            <p className={`${enrollmentStatus.isError ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
              {enrollmentStatus.message}
            </p>
          </div>
        )}
        
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Securely Connect Your Accounts</h2>
          <p className="mb-6 max-w-md mx-auto">
            We use Teller to securely connect to your financial institutions. Your credentials are never stored on our servers.
          </p>
          
          <button 
            id="teller-connect" 
            onClick={handleTellerButtonClick}
            disabled={isEnrolling}
            className="btn-primary py-3 px-8 text-lg"
          >
            {isEnrolling ? 'Connecting...' : 'Connect with Teller'}
          </button>
          
          <p className="mt-4 text-sm opacity-75">
            By connecting your account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      
      {/* Teller Connect Script */}
      <Script 
        src="https://cdn.teller.io/connect/connect.js" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Teller Connect script loaded");
          setIsScriptLoaded(true);
        }}
      />
    </ProtectedRoute>
  );
}
