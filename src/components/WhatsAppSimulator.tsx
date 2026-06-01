import { useState, useEffect } from 'react';
import { MessageSquare, Bell, Smartphone, X, Check, CheckCheck } from 'lucide-react';
import { Presensi } from '../types';

interface WhatsAppSimulatorProps {
  logs: Presensi[];
  onClearLogs: () => void;
}

export default function WhatsAppSimulator({ logs, onClearLogs }: WhatsAppSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<Presensi | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Auto-open or notify when a new log appears
  useEffect(() => {
    if (logs.length > 0) {
      setActiveMessage(logs[logs.length - 1]);
      setHasNewMessage(true);
      // Optional: Auto open on first messages during scans
      if (logs.length > 1) {
        setIsOpen(true);
      }
    }
  }, [logs]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Extract parent phone number from log or raw text
  const extractParentPhone = (pesan?: string) => {
    if (!pesan) return '08123456789';
    const match = pesan.match(/\((0\d+|62\d+|\+?62\d+)\)/);
    if (match) return match[1];
    
    // Look for Indonesian phone number formats like 08 or 62 inside strings
    const firstMatch = pesan.match(/\b(08\d+|62\d+)\b/);
    if (firstMatch) return firstMatch[1];
    return '08123456789';
  };

  // Construct message content
  const formatPesan = (p: Presensi) => {
    const formattedTime = p.waktu.slice(0, 5); // Ambil jam:menit
    const labelStatus = p.status.toUpperCase();
    return `🔔 *NOTIFIKASI KEHADIRAN AKTIF - SDN 3 KARAMATWANGI*
    
Yth. Orang Tua / Wali Murid dari *${p.nama}* (NIS: ${p.nis}).

Dengan hormat, kami menginfokan bahwa siswa tersebut telah tercatat *${labelStatus}* pada jam masuk hari ini pukul *${formattedTime}* WIB.

Pesan ini dikirim otomatis melalui Server Utama WA Gateway. Terima kasih atas kerja samanya.`;
  };

  const getWaLinkInput = (p: Presensi, targetPhone: string) => {
    let phone = targetPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const textEncoded = encodeURIComponent(formatPesan(p));
    return `https://api.whatsapp.com/send?phone=${phone}&text=${textEncoded}`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        id="btn-whatsapp-simulator-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 select-none focus:outline-none"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {hasNewMessage && (
            <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-650 rounded-full animate-bounce border-2 border-emerald-500" />
          )}
        </div>
        <span className="font-semibold text-xs tracking-wide">WA Gateway (Live)</span>
        <span className="text-[10px] bg-emerald-700/50 px-1.5 py-0.5 rounded">
          {logs.length} Notif
        </span>
      </button>

      {/* Simulator Modal Box */}
      {isOpen && (
        <div
          id="wa-simulator-modal"
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-full bg-[#E5DDD5] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 flex flex-col h-[540px] animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Virtual Phone Header */}
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between border-b border-[#128C7E]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold shadow-sm">
                WA
              </div>
              <div>
                <h4 className="font-bold text-xs tracking-wide flex items-center gap-1">
                  Server Utama WA Gateway
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[10px] text-emerald-150 opacity-90 font-mono font-bold">No. Gateway: 087844651559</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-wa-clear-logs"
                onClick={onClearLogs}
                className="text-[9px] bg-emerald-800/80 hover:bg-emerald-900 px-2 py-1 rounded font-bold transition-colors"
                title="Hapus riwayat pesan simulasi"
              >
                Reset Chat
              </button>
              <button
                type="button"
                id="btn-wa-simulator-close"
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-emerald-150 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Logs Content (Screen Area) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse justify-start">
            {logs.length === 0 ? (
              <div className="my-auto text-center px-4">
                <span className="inline-block p-3 bg-white/80 rounded-full text-emerald-600 mb-2">
                  <Bell className="w-6 h-6 animate-pulse" />
                </span>
                <p className="text-gray-700 font-medium text-xs">Belum ada Presensi Hari Ini</p>
                <p className="text-gray-500 text-[11px] mt-1">
                  Saat QR Code siswa dipindai, status pengiriman via Server Utama (087844651559) mendarat di sini secara real-time.
                </p>
              </div>
            ) : (
              [...logs].reverse().map((log) => {
                const formattedTime = log.waktu.slice(0, 5);
                const isSent = log.waStatus === 'Terkirim';
                const parentPhone = extractParentPhone(log.pesanTerkirim);

                return (
                  <div
                    key={log.id}
                    className="self-end w-full max-w-[90%] bg-[#DCF8C6] p-3 rounded-2xl shadow-sm text-gray-800 relative text-xs animate-in zoom-in-95 duration-150"
                  >
                    {/* Routing Header Label */}
                    <div className="text-[9px] font-black tracking-tight text-emerald-800 mb-1.5 pb-1 border-b border-emerald-250/20 flex flex-col gap-0.5">
                      <div className="flex justify-between">
                        <span>📡 SERVER UTAMA WA:</span>
                        <span className="font-mono text-indigo-700">087844651559</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎯 TUJUAN ORANG TUA:</span>
                        <span className="font-mono text-rose-700 font-bold">{parentPhone}</span>
                      </div>
                    </div>

                    {/* Konten template WA */}
                    <p className="whitespace-pre-line font-serif text-[11px] text-gray-800 leading-normal bg-white/40 p-2 rounded-xl border border-white/50">
                      🔔 *NOTIFIKASI KEHADIRAN*
                      <br />
                      Yth. Orang Tua/Wali Murid dari *{log.nama}* (NIS: {log.nis}).
                      <br />
                      Siswa telah tercatat *{log.status.toUpperCase()}* pukul {formattedTime} WIB.
                    </p>

                    {/* Metadata Kaki Pesan */}
                    <div className="flex items-center justify-between text-[9px] text-gray-500 mt-2">
                      <span className="text-slate-500 font-mono">Operator: {log.operator.split(',')[0]}</span>
                      <div className="flex items-center gap-1">
                        <span>{formattedTime}</span>
                        {isSent ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Tombol Klik Uji Kirim Pintar */}
                    <div className="mt-2.5 pt-2 border-t border-emerald-250/30 flex flex-col gap-1 text-[10px]">
                      <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100/80 p-1 rounded-lg text-center">
                        API STATUS: PASSED THRU GATEWAY
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <a
                          href={getWaLinkInput(log, '087844651559')}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#075E54] hover:bg-[#128C7E] text-white py-1 px-1.5 rounded-lg text-center text-[9px] font-black transition-all hover:scale-[1.02] flex items-center justify-center gap-0.5"
                          title="Uji kirim manual ke nomor Server Utama"
                        >
                          Uji ke Gateway &rarr;
                        </a>
                        <a
                          href={getWaLinkInput(log, parentPhone)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-sky-650 hover:bg-sky-700 text-white py-1 px-1.5 rounded-lg text-center text-[9px] font-black transition-all hover:scale-[1.02] flex items-center justify-center gap-0.5"
                          title="Uji kirim manual ke nomor Orang Tua wali asli"
                        >
                          Uji ke Orang Tua &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Simulated WhatsApp Keyboard/Input area */}
          <div className="bg-[#F0F2F5] p-2 border-t border-gray-200 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-500 ml-1.5" />
            <div className="flex-1 bg-white text-gray-400 px-3 py-1.5 rounded-full text-xs select-none border border-gray-300">
              Otomatis mengirim notifikasi...
            </div>
            <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-white cursor-pointer hover:bg-[#075E54]">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
