'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect } from 'react';

// Define the expected types for your mock data
interface ZoneMetric {
  zoneName: string;
  requests: number;
  bandwidth: number;
}

interface ReportData {
  report: ZoneMetric[];
  totals: {
    requests: number;
    bandwidth: number;
  };
}

// Helper function to format bytes into a human-readable string
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Mock data to display after login
const MOCK_REPORT_DATA: ReportData = {
  report: [
    { zoneName: 'example.com', requests: 12345678, bandwidth: 524288000 },
    { zoneName: 'blog.example.com', requests: 567890, bandwidth: 10485760 },
    { zoneName: 'api.example.com', requests: 9876543, bandwidth: 2621440000 },
  ],
  totals: {
    requests: 22841021,
    bandwidth: 3156224000,
  },
};

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleLogin = (isAuthenticated: boolean) => {
    setIsLoggedIn(isAuthenticated);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Conditionally render based on login status
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-orange-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f97316; /* Base orange color */
        }
      `}</style>
      <div className="max-w-4xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Cloudflare Analytics (Mock)</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-orange-600 transition-colors duration-200 bg-white rounded-md shadow-sm hover:bg-gray-100"
          >
            Log Out
          </button>
        </div>

        <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-orange-600">Total Account Usage</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 rounded-md bg-orange-100">
              <h3 className="text-sm font-semibold text-gray-800">Total Requests</h3>
              <p className="text-2xl font-bold text-orange-800">{MOCK_REPORT_DATA.totals.requests.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-md bg-orange-100">
              <h3 className="text-sm font-semibold text-gray-800">Total Data Transfer</h3>
              <p className="text-2xl font-bold text-orange-800">{formatBytes(MOCK_REPORT_DATA.totals.bandwidth)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-orange-600">Zone-specific Reports</h2>
          {MOCK_REPORT_DATA.report.length > 0 ? (
            MOCK_REPORT_DATA.report.map((zone) => (
              <div key={zone.zoneName} className="p-4 mb-4 border rounded-md bg-orange-50 border-orange-200">
                <h3 className="text-lg font-semibold text-orange-700">{zone.zoneName}</h3>
                <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Requests:</p>
                    <p className="text-xl font-bold text-orange-800">{zone.requests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Bandwidth:</p>
                    <p className="text-xl font-bold text-orange-800">{formatBytes(zone.bandwidth)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No report data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for the login page
function LoginPage({ onLogin }: { onLogin: (isAuthenticated: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'user' && password === 'password') {
      onLogin(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="p-8 bg-white rounded-lg shadow-xl w-96">
        <h1 className="mb-6 text-2xl font-bold text-center text-orange-600">Log In to Cloudflare</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="user"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="password"
            />
          </div>
          {errorMessage && (
            <p className="mb-4 text-sm text-center text-red-500">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 font-semibold text-white transition-colors duration-200 bg-orange-600 rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
