'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect } from 'react';

// Define the expected types for your Cloudflare data
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

// Main App Component with routing
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for a saved token on page load
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (authToken: string) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-orange-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f97316; /* Base orange color */
        }
      `}</style>
      {isLoggedIn ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

// Login Component
const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        onLogin(data.token);
      } else {
        // Handle error, e.g., show a message to the user
      }
    } catch (error) {
      // Handle network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-600">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-center text-orange-600">TheView Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white font-semibold bg-orange-500 rounded-md hover:bg-orange-600 transition-colors duration-200"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ token, onLogout }: { token: string; onLogout: () => void }) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/report', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setReport(data);
        } else {
          // Handle error
        }
      } catch (error) {
        // Handle network error
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h2 className="text-xl font-bold">Loading Cloudflare Data...</h2>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">TheView Dashboard</h1>
        <button onClick={onLogout} className="px-4 py-2 text-sm text-white font-semibold bg-orange-700 rounded-md hover:bg-orange-800 transition-colors duration-200">
          Log Out
        </button>
      </div>

      <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-orange-600">Total Account Usage</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="p-4 rounded-md bg-orange-100">
            <h3 className="text-sm font-semibold text-gray-800">Total Requests</h3>
            <p className="text-2xl font-bold text-orange-800">{report?.totals.requests.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-md bg-orange-100">
            <h3 className="text-sm font-semibold text-gray-800">Total Data Transfer</h3>
            <p className="text-2xl font-bold text-orange-800">{formatBytes(report?.totals.bandwidth)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-orange-600">Zone-specific Reports</h2>
        {report?.report.map((zone) => (
          <div key={zone.zoneName} className="p-4 mb-4 border rounded-md bg-orange-50 border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700">🌐 {zone.zoneName}</h3>
            <p className="text-sm text-gray-700">Requests: {zone.requests.toLocaleString()}</p>
            <p className="text-sm text-gray-700">Bandwidth: {formatBytes(zone.bandwidth)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
