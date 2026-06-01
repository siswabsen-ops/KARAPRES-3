import React, { useState } from 'react';
import {
  Users,
  Sliders,
  BellRing,
  Clock,
  Database,
  History,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  FileCheck,
  Printer,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Siswa, SystemSettings, ActivityLog, User, Role } from '../types';
import BarcodeRenderer from './BarcodeRenderer';

interface AdminPanelProps {
  siswaList: Siswa[];
  onAddSiswa: (siswa: Siswa) => void;
  onUpdateSiswa: (siswa: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  activityLogs: ActivityLog[];
  onClearLogs?: () => void;
  googleToken?: string | null;
  googleUser?: any | null;
  onConnectGoogle?: () => Promise<void>;
  onDisconnectGoogle?: () => Promise<void>;
  onCreateNewSpreadsheet?: () => Promise<string>;
  onBackupToDrive?: () => Promise<void>;
  isSyncing?: boolean;
  accountsList: { user: User; pin: string }[];
  onUpdateAccount: (userId: string, updatedUser: Partial<User>, newPin?: string) => void;
  onAddAccount: (user: User, pin: string) => void;
  onDeleteAccount: (userId: string) => void;
}

type AdminTab = 'siswa' | 'kelas' | 'whatsapp' | 'waktu' | 'google' | 'audit' | 'akun';

export default function AdminPanel({
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  settings,
  onSaveSettings,
  activityLogs,
  onClearLogs,
  googleToken = null,
  googleUser = null,
  onConnectGoogle,
  onDisconnectGoogle,
  onCreateNewSpreadsheet,
  onBackupToDrive,
  isSyncing = false,
  accountsList,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('siswa');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local states for Siswa Form
  const [isEditingSiswa, setIsEditingSiswa] = useState<string | null>(null); // Siswa ID
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('Kelas 1');
  const [jk, setJk] = useState<'L' | 'P'>('L');
  const [waOrangTua, setWaOrangTua] = useState('');

  // Custom modal state for deleting student
  const [siswaToDelete, setSiswaToDelete] = useState<Siswa | null>(null);

  // Local States for custom Settings fields
  const [jamMasuk, setJamMasuk] = useState(settings.jamMasuk);
  const [jamToleransi, setJamToleransi] = useState(settings.jamToleransi);
  const [templatePesan, setTemplatePesan] = useState(settings.templatePesan);
  const [spreadsheetId, setSpreadsheetId] = useState(settings.googleSpreadsheetId);
  const [driveFolderId, setDriveFolderId] = useState(settings.googleDriveFolderId);

  // Card view layout switcher for individual pupils printing helper
  const [selectedPrintSiswa, setSelectedPrintSiswa] = useState<Siswa | null>(null);

  // Local states for Admin / Operator Account Forms
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountNamaLengkap, setAccountNamaLengkap] = useState('');
  const [accountRole, setAccountRole] = useState<Role>('piket');
  const [accountPin, setAccountPin] = useState('');
  const [accountKelasSpesifik, setAccountKelasSpesifik] = useState('');
  const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);

  const displayNotice = (type: 'success' | 'err', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Submit and state handlers for modifying / adding operator accounts
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountUsername.trim() || !accountNamaLengkap.trim() || !accountPin.trim()) {
      displayNotice('err', 'Nama Lengkap, Username, dan PIN wajib diisi.');
      return;
    }

    if (accountPin.trim().length < 4) {
      displayNotice('err', 'PIN Keamanan harus berjumlah minimal 4 karakter.');
      return;
    }

    // Check username uniqueness
    const isConflict = accountsList.some(acc => 
      acc.user.id !== editingAccountId && 
      acc.user.username.toLowerCase() === accountUsername.trim().toLowerCase()
    );

    if (isConflict) {
      displayNotice('err', `Username "${accountUsername}" sudah dipakai oleh operator lain.`);
      return;
    }

