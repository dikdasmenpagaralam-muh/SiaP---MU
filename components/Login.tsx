import React, { useState } from 'react';
import { User, Role } from '../types';
import { UserCheck, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

// Define specific accounts for each AUM/School
const ACCOUNTS = [
  { username: 'admin', password: '123', name: 'Administrator PDM', role: 'admin' as Role, unit: undefined },
  { username: 'sd', password: '123', name: 'Admin SD Muhammadiyah', role: 'user' as Role, unit: 'SD Muhammadiyah 1 Pagar Alam' },
  { username: 'smp', password: '123', name: 'Admin MTs/SMP Muhammadiyah', role: 'user' as Role, unit: 'MTs Muhammadiyah Pagar Alam' },
  { username: 'sma', password: '123', name: 'Admin SMA Muhammadiyah', role: 'user' as Role, unit: 'SMA Muhammadiyah Pagar Alam' },
  { username: 'smk', password: '123', name: 'Admin SMK Muhammadiyah', role: 'user' as Role, unit: 'SMK Muhammadiyah Pagar Alam' },
  { username: 'stkip', password: '123', name: 'Admin STKIP Muhammadiyah', role: 'user' as Role, unit: 'STKIP Muhammadiyah Pagar Alam' },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const account = ACCOUNTS.find(acc => acc.username === username && acc.password === password);

    if (account) {
      onLogin({
        username: account.username,
        name: account.name,
        role: account.role,
        unit: account.unit
      });
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <UserCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Absensi</h1>
          <p className="text-gray-500">PDM Pagar Alam</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Masuk Aplikasi
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 font-bold mb-2 text-center uppercase tracking-wide">Daftar Akun (Password: 123)</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>• admin (Pusat)</div>
            <div>• sd (SD Muh 1)</div>
            <div>• smp (MTs/SMP)</div>
            <div>• sma (SMA Muh)</div>
            <div>• smk (SMK Muh)</div>
            <div>• stkip (STKIP)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;