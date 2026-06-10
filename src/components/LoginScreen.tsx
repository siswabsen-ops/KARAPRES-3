import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Check, AlertCircle, Info, Lock } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  accountsList: { user: User; pin: string }[];
}

export default function LoginScreen({ onLoginSuccess, accountsList }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual login handler
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !pin.trim()) {
      setErrorMsg('Username dan PIN wajib diisi.');
      return;
    }

    const matched = accountsList.find(
      (acc) => acc.user.username.toLowerCase() === username.trim().toLowerCase() && acc.pin === pin.trim()
    );

    if (matched) {
      onLoginSuccess(matched.user);
    } else {
      setErrorMsg('Kombinasi Username dan PIN salah. Silakan coba lagi.');
    }
  };

  // Demo user trigger (instant login)
  const handleDemoLogin = (user: User) => {
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Visual background decoration items */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl animate-pulse" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in-50 duration-300">
        {/* Left Aspect: Branding & Information (School Theme) */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 p-8 text-white flex flex-col justify-between relative">
          {/* Elegant top right badge */}
          <div className="absolute top-0 right-0 p-3">
            <span className="text-[9px] bg-white/10 backdrop-blur-md text-blue-100 font-bold px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest">
              PRIMARY ED
            </span>
          </div>

          <div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner mb-6">
              <Shield className="w-8 h-8 text-blue-100" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter leading-none font-display">DIGIWANGI 3</h2>
            <p className="text-sm font-semibold text-blue-200 mt-2 font-display uppercase tracking-widest">Digital Karamatwangi 3</p>
            <p className="text-xs text-blue-205/90 mt-1.5 leading-relaxed">
              Sistem manajemen kehadiran digital handal SDN 3 Karamatwangi, Kecamatan Cisurupan, Kabupaten Garut.
            </p>
          </div>

          <div className="space-y-4 my-8">
            <div className="p-4 bg-blue-950/40 rounded-2xl border border-white/10 backdrop-blur-sm text-xs leading-relaxed">
              <h4 className="font-bold mb-1 flex items-center gap-1.5 text-white">
                <Info className="w-4 h-4 text-amber-300" />
                Catatan Pengoperasian:
              </h4>
              <p className="text-blue-100 text-[11px]">
                Aplikasi mendukung sinkronisasi data dwi-perangkat HP (Android/iOS) dan Laptop/PC secara seketika (real-time).
              </p>
            </div>
          </div>

          <div className="text-[10px] text-blue-200 border-t border-blue-500/20 pt-4 flex items-center justify-between">
            <span>SDN 3 Karamatwangi © 2026</span>
            <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">GARUT</span>
          </div>
        </div>

        {/* Right Aspect: Authentication Terminal */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 font-display">
              <Lock className="w-5 h-5 text-blue-700" />
              Masuk Sistem Presensi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Silakan gunakan PIN demo cepat atau masukkan username & PIN terdaftar untuk masuk.
            </p>
          </div>

          {/* Quick Demo Access Buttons Grid */}
          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] font-black tracking-wider text-blue-700 block mb-2.5 uppercase font-display">
              🚀 AKSES CEPAT (AKUN DEMO SEJAHTERA)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {accountsList.map((acc) => {
                const getRoleColor = (role: string) => {
                  switch (role) {
                    case 'admin':
                      return 'bg-blue-700 hover:bg-blue-800 text-white';
                    case 'kepsek':
                      return 'bg-indigo-650 hover:bg-indigo-700 text-white';
                    case 'guru':
                      return 'bg-emerald-650 hover:bg-emerald-750 text-white';
                    default:
                      return 'bg-amber-600 hover:bg-amber-700 text-white';
                  }
                };
                const getRoleLabels = (user: User) => {
                  if (user.role === 'admin') return 'Admin';
                  if (user.role === 'kepsek') return 'Kepsek';
                  if (user.role === 'guru') return user.kelasSpesifik || 'Guru';
                  return 'Piket';
                };

                return (
                  <button
                    key={acc.user.id}
                    type="button"
                    id={`btn-login-demo-${acc.user.username}`}
                    onClick={() => handleDemoLogin(acc.user)}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-white transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow active:translate-y-0 cursor-pointer ${getRoleColor(
                      acc.user.role
                    )}`}
                  >
                    <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.2 rounded uppercase mb-1 font-mono tracking-wider">
                      {getRoleLabels(acc.user)}
                    </span>
                    <span className="font-extrabold text-xs truncate w-full tracking-tight">{acc.user.namaLengkap}</span>
                    <span className="text-[10px] opacity-90 mt-0.5 font-mono">PIN: {acc.pin}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase font-display">ATAU MANUAL</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-4 mt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Isi username akun (misal: admin, piket)"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium placeholder-slate-400 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">PIN Keamanan</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Isi 4 digit PIN (misal: 1234)"
                  maxLength={6}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-mono font-bold placeholder-slate-400 tracking-widest shadow-sm"
                />
                <button
                  type="button"
                  id="btn-toggle-show-pin"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              className="w-full bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 text-white rounded-xl py-2.5 font-bold text-sm transition-all shadow-md hover:shadow-lg transform active:scale-[0.99] cursor-pointer block text-center"
            >
              Masuk ke Aplikasi &rarr;
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
