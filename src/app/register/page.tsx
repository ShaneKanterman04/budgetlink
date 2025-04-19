'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Success - redirect to login
      alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Create an Account</h1>
        
        {submitError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter your name"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="Create a password"
            />
            {errors.password && <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 shadow-sm focus:ring-4 focus:ring-blue-300 focus:outline-none"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
