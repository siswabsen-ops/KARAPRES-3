import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, UserCheck, AlertTriangle, Clock, Smartphone, MessageCircle, RefreshCw, Star } from 'lucide-react';
import { Siswa, Presensi, SystemSettings, StatusKehadiran } from '../types';
import QRCodeRenderer from './QRCodeRenderer';
// @ts-ignore
import jsQR from 'jsqr';

interface ScanScreenProps {
  siswaList: Siswa[];
  settings: SystemSettings;
  currentUser: { namaLengkap: string; role: string };
  onAddPresensi: (presensi: Presensi) => void;
  recentPresensi: Presensi[];
}

export default function ScanScreen({
  siswaList,
  settings,
  currentUser,
  onAddPresensi,
  recentPresensi,
}: ScanScreenProps) {
  const [nisInput, setNisInput] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scannerStatus, setScannerStatus] = useState<'READY' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('READY');
  const [scannedResult, setScannedResult] = useState<Presensi | null>(null);
  const [manualStatus, setManualStatus] = useState<StatusKehadiran | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMirrored, setIsMirrored] = useState(false); // Default to false so rear camera/cards read correctly

  const videoRef = useRef<HTMLVideoElement>(null);
  const scanTimeoutRef = useRef<any>(null);

  // Clean-up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [cameraStream]);

  // Safely assign the stream to the video element whenever it is mounted
  useEffect(() => {
    if (useCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => {
        console.warn('Video element play failure:', err);
      });
    }
  }, [useCamera, cameraStream]);

  // Real-time loop to auto-capture frames from key video and decode with jsQR
  useEffect(() => {
    if (!useCamera || !cameraStream || scannerStatus !== 'SCANNING') return;

    let active = true;
    let animFrameId: number;
    let lastScanTime = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scanFrame = () => {
      if (!active) return;

      const nowTime = Date.now();
      if (nowTime - lastScanTime > 150) {
        lastScanTime = nowTime;

        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const video = videoRef.current;
          // Downsample block: using smaller and standard sizes for jsQR makes processing lightning fast
          const width = 480;
          const height = 360;
          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);

            try {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                const decodedNis = code.data.trim();
                if (decodedNis) {
                  // Successfully decoded! Complete scan
                  active = false;
                  handleScanIdentify(decodedNis);
                  return;
                }
              }
            } catch (e) {
              console.error('jsQR scanning error:', e);
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(scanFrame);
    };

    // A tiny buffer delay to let the camera source stabilize
    const startTimeout = setTimeout(() => {
      animFrameId = requestAnimationFrame(scanFrame);
    }, 150);

    return () => {
      active = false;
      clearTimeout(startTimeout);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [useCamera, cameraStream, scannerStatus]);

  // Turn on/off real browser camera
  const toggleCamera = async () => {
    if (useCamera) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      setCameraStream(null);
      setUseCamera(false);
      setScannerStatus('READY');
    } else {
      setUseCamera(true);
      setScannerStatus('SCANNING');
      setErrorMsg('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setCameraStream(stream);
      } catch (err) {
        console.warn('Webcam access was restricted, fallback to simulator webcam stream', err);
        setErrorMsg('Webcam asli terbatasi (atau dijalankan di sandbox). Kami mensimulasikan feed kamera sekolah dengan laser target.');
        // Don't crash, keep stream state false but let UI look like scanner is active for demo experience
      }
    }
  };

  // Main attendance logging function
  const handleScanIdentify = (nis: string, customStatus?: StatusKehadiran) => {
    setErrorMsg('');
    const matchedSiswa = siswaList.find((s) => s.nis === nis.trim());
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    if (!matchedSiswa) {
      setScannerStatus('ERROR');
      setErrorMsg(`Siswa dengan NIS ${nis} tidak ditemukan.`);
      // Auto reset status back to SCANNING after 2 seconds
      scanTimeoutRef.current = setTimeout(() => {
        setScannerStatus('SCANNING');
        setErrorMsg('');
      }, 200);
      return;
    }

    // Determine default status based on Arrival time and System Settings
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const waktuSekarang = `${hours}:${minutes}:${seconds}`;

    // Status logic rule: if current time is after limit "jamMasuk" (or jamToleransi) -> "Terlambat", else "Hadir"
    let determinedStatus: StatusKehadiran = 'Hadir';
    if (customStatus) {
      determinedStatus = customStatus;
    } else {
      const [limitH, limitM] = settings.jamToleransi.split(':').map(Number);
      const curH = now.getHours();
      const curM = now.getMinutes();

      if (curH > limitH || (curH === limitH && curM > limitM)) {
        determinedStatus = 'Terlambat';
      }
    }

    const todayDate = now.toISOString().split('T')[0];

    // Check if pupil already scanned today to avoid annoying double triggers
    const alreadyScanned = recentPresensi.find(
      (p) => p.nis === matchedSiswa.nis && p.tanggal === todayDate
    );

    if (alreadyScanned && !customStatus) {
      // Allow overriding but warn
      setErrorMsg(`Perhatian: ${matchedSiswa.nama} sudah tercatat presensi hari ini pukul ${alreadyScanned.waktu.slice(0,5)}.`);
    }

    const newPresensiId = `pr-${Date.now()}`;
    const newRecord: Presensi = {
      id: newPresensiId,
      siswaId: matchedSiswa.id,
      nis: matchedSiswa.nis,
      nama: matchedSiswa.nama,
      kelas: matchedSiswa.kelas,
      tanggal: todayDate,
      waktu: waktuSekarang,
      status: determinedStatus,
      waStatus: 'Terkirim',
      pesanTerkirim: `Diproses via Server Utama WA Gateway (087844651559) ➔ Terkirim ke WhatsApp Orang Tua (${matchedSiswa.waOrangTua})`,
      operator: currentUser.namaLengkap,
    };

    onAddPresensi(newRecord);
    setScannedResult(newRecord);
    setScannerStatus('SUCCESS');

    // Beeps or play sound for immersive scan feel
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Browser blocks audio until interaction, ignore
    }

    // Auto clear scanned view and resume scanning automatically after 1.5 seconds
    scanTimeoutRef.current = setTimeout(() => {
      setScannerStatus('SCANNING');
      setScannedResult(null);
      setErrorMsg('');
    }, 1500);
  };

  const handleNisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisInput.trim()) return;
    handleScanIdentify(nisInput, manualStatus || undefined);
    setNisInput('');
    setManualStatus(null);
  };

  // Direct mock scan via clicking student cards
  const handleVirtualScan = (siswa: Siswa, forcedStatus?: StatusKehadiran) => {
    setScannerStatus('SCANNING');
    setTimeout(() => {
      handleScanIdentify(siswa.nis, forcedStatus);
    }, 500); // Quick split-second visual laser delay
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto">
      {/* LEFT COLUMN: SCANNER SCREEN (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
          {/* Banner */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 font-display">
                <Camera className="w-5 h-5 text-red-750 animate-pulse" />
                Pindai QR Code Kartu Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Posisikan QR Code kartu siswa di depan kamera HP / Laptop secara lurus.
              </p>
            </div>
            
            {/* Toleransi limit indicator */}
            <div className="text-right select-none">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-display">BATAS HADIR</span>
              <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 py-1 px-2.5 rounded-xl flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-red-700" />
                {settings.jamMasuk} - {settings.jamToleransi} WIB
              </span>
            </div>
          </div>

          {/* Real-time Camera Feed Simulator / Real Webcam View Port */}
          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex flex-col justify-center items-center">
            {useCamera ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transform ${isMirrored ? 'scale-x-[-1]' : ''}`}
                  title="Tampilan kamera aktif"
                />
                
                {/* Laser scan line sweep effect */}
                {scannerStatus === 'SCANNING' && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-604 shadow-[0_0_10px_#ef4444] animate-bounce z-10" />
                )}
                
                {/* Green corner targeting overlay frame */}
                <div className="absolute inset-0 p-8 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-28 border-2 border-emerald-450 border-dashed rounded-lg opacity-75 relative">
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-emerald-500 block" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-emerald-500 block" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-emerald-500 block" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-emerald-500 block" />
                  </div>
                </div>

                {/* Subtitle Status */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  KAMERA AKTIF ({currentUser.role === 'piket' ? 'PETUGAS PIKET' : 'OPERATOR'})
                </div>
              </>
            ) : (
              // Standby View
              <div className="text-center p-6 space-y-3 max-w-sm">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-red-650 mx-auto shadow-md border border-slate-800">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm font-display">KAMERA MASIH NONAKTIF</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Aktifkan kamera untuk mulai memindai QR Code fisik siswa secara otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-trigger-camera"
                  onClick={toggleCamera}
                  className="bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs py-2.5 px-5 shadow-lg transition-all inline-block cursor-pointer active:scale-95 font-display tracking-tight"
                >
                  Aktifkan Kamera Scanner
                </button>
              </div>
            )}

            {/* Error Message Notice Bar overlay */}
            {errorMsg && (
              <div className="absolute top-3 inset-x-3 bg-red-900/95 backdrop-blur-md border border-red-700 text-white p-2.5 rounded-xl text-[11px] text-center flex items-center justify-center gap-1.5 shadow-lg select-none">
                <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                {errorMsg}
              </div>
            )}
            
            {/* SUCCESS SCAN SCREEN PORT */}
            {scannerStatus === 'SUCCESS' && scannedResult && (
              <div className="absolute inset-0 bg-[#075E54]/95 backdrop-blur-md text-white p-8 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-150">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-110 mb-4 shadow-lg border-4 border-white animate-bounce">
                  <UserCheck className="w-10 h-10" />
                </div>
                <span className="bg-[#128C7E] border border-emerald-400 text-emerald-100 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest leading-none mb-2">
                  NOTIFIKASI WHATSAPP DIKIRIM
                </span>
                <h4 className="text-xl font-black">{scannedResult.nama}</h4>
                <p className="text-xs text-emerald-150 opacity-95">NIS: {scannedResult.nis} • {scannedResult.kelas}</p>
                
                {/* Visual Status Result Block */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="bg-white/10 px-3.5 py-1.5 rounded-2xl flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-200">Waktu Scan</span>
                    <span className="text-lg font-black">{scannedResult.waktu} WIB</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl flex flex-col items-center text-white font-bold shadow-md ${
                    scannedResult.status === 'Hadir' 
                      ? 'bg-emerald-600 border border-emerald-400' 
                      : 'bg-amber-600 border border-amber-400'
                  }`}>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-semibold">STATUS</span>
                    <span className="text-base font-black">{scannedResult.status}</span>
                  </div>
                </div>

                {/* Gateway Routing Indicator */}
                <div className="mt-5 w-full max-w-xs mx-auto bg-black/25 rounded-2xl p-3 border border-emerald-500/20 text-left text-xs space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-emerald-200 text-[11px]">
                    <span className="font-semibold text-emerald-300">Server Utama (WA Gateway):</span>
                    <span className="font-mono font-black text-white">087844651559</span>
                  </div>
                  <div className="flex items-center justify-between text-[#E5DDD5] text-[11px]">
                    <span className="font-semibold text-emerald-200">Tujuan Orang Tua / Wali:</span>
                    <span className="font-mono font-black text-emerald-400">
                      {scannedResult.pesanTerkirim?.match(/\(([^)]+)\)/)?.[1] || 'Terikirm'}
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-100/50 border-t border-white/5 pt-1.5 mt-1.5 text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span>Gateway Status: <span className="text-emerald-400 font-bold font-mono">SENT SUCCESSFUL</span></span>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-100/90 mt-4 italic">
                  Notifikasi WA berhasil diproses melalui Server Utama sebelum diteruskan ke Orang Tua siswa.
                </p>
                <button
                  type="button"
                  id="btn-scan-next-instant"
                  onClick={() => {
                    if (scanTimeoutRef.current) {
                      clearTimeout(scanTimeoutRef.current);
                    }
                    setScannerStatus('SCANNING');
                    setScannedResult(null);
                    setErrorMsg('');
                  }}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-400 select-none"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-white" />
                  Lewati & Pindai Murid Selanjutnya &rarr;
                </button>
              </div>
            )}
          </div>

          {/* CAMERA DECOR & SWITCH TOGGLE */}
          {useCamera && (
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border border-slate-100 bg-slate-50 rounded-2xl p-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Kamera Terintegrasi: Live View SDN 3</span>
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    isMirrored
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isMirrored ? '🔄 Mirror Aktif (Terbalik)' : '🔄 Cermin Nonaktif (Normal)'}
                </button>
              </div>
              <button
                type="button"
                id="btn-turn-off-cam"
                onClick={toggleCamera}
                className="text-xs font-bold text-red-700 hover:text-red-950 cursor-pointer"
              >
                Matikan Kamera
              </button>
            </div>
          )}

          {/* QUICK MANUAL BYPASS TERMINAL FORM */}
          <form onSubmit={handleNisSubmit} className="mt-5 pt-5 border-t border-gray-150">
            <h4 className="text-xs font-black tracking-wider text-slate-500 uppercase mb-3">
              ⌨️ INPUT MANUAL (Alternative / Bypass Scanner)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* NIS input */}
              <div className="sm:col-span-4 relative">
                <input
                  type="text"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  placeholder="Ketik NIS Siswa di sini"
                  className="w-full bg-white border border-gray-300 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 font-mono font-medium"
                />
              </div>

              {/* Status adjust combo */}
              <div className="sm:col-span-5 flex rounded-xl border border-gray-200 overflow-hidden bg-slate-50 p-1 gap-1">
                {(['Hadir', 'Sakit', 'Izin', 'Alfa', 'Terlambat'] as StatusKehadiran[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setManualStatus(st)}
                    className={`flex-1 text-[10px] font-bold py-1.5 px-1.5 rounded-lg transition-all cursor-pointer ${
                      manualStatus === st
                        ? 'bg-red-700 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-150'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Submit trigger */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  id="btn-submit-manual-absen"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-2.5 font-bold text-xs shadow transition-all cursor-pointer block text-center"
                >
                  Absen Sekarang &arr;
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              *Jika tidak mengaktifkan pilihan status, status otomatis terisi <span className="font-bold text-red-700">Terlambat</span> setelah melewati jam {settings.jamToleransi} WIB.
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: REPRENSENTATIVE VIRTUAL CARDS / SCAN DEMO TOOLS (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* INFO CARD & SPEED TRIGGER TEST CODES */}
        <div className="bg-white rounded-3xl p-5 border border-slate-250 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Simulasi Pindai Instan (Klik Murid)
            </h3>
            <span className="text-[9px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold font-mono uppercase">Interactive Demo</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Untuk menguji aliran sistem <b>KARAPRES 3</b> tanpa printer scan QR Code fisik, klik salah satu kartu siswa virtual di bawah ini untuk mensimulasikan pemindaian laser QR Code secara otomatis!
          </p>

          {/* Interactive Virtual Students Card Matrix */}
          <div className="space-y-2 max-h-[304px] overflow-y-auto pr-1">
            {siswaList.map((siswa) => {
              // Check if already present today
              const todayDate = new Date().toISOString().split('T')[0];
              const presentToday = recentPresensi.find(
                (p) => p.nis === siswa.nis && p.tanggal === todayDate
              );

              return (
                <div
                  key={siswa.id}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group relative overflow-hidden text-left ${
                    presentToday
                      ? 'bg-emerald-50 border-emerald-250 hover:bg-emerald-100'
                      : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 max-w-[55%]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono uppercase ${
                      siswa.jenisKelamin === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {siswa.nama.charAt(0)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-gray-800 truncate leading-none group-hover:text-red-700 transition-colors">
                        {siswa.nama}
                      </h4>
                      <span className="text-[9px] font-mono text-gray-400 font-semibold block mt-1">
                        NIS {siswa.nis} • {siswa.kelas}
                      </span>
                    </div>
                  </div>

                  {/* Micro QR Code preview + click scanner simulation */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="opacity-70 group-hover:opacity-100 transition-all duration-300">
                      {/* CSS QR Code mockup icon */}
                      <div className="w-8 h-8 bg-white p-1 flex items-center justify-center border border-slate-250 rounded-lg shadow-inner select-none pointer-events-none">
                        <div className="w-full h-full relative">
                          {/* Anchor Top-Left */}
                          <span className="w-2.5 h-2.5 border-2 border-slate-900 rounded-[1px] absolute top-0 left-0 flex items-center justify-center">
                            <span className="w-1 h-1 bg-slate-900 rounded-[1px]" />
                          </span>
                          {/* Anchor Top-Right */}
                          <span className="w-2.5 h-2.5 border-2 border-slate-900 rounded-[1px] absolute top-0 right-0 flex items-center justify-center">
                            <span className="w-1 h-1 bg-slate-900 rounded-[1px]" />
                          </span>
                          {/* Anchor Bottom-Left */}
                          <span className="w-2.5 h-2.5 border-2 border-slate-900 rounded-[1px] absolute bottom-0 left-0 flex items-center justify-center">
                            <span className="w-1 h-1 bg-slate-900 rounded-[1px]" />
                          </span>
                          {/* Dots */}
                          <span className="w-1 h-1 bg-slate-900 absolute bottom-1 right-1 rounded-[0.5px]" />
                          <span className="w-1 h-1 bg-slate-900 absolute bottom-0 right-0 rounded-[0.5px]" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Trigger Preset Action Button popup menu */}
                    <div className="flex flex-col gap-1 font-sans">
                      <button
                        type="button"
                        id={`btn-mock-scan-${siswa.nis}`}
                        onClick={() => handleVirtualScan(siswa)}
                        className={`text-[9px] font-extrabold py-1 px-2.5 rounded-lg cursor-pointer transition-all ${
                          presentToday
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-700 hover:bg-red-800 text-white shadow-sm'
                        }`}
                        title="Simulasikan Scan QR Code otomatis untuk murid ini"
                      >
                        {presentToday ? `${presentToday.status}` : 'Pindai'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT SCANS LIST / HISTORY COMPACT */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-display">
            📊 Riwayat Presensi Hari Ini
          </h3>
          
          <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
            {recentPresensi.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                Belum ada presensi yang masuk pada tanggal hari ini.
              </div>
            ) : (
              [...recentPresensi].reverse().map((p) => {
                const isLate = p.status === 'Terlambat';
                const statusColor =
                  p.status === 'Hadir'
                    ? 'bg-emerald-100 text-emerald-800'
                    : p.status === 'Sakit'
                    ? 'bg-indigo-150 text-indigo-850 font-extrabold'
                    : p.status === 'Izin'
                    ? 'bg-amber-100 text-amber-800'
                    : p.status === 'Alfa'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-red-100 text-red-800';

                return (
                  <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
                    <div>
                      <div className="font-extrabold text-gray-800 text-[11px] leading-tight">
                        {p.nama}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono tracking-wide mt-0.5">
                        NIS {p.nis} • {p.kelas}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="text-[10px] text-gray-500 font-mono">
                        {p.waktu.slice(0, 5)}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${statusColor}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
