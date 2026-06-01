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

  // Construct message content
  const formatPesan = (p: Presensi) => {
    const formattedTime = p.waktu.slice(0, 5); // Ambil jam:menit
    const labelStatus = p.status.toUpperCase();
    return `🔔 *NOTIFIKASI KEHADIRAN - SDN 3 KARAMATWANGI*
    
Yth. Orang Tua/Wali Murid,
Siswa atas nama: *${p.nama}*
Kelas: *${p.kelas}* (NIS: *${p.nis}*)

Telah tercatat *${labelStatus}* di sekolah pada pukul *${formattedTime}* WIB.

Terima kasih atas perhatian dan kerja samanya.`;
  };

  const getWaLinkInput = (p: Presensi) => {
    // Sanitize phone number (remove leading 0 -> replace with 62)
    let phone = p.pesanTerkirim?.match(/\d+/)?.[0] || '628123456789';
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
        <span className="font-semibold text-xs tracking-wide">WA Gateway</span>
        <span className="text-[10px] bg-emerald-700/50 px-1.5 py-0.5 rounded">
          {logs.length} Notif
        </span>
      </button>

      {/* Simulator Modal Box */}
      {isOpen && (
        <div
          id="wa-simulator-modal"
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-full bg-[#E5DDD5] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 flex flex-col h-[524px] animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Virtual Phone Header */}
          <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between border-b border-[#128C7E]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold shadow-sm">
                WA
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  KARA3 WA Gateway
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[10px] text-emerald-150 opacity-90">SDN 3 Karamatwangi Client</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-wa-clear-logs"
                onClick={onClearLogs}
                className="text-[10px] bg-emerald-800/80 hover:bg-emerald-900 px-2 py-1 rounded transition-colors"
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
                  Saat barcode siswa dipindai, notifikasi pengiriman pesan WhatsApp ke orang tua otomatis terpantau di sini.
                </p>
              </div>
            ) : (
              [...logs].reverse().map((log) => {
                const formattedTime = log.waktu.slice(0, 5);
                const isSent = log.waStatus === 'Terkirim';

                return (
                  <div
                    key={log.id}
                    className="self-end max-w-[85%] bg-[#DCF8C6] p-3 rounded-lg shadow-sm text-gray-800 relative text-xs animate-in zoom-in-95 duration-150"
                  >
                    {/* Header Panggilan Penerima */}
                    <div className="text-[10px] font-bold text-indigo-700 mb-1 border-b border-emerald-100/50 pb-0.5">
                      Orang Tua: {log.nama} ({log.pesanTerkirim?.replace('Terkirim otomatis ke ', '') || 'Wali'})
                    </div>

                    {/* Konten template WA */}
                    <p className="whitespace-pre-line font-serif text-gray-800 leading-tight">
                      🔔 *NOTIFIKASI KEHADIRAN*
                      <br />
                      Yth. Orang Tua/Wali Murid,
                      <br />
                      Siswa atas nama: *{log.nama}*
                      <br />
                      Kelas: *{log.kelas}*
                      <br />
                      Tercatat *{log.status.toUpperCase()}* pukul {formattedTime} WIB.
                      <br />
                      <br />
                      Terima kasih atas perhatiannya.
                    </p>

                    {/* Metadata Kaki Pesan */}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-gray-500 mt-1.5 self-end">
                      <span>{formattedTime}</span>
                      {isSent ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>

                    {/* Tombol Klik Simulasi Real */}
                    <div className="mt-2 pt-1.5 border-t border-emerald-150/40 flex justify-between items-center text-[10px]">
                      <span className="text-[9px] font-medium text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">
                        API Status: SENT
                      </span>
                      <a
                        href={getWaLinkInput(log)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                      >
                        Uji Kirim Asli &rarr;
                      </a>
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
