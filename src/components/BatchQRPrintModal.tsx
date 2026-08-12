import React, { useState, useEffect } from 'react';
import { Printer, X, Filter, Search, Sparkles, Check, Download, Layers } from 'lucide-react';
import QRCode from 'qrcode';
import { Siswa, DAFTAR_KELAS } from '../types';

interface BatchQRPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  defaultKelas?: string;
}

export default function BatchQRPrintModal({
  isOpen,
  onClose,
  siswaList,
  defaultKelas = 'Semua Kelas',
}: BatchQRPrintModalProps) {
  const [selectedKelas, setSelectedKelas] = useState<string>(defaultKelas);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    setSelectedKelas(defaultKelas);
  }, [defaultKelas, isOpen]);

  // Filter students by selected class and search query
  const filteredSiswa = siswaList.filter((s) => {
    const matchesKelas =
      selectedKelas === 'Semua Kelas' || s.kelas.toLowerCase() === selectedKelas.toLowerCase();
    const matchesSearch =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesKelas && matchesSearch;
  });

  // Generate QR Code base64 Data URLs for filtered students
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function generateQRCodes() {
      setIsGenerating(true);
      const newMap: Record<string, string> = {};

      for (const student of filteredSiswa) {
        try {
          const url = await QRCode.toDataURL(student.nis, {
            width: 280,
            margin: 1.5,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          newMap[student.nis] = url;
        } catch (err) {
          console.error(`Gagal membuat QR code untuk NIS ${student.nis}`, err);
        }
      }

      if (isMounted) {
        setQrMap(newMap);
        setIsGenerating(false);
      }
    }

    generateQRCodes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedKelas, searchQuery, siswaList]);

  if (!isOpen) return null;

  // Handle printing all filtered student QR cards via clean print iframe
  const handlePrintAll = () => {
    if (filteredSiswa.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) return;

    const cardsHtml = filteredSiswa
      .map((siswa) => {
        const qrUrl = qrMap[siswa.nis] || '';
        return `
        <div class="card-item">
          <div class="header-banner">
            KARTU SISWA ELEKTRONIK<br/>
            <span>SDN 3 KARAMATWANGI</span>
          </div>
          <div class="qr-container">
            ${
              qrUrl
                ? `<img src="${qrUrl}" class="qr-img" alt="QR NIS ${siswa.nis}" />`
                : `<div class="qr-fallback">NIS ${siswa.nis}</div>`
            }
          </div>
          <div class="student-name">${siswa.nama}</div>
          <div class="meta-info">NIS: ${siswa.nis} • <b>${siswa.kelas}</b></div>
          <div class="sub-info">📞 WA Wali: ${siswa.waOrangTua || '-'}</div>
          <div class="footer-tag">DIGIWANGI 3 Presensi • Cisurupan, Garut</div>
        </div>
      `;
      })
      .join('');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Kartu QR Siswa - ${selectedKelas}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@700&display=swap');
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0;
              padding: 0;
              background-color: white;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page-title {
              text-align: center;
              margin-bottom: 16px;
              padding-bottom: 10px;
              border-bottom: 2.5px solid #1d4ed8;
            }
            .print-page-title h1 {
              margin: 0;
              font-size: 16px;
              font-weight: 900;
              color: #1d4ed8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .print-page-title p {
              margin: 4px 0 0 0;
              font-size: 10px;
              color: #475569;
              font-weight: 700;
            }
            .cards-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 14px;
            }
            .card-item {
              border: 3px solid #1d4ed8;
              border-radius: 16px;
              padding: 14px 12px;
              text-align: center;
              background-color: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              min-height: 270px;
            }
            .header-banner {
              background-color: #1d4ed8;
              color: white;
              padding: 6px 8px;
              font-weight: 900;
              font-size: 10px;
              border-radius: 8px;
              width: 100%;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.3;
            }
            .header-banner span {
              font-size: 9px;
              opacity: 0.95;
            }
            .qr-container {
              margin: 8px 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .qr-img {
              width: 130px;
              height: 130px;
              object-fit: contain;
              image-rendering: -webkit-optimize-contrast;
            }
            .student-name {
              font-weight: 900;
              font-size: 13px;
              color: #0f172a;
              text-transform: uppercase;
              line-height: 1.2;
              margin-top: 4px;
            }
            .meta-info {
              font-size: 10px;
              color: #334155;
              margin-top: 3px;
              font-weight: 800;
            }
            .sub-info {
              font-size: 9px;
              color: #64748b;
              margin-top: 2px;
              font-weight: 600;
            }
            .footer-tag {
              font-size: 8px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              margin-top: 8px;
              padding-top: 4px;
              width: 100%;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="print-page-title">
            <h1>KARTU QR CODE ABSENSI SISWA — ${selectedKelas.toUpperCase()}</h1>
            <p>SD NEGERI 3 KARAMATWANGI • TOTAL ${filteredSiswa.length} SISWA SIAP CETAK</p>
          </div>
          <div class="cards-grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  document.body.removeChild(iframe);
                }, 1000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-wide uppercase font-display flex items-center gap-2">
                🖨️ CETAK KARTU & QR CODE MASSAL SISWA
              </h3>
              <p className="text-xs text-blue-100/90 font-medium">
                Pilih kelas untuk mencetak semua kartu absensi QR Code sekaligus dalam 1 klik!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Class Filter dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filter Kelas:</span>
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-white border-2 border-indigo-200 focus:border-indigo-600 text-slate-800 text-xs font-extrabold rounded-xl px-3 py-2 shadow-sm outline-none cursor-pointer"
            >
              <option value="Semua Kelas">🏫 Semua Kelas ({siswaList.length} Siswa)</option>
              {DAFTAR_KELAS.map((k) => {
                const count = siswaList.filter((s) => s.kelas === k).length;
                return (
                  <option key={k} value={k}>
                    {k} ({count} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Print Action button */}
          <button
            type="button"
            onClick={handlePrintAll}
            disabled={filteredSiswa.length === 0 || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>
              {isGenerating
                ? 'Menyiapkan QR Code...'
                : `🖨️ Cetak ${filteredSiswa.length} Kartu (${selectedKelas})`}
            </span>
          </button>
        </div>

        {/* Modal Content - Live Cards Grid Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-600">
              Menampilkan <span className="text-indigo-700 font-black">{filteredSiswa.length}</span> siswa siap cetak
            </span>
            {isGenerating && (
              <span className="text-xs text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> Generasi QR Code Otomatis...
              </span>
            )}
          </div>

          {filteredSiswa.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 text-slate-500">
              <p className="font-bold text-sm">Tidak ada data siswa ditemukan untuk filter ini.</p>
              <p className="text-xs mt-1">Coba ubah pilihan filter kelas atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSiswa.map((siswa) => {
                const qrUrl = qrMap[siswa.nis];
                return (
                  <div
                    key={siswa.id || siswa.nis}
                    className="bg-white rounded-2xl p-4 border-2 border-indigo-600/80 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center relative group"
                  >
                    <div className="w-full bg-indigo-600 text-white font-black text-[10px] py-1 px-2 rounded-lg uppercase tracking-wider mb-2">
                      KARTU SISWA • SDN 3 KARAMATWANGI
                    </div>

                    {/* QR Code preview image */}
                    <div className="my-2 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center min-h-[140px] w-full">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR Code NIS ${siswa.nis}`}
                          className="w-32 h-32 object-contain rounded-md"
                        />
                      ) : (
                        <div className="text-xs text-slate-400 font-mono animate-pulse">
                          Loading QR...
                        </div>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight line-clamp-1">
                      {siswa.nama}
                    </h4>
                    <p className="text-[11px] font-bold text-indigo-700 font-mono mt-0.5">
                      NIS: {siswa.nis} • <b>{siswa.kelas}</b>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      📞 WA Wali: {siswa.waOrangTua || '-'}
                    </p>

                    <div className="w-full border-t border-dashed border-slate-200 mt-3 pt-1 text-[9px] text-slate-400 font-semibold">
                      Digiwangi 3 Presensi • Cisurupan, Garut
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            💡 <b>Petunjuk Cetak:</b> Kartu dirancang berukuran pas untuk A4 (2 kolom). Siapkan kertas art carton / kover lalu potong sesuai garis batas kartu.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrintAll}
              disabled={filteredSiswa.length === 0 || isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>🖨️ CETAK {filteredSiswa.length} KARTU SEKARANG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
