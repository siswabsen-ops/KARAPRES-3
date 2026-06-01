import { Siswa, User, SystemSettings, Presensi, ActivityLog } from '../types';
import realStudents from './realStudents.json';

export const USER_DEMO_ACCOUNTS: { user: User; pin: string }[] = [
  {
    user: {
      id: 'usr-admin',
      username: 'admin',
      namaLengkap: 'Asep Ridwan, S.Pd.',
      role: 'admin'
    },
    pin: '1234'
  },
  {
    user: {
      id: 'usr-kepsek',
      username: 'kepsek',
      namaLengkap: 'H. Endang Suherman, M.Pd.',
      role: 'kepsek'
    },
    pin: '2222'
  },
  {
    user: {
      id: 'usr-guru4',
      username: 'guru4',
      namaLengkap: 'Siti Patimah, S.Pd.',
      role: 'guru',
      kelasSpesifik: 'Kelas 4'
    },
    pin: '3333'
  },
  {
    user: {
      id: 'usr-piket',
      username: 'piket',
      namaLengkap: 'Cecep Mulyana',
      role: 'piket'
    },
    pin: '4444'
  }
];

export const SISWA_INITIAL: Siswa[] = realStudents as Siswa[];

export const SETTINGS_INITIAL: SystemSettings = {
  jamMasuk: '07:00',
  jamToleransi: '07:15',
  templatePesan: `🔔 *NOTIFIKASI KEHADIRAN - SDN 3 KARAMATWANGI*

Yth. Orang Tua / Wali Murid,
Siswa atas nama: *[Nama Lengkap Siswa]*
Kelas: *[Kelas]* (NIS: *[NIS]*)

Telah tercatat *[Status Kehadiran]* di sekolah pada pukul *[Jam:Menit]* WIB.

Terima kasih atas perhatian dan kerja samanya.`,
  googleSpreadsheetId: '1V6IomZ0hR_E2N_lF5aK804-Oat_bVzNlW3O0Vj2vExF',
  googleDriveFolderId: '1RoPgYTYP3GqzcDhLv_xKJshIYRjQisoe',
  isGoogleConnected: true,
  isWhatsAppConnected: true,
  waApiKey: 'KARA3_WS_GATEWAY_v2'
};

// Log awal unuk realistis harian
export const LOGS_INITIAL: ActivityLog[] = [
  {
    id: 'log-001',
    waktu: '2026-06-01T06:45:00Z',
    user: 'Asep Ridwan, S.Pd.',
    role: 'admin',
    tindakan: 'Sistem Dimulai',
    detail: 'Sistem absensi KARAPRES 3 berhasil dimuat pada pagi hari.'
  },
  {
    id: 'log-002',
    waktu: '2026-06-01T06:48:12Z',
    user: 'Cecep Mulyana',
    role: 'piket',
    tindakan: 'Login Sistem',
    detail: 'Petugas Piket masuk ke sistem menggunakan perangkat HP Android Samsung M12.'
  },
  {
    id: 'log-003',
    waktu: '2026-06-01T06:50:33Z',
    user: 'Cecep Mulyana',
    role: 'piket',
    tindakan: 'Inisialisasi Kamera',
    detail: 'Kamera Barcode Scanner berhasil aktif, status siap memindai.'
  }
];

export const PRESENSI_INITIAL: Presensi[] = [
  {
    id: 'pr-001',
    siswaId: 'sis-001',
    nis: '30101',
    nama: 'Aceng Miftah',
    kelas: 'Kelas 1',
    tanggal: '2026-06-01',
    waktu: '06:52:10',
    status: 'Hadir',
    waStatus: 'Terkirim',
    pesanTerkirim: 'Terkirim otomatis ke 081324567801',
    operator: 'Cecep Mulyana'
  },
  {
    id: 'pr-002',
    siswaId: 'sis-003',
    nis: '30201',
    nama: 'Dadan Wildan',
    kelas: 'Kelas 2',
    tanggal: '2026-06-01',
    waktu: '06:55:40',
    status: 'Hadir',
    waStatus: 'Terkirim',
    pesanTerkirim: 'Terkirim otomatis ke 082198765432',
    operator: 'Cecep Mulyana'
  },
  {
    id: 'pr-003',
    siswaId: 'sis-008',
    nis: '30402',
    nama: 'Ayu Lestari',
    kelas: 'Kelas 4',
    tanggal: '2026-06-01',
    waktu: '07:05:12',
    status: 'Hadir',
    waStatus: 'Terkirim',
    pesanTerkirim: 'Terkirim otomatis ke 081234567890',
    operator: 'Cecep Mulyana'
  },
  {
    id: 'pr-004',
    siswaId: 'sis-010',
    nis: '30501',
    nama: 'Iman Sulaeman',
    kelas: 'Kelas 5',
    tanggal: '2026-06-01',
    waktu: '07:18:22',
    status: 'Terlambat',
    waStatus: 'Terkirim',
    pesanTerkirim: 'Terkirim otomatis ke 081244556677',
    operator: 'Cecep Mulyana'
  },
  {
    id: 'pr-005',
    siswaId: 'sis-013',
    nis: '30602',
    nama: 'Dewi Sartika',
    kelas: 'Kelas 6',
    tanggal: '2026-06-01',
    waktu: '07:22:05',
    status: 'Terlambat',
    waStatus: 'Terkirim',
    pesanTerkirim: 'Terkirim otomatis ke 085312345678',
    operator: 'Cecep Mulyana'
  }
];