    if (editingAccountId) {
      const updatedUser: Partial<User> = {
        username: accountUsername.trim().toLowerCase(),
        namaLengkap: accountNamaLengkap.trim(),
        role: accountRole,
        kelasSpesifik: accountRole === 'guru' ? (accountKelasSpesifik || 'Semua Kelas') : undefined
      };
      onUpdateAccount(editingAccountId, updatedUser, accountPin.trim());
      displayNotice('success', `Akun ${accountNamaLengkap} berhasil diperbarui.`);
      resetAccountForm();
    } else {
      const newUserId = `usr-${Date.now()}`;
      const newAcc: User = {
        id: newUserId,
        username: accountUsername.trim().toLowerCase(),
        namaLengkap: accountNamaLengkap.trim(),
        role: accountRole,
        kelasSpesifik: accountRole === 'guru' ? (accountKelasSpesifik || 'Semua Kelas') : undefined
      };
      onAddAccount(newAcc, accountPin.trim());
      displayNotice('success', `Akun baru ${accountNamaLengkap} berhasil dibuat.`);
      resetAccountForm();
    }
  };

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountUsername('');
    setAccountNamaLengkap('');
    setAccountRole('piket');
    setAccountPin('');
    setAccountKelasSpesifik('Kelas 1');
    setIsAddingNewAccount(false);
  };

  const startEditAccount = (acc: { user: User; pin: string }) => {
    setEditingAccountId(acc.user.id);
    setAccountUsername(acc.user.username);
    setAccountNamaLengkap(acc.user.namaLengkap);
    setAccountRole(acc.user.role);
    setAccountPin(acc.pin);
    setAccountKelasSpesifik(acc.user.role === 'guru' ? (acc.user.kelasSpesifik || 'Kelas 1') : 'Kelas 1');
    setIsAddingNewAccount(false);
  };

  // Submit handler for CRUD student
  const handleSiswaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim() || !nama.trim() || !waOrangTua.trim()) {
      displayNotice('err', 'Semua formulir pendaftaran siswa wajib diisi penuh.');
      return;
    }

    // NIS validation
    if (!isEditingSiswa && siswaList.some((s) => s.nis === nis.trim())) {
      displayNotice('err', `Data gagal disimpan. NIS ${nis} sudah terdaftar di sistem.`);
      return;
    }

    const payload: Siswa = {
      id: isEditingSiswa || `sis-${Date.now()}`,
      nis: nis.trim(),
      nama: nama.trim(),
      kelas,
      jenisKelamin: jk,
      waOrangTua: waOrangTua.trim(),
    };

    if (isEditingSiswa) {
      onUpdateSiswa(payload);
      displayNotice('success', `Berhasil memperbarui data siswa: ${nama}`);
      setIsEditingSiswa(null);
    } else {
      onAddSiswa(payload);
      displayNotice('success', `Berhasil mendaftarkan siswa baru: ${nama}`);
    }

    // Reset Form
    setNis('');
    setNama('');
    setKelas('Kelas 1');
    setJk('L');
    setWaOrangTua('');
  };

  const handleEditClick = (siswa: Siswa) => {
    setIsEditingSiswa(siswa.id);
    setNis(siswa.nis);
    setNama(siswa.nama);
    setKelas(siswa.kelas);
    setJk(siswa.jenisKelamin);
    setWaOrangTua(siswa.waOrangTua);
    document.getElementById('siswa-form-ref')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditingSiswa(null);
    setNis('');
    setNama('');
    setKelas('Kelas 1');
    setJk('L');
    setWaOrangTua('');
  };

  // Save Settings actions
  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemSettings = {
      ...settings,
      jamMasuk,
      jamToleransi,
      templatePesan,
      googleSpreadsheetId: spreadsheetId,
      googleDriveFolderId: driveFolderId,
    };
    onSaveSettings(updated);
    displayNotice('success', 'Seluruh konfigurasi sistem berhasil disimpan dan disinkronkan.');
  };

  // Print trigger for printing student ID wrapper
  const triggerPrintWindow = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    // Simple custom print frame rendering
    document.body.innerHTML = `
      <html>
        <head>
          <title>Kartu Absensi SDN 3 Karamatwangi</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-white; }
            .print-card-frame { border: 4px solid #e11d48; border-radius: 16px; padding: 24px; width: 350px; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header-banner { background-color: #e11d48; color: white; padding: 10px; font-weight: bold; font-size: 14px; border-radius: 8px; margin-bottom: 20px; }
            .student-info { margin-top: 15px; font-weight: bold; font-size: 16px; color: #1e293b; }
            .meta-desc { font-size: 11px; color: #64748b; margin-top: 4px; }
            .footer-copyright { font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="print-card-frame">
            <div class="header-banner">KARTU SISWA ELEKTRONIK<br/>SDN 3 KARAMATWANGI</div>
            <div style="display: flex; justify-content: center; margin: 15px 0;">
              ${printContent.innerHTML}
            </div>
            <div class="student-info">${selectedPrintSiswa?.nama}</div>
            <div class="meta-desc">NIS: ${selectedPrintSiswa?.nis} • ${selectedPrintSiswa?.kelas}</div>
            <div class="meta-desc" style="font-style: italic;">Suku Cadang Utama KARAPRES 3 App • Kab. Garut</div>
            <div class="footer-copyright">SDN 3 Karamatwangi, Cisurupan, Garut</div>
          </div>
        </body>
      </html>
    `;
    
    window.print();
    // Restore page
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* SUCCESS & ERROR MESSAGE FLOATER */}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ADMIN PANEL INNER GRID: Left Tab Selection, Right Console View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar column (3 cols) */}
        <div className="lg:col-span-3 space-y-3.5">
          <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-sm">
            <span className="text-[10px] font-black tracking-widest text-slate-400 block mb-3 uppercase font-display">MENU ADMIN</span>
            
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveTab('siswa'); setSelectedPrintSiswa(null); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'siswa'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  Pengelolaan Siswa
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('kelas')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'kelas'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4" />
                  Pembagian Kelas (1-6)
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BellRing className="w-4 h-4" />
                  Pengaturan Pesan WA
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('waktu')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'waktu'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  Batas Waktu Hadir
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('google')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Database className="w-4 h-4" />
                  Google Cloud Sync
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  Riwayat Audit Sistem
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('akun')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'akun'
                    ? 'bg-red-50 text-red-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4" />
                  Pengaturan Akun Admin
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </nav>
          </div>
        </div>

        {/* Content Console (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: PENGELOLAAN DATA SISWA */}
          {activeTab === 'siswa' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form Tambah/Ubah Siswa (5 cols) */}
              <div 
                id="siswa-form-ref" 
                className={`md:col-span-5 bg-white rounded-3xl p-5 border transition-all duration-300 self-start ${
                  isEditingSiswa 
                    ? 'border-red-500 ring-4 ring-red-50/70 shadow-xl scale-[1.01]' 
                    : 'border-slate-250 shadow-sm'
                }`}
              >
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2.5 flex items-center gap-2 font-display">
                  <UserPlus className="w-4.5 h-4.5 text-red-700 font-bold" />
                  {isEditingSiswa ? '✏️ EDIT DATA SISWA' : '📝 DAFTAR SISWA BARU'}
                </h3>

                {isEditingSiswa && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[11px] font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                    <span className="w-2 h-2 bg-red-700 rounded-full animate-ping shrink-0" />
                    <span>Anda sedang menyunting profil: <b>{nama}</b> (NIS {nis})</span>
                  </div>
                )}

                <form onSubmit={handleSiswaSubmit} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Nomor Induk Siswa (NIS)</label>
                    <input
                      type="text"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Isi NIS unik (contoh: 30409)"
                      disabled={!!isEditingSiswa}
                      className="w-full bg-white border border-gray-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-750 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Nama Lengkap Murid</label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama lengkap tanpa gelar"
                      className="w-full bg-white border border-gray-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-750"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Kelas SDN 3</label>
                      <select
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-750 font-semibold text-slate-700"
                      >
                        {Array.from({ length: 6 }).map((_, i) => (
                          <option key={i} value={`Kelas ${i + 1}`}>
                            Kelas {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Jenis Kelamin</label>
                      <div className="flex border border-gray-300 rounded-xl overflow-hidden text-xs bg-slate-50 p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setJk('L')}
                          className={`flex-1 py-1 px-1 rounded-md text-center font-bold relative cursor-pointer ${
                            jk === 'L' ? 'bg-red-700 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Laki-Laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setJk('P')}
                          className={`flex-1 py-1 px-1 rounded-md text-center font-bold relative cursor-pointer ${
                            jk === 'P' ? 'bg-red-700 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Perempuan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Nomor WhatsApp Wali</label>
                    <input
                      type="text"
                      value={waOrangTua}
                      onChange={(e) => setWaOrangTua(e.target.value)}
                      placeholder="Isi No HP orang tua/wali (misal: 0812345678)"
                      className="w-full bg-white border border-gray-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-750"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Kami otomatis memoles awalan 0 ke nomor internasional saat kirim WA.</p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      id="btn-action-save-siswa"
                      className="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-xl py-2 font-bold text-xs transition-all shadow-md cursor-pointer block text-center"
                    >
                      {isEditingSiswa ? 'Terapkan Update' : 'Daftarkan Siswa'}
                    </button>
                    {isEditingSiswa && (
                      <button
                        type="button"
                        id="btn-action-cancel-siswa"
                        onClick={handleCancelEdit}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl py-2 px-3.5 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Data Siswa (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                {/* Visual Card Generator Preview Station (If selected) */}
                {selectedPrintSiswa ? (
                  <div className="bg-white rounded-3xl p-5 border-2 border-rose-550 shadow-md text-center space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                      <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">
                        📛 PEMBUATAN KARTU ABSENSI ELEKTRONIK SISWA
                      </h4>
                      <button
                        type="button"
                        id="btn-print-close-card"
                        onClick={() => setSelectedPrintSiswa(null)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600"
                      >
                        Tutup Kartu
                      </button>
                    </div>

                    <div className="max-w-[280px] mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      {/* Virtual Code 39 canvas container target inside print frame */}
                      <div id="barcode-print-canvas-area">
                        <BarcodeRenderer value={selectedPrintSiswa.nis} />
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="font-extrabold text-sm text-slate-800 leading-none">{selectedPrintSiswa.nama}</h5>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-1.5">
                          {selectedPrintSiswa.kelas} • NIS {selectedPrintSiswa.nis}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-normal">
                      Gunakan tombol cetak di bawah untuk mencetak kartu ini dengan ukuran pas 10x6cm, tempel pada gantungan kartu siswa!
                    </p>

                    <button
                      type="button"
                      id="btn-print-barcode"
                      onClick={() => triggerPrintWindow('barcode-print-canvas-area')}
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Kartu Siswa & Barcode
                    </button>
                  </div>
                ) : null}

                {/* Primary Student Directory */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      📋 DIREKTORI SISWA SDN 3 ({siswaList.length} Anak)
                    </h3>
                  </div>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {siswaList.map((siswa) => (
                      <div
                        key={siswa.id}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 max-w-[60%]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            siswa.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {siswa.nama.charAt(0)}
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-gray-800 truncate leading-none">{siswa.nama}</h4>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              NIS {siswa.nis} • <b>{siswa.kelas}</b>
                            </span>
                            <span className="text-[9px] text-indigo-700 block mt-0.5">
                              📞 WA Wali: {siswa.waOrangTua}
                            </span>
                          </div>
                        </div>

                        {/* Direct action tools */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-target-print-siswa-${siswa.nis}`}
                            onClick={() => setSelectedPrintSiswa(siswa)}
                            className="bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Generate barcode cetak"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            id={`btn-target-edit-siswa-${siswa.nis}`}
                            onClick={() => handleEditClick(siswa)}
                            className="bg-amber-50 text-amber-600 hover:bg-amber-150 border border-amber-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit data siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            id={`btn-target-delete-siswa-${siswa.nis}`}
                            onClick={() => setSiswaToDelete(siswa)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Hapus data siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEMBAGIAN KELAS 1-6 */}
          {activeTab === 'kelas' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">
                  🏫 PENGELOLAAN DISTRIBUSI KELAS (KELAS 1 SITTING KELAS 6)
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Berikut pembagian rincian kuantitas murid di setiap rombongan belajar (rombel) SDN 3 Karamatwangi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const targetKelas = `Kelas ${idx + 1}`;
                  const countSiswa = siswaList.filter((s) => s.kelas === targetKelas).length;
                  const filterSiswa = siswaList.filter((s) => s.kelas === targetKelas);

                  return (
                    <div key={idx} className="p-4 bg-slate-50 border border-gray-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-black text-rose-600">{targetKelas}</span>
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                            {countSiswa} Murid
                          </span>
                        </div>
                        
                        {/* Compact list pupils */}
                        <div className="mt-3 space-y-1 max-h-[88px] overflow-y-auto">
                          {filterSiswa.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">Belum ada siswa terdaftar</span>
                          ) : (
                            filterSiswa.map((fs) => (
                              <div key={fs.id} className="text-[10px] text-gray-600 truncate border-b border-gray-100 pb-0.5">
                                • {fs.nama} ({fs.nis})
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 mt-3 pt-2 text-[10px] text-gray-400 font-mono">
                        SDN 3 KARAMATWANGI
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN TEMPLATE PESAN WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-rose-500 animate-pulse" />
                  PENGATURAN TEMPLATE NOTIFIKASI WHATSAPP WALI MURID
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Tentukan kata-kata pesan WhatsApp yang otomatis dikirim ke nomor telepon orang tua murid.
                </p>
              </div>

              <form onSubmit={handleSaveAllSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase">Isi Pesan Notifikasi:</label>
                  <textarea
                    rows={8}
                    value={templatePesan}
                    onChange={(e) => setTemplatePesan(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                    placeholder="Masukkan template pesan notifikasi..."
                  />
                </div>

                {/* Legend token parser */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2">
                  <span className="text-[10px] font-black tracking-wider text-rose-600 uppercase">🏷️ TOKEN PARSER YANG DIDUKUNG SEKETIKA (Dapat Dipakai):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px] text-slate-650">
                    <div className="bg-white py-1 px-2 border rounded font-semibold"><code>[Nama Lengkap Siswa]</code></div>
                    <div className="bg-white py-1 px-2 border rounded font-semibold"><code>[Kelas]</code></div>
                    <div className="bg-white py-1 px-2 border rounded font-semibold"><code>[NIS]</code></div>
                    <div className="bg-white py-1 px-2 border rounded font-semibold"><code>[Status Kehadiran]</code></div>
                    <div className="bg-white py-1 px-2 border rounded font-semibold"><code>[Jam:Menit]</code></div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-save-whatsapp-settings"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 px-6 font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    Simpan Template Pesan WA Gateway
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PENGATURAN BATAS WAKTU KEHADIRAN */}
          {activeTab === 'waktu' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Clock className="w-5 h-5 text-rose-500" />
                  KONFIGURASI BATAS MASUK & TOLERANSI TERLAMBAT
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Tentukan jam masuk resmi SDN 3 Karamatwangi. Siswa yang memindai melampaui jam toleransi akan otomatis didata sebagai "Terlambat".
                </p>
              </div>

              <form onSubmit={handleSaveAllSettings} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jam Masuk Sekolah</label>
                    <input
                      type="time"
                      value={jamMasuk}
                      onChange={(e) => setJamMasuk(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jam Toleransi Terlambat</label>
                    <input
                      type="time"
                      value={jamToleransi}
                      onChange={(e) => setJamToleransi(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-400">
                  *Batas toleransi direkomendasikan adalah 15 menit setelah lonceng sekolah berbunyi (misalnya jam masuk 07:00, jam toleransi 07:15).
                </p>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-save-waktu-settings"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 px-6 font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    Simpan Batas Waktu
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: INTEGRASI GOOGLE SPREADSHEET & GOOGLE DRIVE */}
          {activeTab === 'google' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 font-display">
                    <Database className="w-5 h-5 text-emerald-500" />
                    KONEKTIVITAS INTEGRASI GOOGLE SPREADSHEET & DRIVE
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-normal font-sans">
                    Hubungkan serta cadangkan daftar siswa dan riwayat presensi harian langsung ke Google Sheets & Google Drive.
                  </p>
                </div>

                {/* Google Connection Status Indicator and Button */}
                <div className="shrink-0">
                  {googleToken ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-left font-sans">
                        <span className="text-[9px] font-black bg-emerald-600 text-white py-0.5 px-2 rounded-full uppercase block w-fit">
                          TERKONEKSI
                        </span>
                        <p className="text-xs font-bold text-slate-800 max-w-xs truncate mt-1">
                          {googleUser?.email || 'Akun Google Aktif'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onDisconnectGoogle}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-650 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                      >
                        Putuskan
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5 font-sans">
                      {/* Styled client side Google button */}
                      <button
                        type="button"
                        onClick={onConnectGoogle}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm py-2 px-4 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Sambungkan ke Google</span>
                      </button>
                      <span className="text-[10px] text-amber-600 font-medium">
                        ⚠️ Hubungkan akun untuk sinkronisasi live Google Sheets.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Google Fields Form */}
              <form onSubmit={handleSaveAllSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center justify-between font-display">
                      <span>📊 Google Spreadsheet-ID</span>
                      <span className="text-[10px] bg-slate-100 py-0.5 px-2 rounded-md font-mono text-slate-500 font-normal">Wajib</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="ID lembar spreadsheets utama"
                        className="flex-1 bg-white border border-gray-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                      {onCreateNewSpreadsheet && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!googleToken) {
                              displayNotice('err', 'Harap sambungkan ke Google terlebih dahulu sebelum membuat Spreadsheet baru.');
                              return;
                            }
                            try {
                              const newId = await onCreateNewSpreadsheet();
                              setSpreadsheetId(newId);
                              displayNotice('success', 'Spreadsheet baru berhasil dibuat dan ID terisi otomatis!');
                            } catch (err: any) {
                              displayNotice('err', err.message || 'Gagal membuat spreadsheet.');
                            }
                          }}
                          disabled={isSyncing}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 text-white rounded-xl px-3.5 text-[11px] font-black tracking-tight whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center gap-1 font-sans shadow-sm"
                          title="Buatkan Google Spreadsheet baru di Drive Anda"
                        >
                          ✨ Buatkan Baru
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 block hover:underline cursor-pointer font-sans">
                      Format: docs.google.com/spreadsheets/d/<span className="font-extrabold font-mono text-slate-800 bg-slate-100 px-1 rounded">{spreadsheetId || '[SPREADSHEET_ID]'}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center justify-between font-display">
                      <span>📁 Google Drive Folder-ID</span>
                      <span className="text-[10px] bg-slate-100 py-0.5 px-2 rounded-md font-mono text-slate-500 font-normal">Arsip Folder</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={driveFolderId}
                        onChange={(e) => setDriveFolderId(e.target.value)}
                        placeholder="ID folder Google Drive cadangan"
                        className="flex-1 bg-white border border-gray-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                      {onBackupToDrive && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!googleToken) {
                              displayNotice('err', 'Harap hubungkan akun Google Anda terlebih dahulu.');
                              return;
                            }
                            onBackupToDrive();
                          }}
                          disabled={isSyncing}
                          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-55 text-white rounded-xl px-3.5 text-[11px] font-black tracking-tight whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center gap-1 font-sans shadow-sm"
                          title="Unggah berkas backup saat ini ke Google Drive"
                        >
                          📦 Backup CSV
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 block hover:underline cursor-pointer font-sans">
                      Format: drive.google.com/drive/folders/<span className="font-extrabold font-mono text-slate-800 bg-slate-100 px-1 rounded">{driveFolderId || '[FOLDER_ID]'}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                  <div className="flex gap-2.5 text-xs text-emerald-800 font-sans">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold uppercase tracking-wider text-[11px]">SINKRONISASI AKTIF & DINAMIS</h5>
                      <p className="text-[11px] leading-relaxed mt-0.5 font-medium text-slate-600">
                        Pendaftaran siswa baru dan log scan presensi masuk akan otomatis tersimpan dalam Web Storage aman, dan dieksekusi sinkronisasi dwi-perangkat saat menekan tombol <b>Sync Data</b> di atas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 font-sans">
                  <button
                    type="submit"
                    id="btn-save-google-settings"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 px-6 font-bold text-xs transition-all shadow cursor-pointer font-semibold"
                  >
                    Simpan Integrasi Google ID
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: AUDIT LOG RIWAYAT AKTIVITAS */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">
                    🕵️ RIWAYAT AUDIT & JEJAK AKTIVITAS OPERATOR
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    Menyimpan data otentik siapa yang melakukan presensi dan memelihara sistem untuk pelaporan Kepala Sekolah.
                  </p>
                </div>
                {onClearLogs && (
                  <button
                    onClick={onClearLogs}
                    type="button"
                    id="btn-clear-audit-logs"
                    className="text-xs font-bold text-rose-650 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 py-1 px-3 border border-rose-200 rounded-lg cursor-pointer"
                  >
                    Reset Audit Log
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {[...activityLogs].reverse().map((log) => {
                  const formatTime = new Date(log.waktu).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  const formatDate = new Date(log.waktu).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                    >
                      <div className="text-xs space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-800">{log.user}</span>
                          <span className="text-[9px] uppercase tracking-wider text-rose-600 bg-rose-100 px-1 rounded-sm font-bold">
                            {log.role}
                          </span>
                        </div>
                        <p className="text-slate-600 font-bold text-[11px]">{log.tindakan}</p>
                        <p className="text-gray-500 text-[10px] leading-tight-none">{log.detail}</p>
                      </div>

                      <div className="text-left sm:text-right text-[10px] text-gray-400 shrink-0 select-none">
                        <div>{formatDate}</div>
                        <div> pukul {formatTime} WIB</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: PENGATURAN AKUN ADMIN & OPERATOR */}
          {activeTab === 'akun' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-150 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-display">
                    🛡️ PENGATURAN & KREDENSI AKUN OPERATOR
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    Kelola nama lengkap, nama pengguna (username), kata sandi PIN, serta peranan hak akses operator KARAPRES 3.
                  </p>
                </div>
                {!isAddingNewAccount && !editingAccountId && (
                  <button
                    onClick={() => {
                      resetAccountForm();
                      setIsAddingNewAccount(true);
                    }}
                    type="button"
                    className="text-xs font-bold text-red-750 hover:text-white bg-red-50 hover:bg-red-700 py-1.5 px-3.5 border border-red-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Akun Operator
                  </button>
                )}
              </div>

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200 font-sans">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-850 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200 font-sans">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                {/* Left Side: Accounts List */}
                <div className={`space-y-3 lg:col-span-${isAddingNewAccount || editingAccountId ? '7' : '12'}`}>
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase block mb-1">
                    Daftar Akun Terdaftar ({accountsList.length})
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
                    {accountsList.map((acc) => {
                      const getRoleBadgeColor = (role: string) => {
                        switch (role) {
                          case 'admin': return 'bg-red-100 text-red-700 border-red-200';
                          case 'kepsek': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                          case 'guru': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                          default: return 'bg-amber-100 text-amber-700 border-amber-200';
                        }
                      };

                      return (
                        <div
                          key={acc.user.id}
                          className={`p-4 bg-slate-50 hover:bg-slate-100/60 transition-all border rounded-2xl flex items-start justify-between gap-4 ${
                            editingAccountId === acc.user.id ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : 'border-slate-200'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-xs sm:text-sm truncate block leading-none">
                                {acc.user.namaLengkap}
                              </span>
                              <span className={`text-[9px] font-black border uppercase px-1.5 py-0.5 rounded-md ${getRoleBadgeColor(acc.user.role)}`}>
                                {acc.user.role === 'guru' && acc.user.kelasSpesifik ? `${acc.user.role} (${acc.user.kelasSpesifik})` : acc.user.role}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
                              <span>Username: <strong className="text-slate-600">{acc.user.username}</strong></span>
                              <span>•</span>
                              <span>PIN Keamanan: <strong className="text-rose-700">{acc.pin}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditAccount(acc)}
                              className="p-1.5 text-slate-500 hover:text-red-750 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                              title="Ubah detail akun"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Make sure we don't let them delete critical initial or active accounts */}
                            <button
                              type="button"
                              onClick={() => {
                                if (acc.user.id === 'usr-admin' || acc.user.id === 'usr-kepsek') {
                                  displayNotice('err', 'Akun master administrator & Kepala Sekolah tidak boleh dihapus.');
                                  return;
                                }
                                onDeleteAccount(acc.user.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Hapus operator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Form Create & Edit */}
                {(isAddingNewAccount || editingAccountId) && (
                  <div className="lg:col-span-5 bg-slate-50/60 p-5 border border-slate-200 rounded-3xl space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-red-700" />
                        {editingAccountId ? 'Ubah Profil Operator' : 'Daftarkan Akun Baru'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {editingAccountId ? 'Perbarui username, nama, atau PIN operator yang dipilih.' : 'Isi kolom di bawah untuk membagikan akses presensi.'}
                      </p>
                    </div>

                    <form onSubmit={handleAccountSubmit} className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-650 uppercase tracking-wider mb-1.5">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={accountNamaLengkap}
                          onChange={(e) => setAccountNamaLengkap(e.target.value)}
                          placeholder="Contoh: Budi Santoso, S.Pd."
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-700 shadow-2xs placeholder-slate-400 font-sans"
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-650 uppercase tracking-wider mb-1.5">
                          Username Login
                        </label>
                        <input
                          type="text"
                          value={accountUsername}
                          onChange={(e) => setAccountUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          placeholder="Contoh: budis"
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-700 shadow-2xs placeholder-slate-400"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block leading-tight">
                          Gunakan huruf kecil rapat tanpa spasi.
                        </span>
                      </div>

                      {/* PIN Keamanan */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-650 uppercase tracking-wider mb-1.5">
                          PIN Masuk (Min 4 digit/angka)
                        </label>
                        <input
                          type="text"
                          value={accountPin}
                          onChange={(e) => setAccountPin(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          placeholder="Isi 4 d/d 6 digit angka"
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3.5 text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-red-700 shadow-2xs placeholder-slate-400 tracking-widest text-center"
                        />
                      </div>

                      {/* Role selection */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-650 uppercase tracking-wider mb-1.5">
                          Hak Akses / Peranan (Role)
                        </label>
                        <select
                          value={accountRole}
                          onChange={(e) => setAccountRole(e.target.value as Role)}
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-red-700 shadow-2xs text-slate-700 focus:outline-none"
                        >
                          <option value="admin">Administrator (Admin Master)</option>
                          <option value="kepsek">Kepala Sekolah (Kepsek)</option>
                          <option value="guru">Guru Kelas (Wali Kelas)</option>
                          <option value="piket">Petugas Piket Gerbang</option>
                        </select>
                      </div>

                      {/* Specific Class Selector if Guru is selected */}
                      {accountRole === 'guru' && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-650 uppercase tracking-wider mb-1.5">
                            Spesifik Mengampu Kelas
                          </label>
                          <select
                            value={accountKelasSpesifik}
                            onChange={(e) => setAccountKelasSpesifik(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-red-700 shadow-2xs text-slate-700 focus:outline-none"
                          >
                            <option value="Kelas 1">Kelas 1</option>
                            <option value="Kelas 2">Kelas 2</option>
                            <option value="Kelas 3">Kelas 3</option>
                            <option value="Kelas 4">Kelas 4</option>
                            <option value="Kelas 5">Kelas 5</option>
                            <option value="Kelas 6">Kelas 6</option>
                            <option value="Semua Kelas">Semua Kelas</option>
                          </select>
                        </div>
                      )}

                      {/* Form action buttons */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={resetAccountForm}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl py-2 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-red-750 hover:bg-red-800 text-white rounded-xl py-2 font-bold text-xs transition-all shadow-md cursor-pointer"
                        >
                          {editingAccountId ? 'Perbarui' : 'Daftarkan'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CUSTOM DELETE CONFIRMATION DIALOG (IFRAME-SAFE) */}
      {siswaToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-700 mx-auto">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-base font-display">Hapus Data Siswa?</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                Apakah Anda benar-benar yakin ingin menghapus pendaftaran siswa bernama <b className="text-slate-800 font-extrabold">{siswaToDelete.nama}</b> dengan NIS <code className="bg-slate-100 py-0.5 px-1.5 rounded text-red-755 font-bold font-mono">{siswaToDelete.nis}</code>?
              </p>
              <p className="text-[10px] text-red-700 bg-red-50 py-1.5 px-3 rounded-xl inline-block mt-2 font-bold uppercase tracking-wide border border-red-100">
                ⚠️ tindakan ini tidak dapat dibatalkan!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSiswaToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl py-2.5 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSiswa(siswaToDelete.id);
                  displayNotice('success', `Berhasil menghapus data siswa: ${siswaToDelete.nama}`);
                  setSiswaToDelete(null);
                }}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-xl py-2.5 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
