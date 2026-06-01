import { Database, Flame, Wifi, RefreshCw } from 'lucide-react';
import { User } from '../types';

const schoolLogo = '/src/assets/images/logo_karapres_1780337245433.png';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  isGoogleConnected: boolean;
  isWhatsAppConnected: boolean;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export default function Header({
  currentUser,
  onLogout,
  isGoogleConnected,
  isWhatsAppConnected,
  onSyncNow,
  isSyncing = false
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-red-700 text-white shadow-lg border-b border-red-800">
      {/* Red & White Fine Motif Accent */}
      <div className="h-1 w-full bg-white opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & School Title */}
        <div className="flex items-center gap-4 select-none self-start md:self-auto">
          {/* Circular Shield Logo block */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-0.5 shadow-md border border-red-100 shrink-0 overflow-hidden">
            <img 
              src={schoolLogo} 
              alt="Logo KARAPRES 3" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black tracking-widest text-red-200 uppercase bg-red-900/60 border border-red-500/30 px-2 py-0.5 rounded-full">
                SDN 3 Karamatwangi
              </span>
              <span className="text-[10px] bg-red-950/60 text-red-200 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                V2.1.0-WEB
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter leading-none mt-1 flex items-center gap-2">
              <span>KARAPRES 3</span>
              <span className="text-red-400 font-extralight text-lg">|</span>
              <span className="text-xs font-semibold text-red-100 tracking-wide self-end mb-0.5">
                Presensi & Notifikasi Terpadu
              </span>
            </h1>
            <p className="text-[9px] text-red-250 font-medium tracking-widest uppercase opacity-80 mt-0.5">
              Kec. Cisurupan, Kabupaten Garut, Jawa Barat
            </p>
          </div>
        </div>

        {/* Dynamic Integration Badges & Sync Action */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Integrasi Google Badge */}
          <div
            title="Google Sheets & Google Drive Cloud Sync Status"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isGoogleConnected
                ? 'bg-red-800/40 text-red-100 border-red-500/30'
                : 'bg-red-950/50 text-red-200 border-red-500/20'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-green-300" />
            <span className="hidden sm:inline opacity-80">Google:</span>
            <span>{isGoogleConnected ? 'Tersinkron' : 'Terputus'}</span>
            <div className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          </div>

          {/* Integrasi WA Gateway Badge */}
          <div
            title="WhatsApp Notification Gateway API Connection"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isWhatsAppConnected
                ? 'bg-red-800/40 text-red-100 border-red-500/30'
                : 'bg-red-950/50 text-red-200 border-red-500/20'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline opacity-80 font-bold">WA Gateway:</span>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400">ONLINE</span>
          </div>

          {/* Sync Button */}
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-red-800/60 hover:bg-red-900/80 disabled:bg-red-950/30 text-white border border-red-600/50 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-200' : ''}`} />
              <span>{isSyncing ? 'Inisialisasi...' : 'Sync Data'}</span>
            </button>
          )}

          {/* User Profile Display */}
          {currentUser && (
            <div className="flex items-center gap-3 bg-red-850/50 border border-red-650 px-3.5 py-1.5 rounded-2xl ml-2 shadow-inner">
              <div className="text-right">
                <p className="text-xs font-black text-white tracking-tight leading-none">
                  {currentUser.namaLengkap}
                </p>
                <span className="text-[8px] font-black tracking-widest text-[#991b1b] bg-white px-1.5 py-0.5 rounded font-sans inline-block mt-1 uppercase">
                  {currentUser.role === 'admin'
                    ? 'ADMIN'
                    : currentUser.role === 'kepsek'
                    ? 'KEPALA SEKOLAH'
                    : currentUser.role === 'guru'
                    ? `WALI KELAS [${currentUser.kelasSpesifik || 'KELAS'}]`
                    : 'PETUGAS PIKET'}
                </span>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-750 font-black border-2 border-red-500 select-none text-sm shadow-md shrink-0">
                {currentUser.namaLengkap.substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                type="button"
                id="btn-action-logout"
                className="text-[10px] font-black text-red-300 hover:text-white px-2.5 py-1 rounded bg-red-800 hover:bg-red-900 transition-colors uppercase tracking-wider cursor-pointer font-sans"
                title="Keluar dari sistem"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
