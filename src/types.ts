export type Role = 'admin' | 'kepsek' | 'guru' | 'piket';

export interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: Role;
  kelasSpesifik?: string; // Khusus Guru, contoh: "Kelas 4" atau "Semua Kelas"
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string; // Kelas 1 s/d 6
  jenisKelamin: 'L' | 'P';
  waOrangTua: string; // Format Indonesia, misal: "081234567890" atau "628..."
}

export type StatusKehadiran = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Terlambat';

export interface Presensi {
  id: string;
  siswaId: string;
  nis: string;
  nama: string;
  kelas: string;
  tanggal: string; // Format YYYY-MM-DD
  waktu: string; // Format HH:MM:SS
  status: StatusKehadiran;
  waStatus: 'Pending' | 'Terkirim' | 'Gagal';
  pesanTerkirim?: string;
  operator: string; // Siapa yang menginput (Admin, Guru, Piket)
}

export interface SystemSettings {
  jamMasuk: string; // Format "07:00"
  jamToleransi: string; // Format "07:15"
  templatePesan: string;
  googleSpreadsheetId: string;
  googleDriveFolderId: string;
  isGoogleConnected: boolean;
  isWhatsAppConnected: boolean;
  waApiKey: string;
}

export interface ActivityLog {
  id: string;
  waktu: string; // DateTime ISO String
  user: string; // Nama Lengkap operator
  role: Role;
  tindakan: string; // misal: "Melakukan Presensi", "Menambah Siswa"
  detail: string;
}
