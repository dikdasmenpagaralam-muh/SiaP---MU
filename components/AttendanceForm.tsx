import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, QrCode, AlertCircle, Calendar, ArrowLeft, Users, Lock, Unlock, X, Clock, FileText } from 'lucide-react';
import { Participant, AttendanceRecord, User, PeriodStatus, AttendanceStatus } from '../types';
import * as DataService from '../services/dataService';

interface AttendanceFormProps {
  participants: Participant[];
  attendance: AttendanceRecord[];
  onCheckIn: (participant: Participant, status: AttendanceStatus, notes?: string, date?: Date) => void;
  user: User;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const AttendanceForm: React.FC<AttendanceFormProps> = ({ participants, attendance, onCheckIn, user }) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Selection Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [izinReason, setIzinReason] = useState('');
  const [isIzinMode, setIsIzinMode] = useState(false);
  
  // State for period statuses
  const [periodStatuses, setPeriodStatuses] = useState<PeriodStatus[]>([]);

  const YEAR = 2026;

  useEffect(() => {
    setPeriodStatuses(DataService.getPeriodStatuses());
  }, []);

  const handleTogglePeriod = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent card click
    if (user.role !== 'admin') return;

    const currentStatus = periodStatuses.find(p => p.year === YEAR && p.monthIndex === index)?.isOpen ?? false;
    const newStatus = !currentStatus;
    
    const updated = DataService.savePeriodStatus(YEAR, index, newStatus);
    setPeriodStatuses(updated);
  };

  const isPeriodOpen = (index: number) => {
    return periodStatuses.find(p => p.year === YEAR && p.monthIndex === index)?.isOpen ?? false;
  };

  // Calculate target date based on selection or fallback to today
  const targetDate = useMemo(() => {
    if (selectedMonthIndex === null) return new Date();
    return new Date(YEAR, selectedMonthIndex, 1, 9, 0, 0);
  }, [selectedMonthIndex]);

  // Format YYYY-MM-DD
  const targetDateString = useMemo(() => {
    const offset = targetDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(targetDate.getTime() - offset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
  }, [targetDate]);

  const filteredParticipants = useMemo(() => {
    let baseList = participants;

    // Filter by User Unit if not admin
    if (user.role !== 'admin' && user.unit) {
      baseList = participants.filter(p => p.unit === user.unit);
    }

    if (!searchTerm) return baseList;

    return baseList.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, participants, user]);

  const handleOpenModal = (participant: Participant) => {
    const alreadyPresent = attendance.some(
      r => r.participantId === participant.id && r.dateString === targetDateString
    );

    if (alreadyPresent) {
      setNotification({ msg: `${participant.name} sudah absen di bulan ini.`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setSelectedParticipant(participant);
      setIsIzinMode(false);
      setIzinReason('');
    }
  };

  const submitAttendance = (status: AttendanceStatus, notes?: string) => {
    if (!selectedParticipant) return;

    onCheckIn(selectedParticipant, status, notes, targetDate);
    
    let statusText = "Hadir";
    if (status === 'sakit') statusText = "Sakit";
    if (status === 'izin') statusText = "Izin";

    setNotification({ msg: `${selectedParticipant.name} dicatat sebagai ${statusText}!`, type: 'success' });
    setSearchTerm('');
    setSelectedParticipant(null);
    setIsIzinMode(false);
    
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'hadir':
        return <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-100 px-3 py-1 rounded-full"><CheckCircle size={14} /> Hadir</span>;
      case 'sakit':
        return <span className="flex items-center gap-1 text-yellow-600 font-medium text-sm bg-yellow-100 px-3 py-1 rounded-full"><AlertCircle size={14} /> Sakit</span>;
      case 'izin':
        return <span className="flex items-center gap-1 text-blue-600 font-medium text-sm bg-blue-100 px-3 py-1 rounded-full"><FileText size={14} /> Izin</span>;
      default:
        return <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-100 px-3 py-1 rounded-full"><CheckCircle size={14} /> Hadir</span>;
    }
  };

  // --- View 1: Month Selection Grid ---
  if (selectedMonthIndex === null) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Absensi Pengajian {YEAR}</h2>
          <p className="text-gray-500">
            {user.role === 'admin' 
              ? 'Kelola periode absensi dan masuk untuk mencatat kehadiran.' 
              : `Halo ${user.name}, pilih bulan untuk absensi.`}
          </p>
          {user.unit && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              Unit: {user.unit}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTHS.map((month, index) => {
            const monthStr = `${YEAR}-${String(index + 1).padStart(2, '0')}`;
            
            // Calculate count based on user access
            let count = 0;
            if (user.role === 'admin' || !user.unit) {
              count = attendance.filter(r => r.dateString.startsWith(monthStr)).length;
            } else {
              // Only count attendance for the specific unit
              count = attendance.filter(r => r.dateString.startsWith(monthStr) && r.participantUnit === user.unit).length;
            }

            const isOpen = isPeriodOpen(index);
            const canAccess = isOpen || user.role === 'admin';

            return (
              <div key={month} className="relative group">
                {/* Status Badge (Admin only control) */}
                {user.role === 'admin' && (
                  <button 
                    onClick={(e) => handleTogglePeriod(e, index)}
                    className={`absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-sm transition-all border
                      ${isOpen ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'}`}
                    title={isOpen ? "Tutup Absensi" : "Buka Absensi"}
                  >
                    {isOpen ? <Unlock size={14} /> : <Lock size={14} />}
                  </button>
                )}

                <button
                  disabled={!canAccess}
                  onClick={() => canAccess && setSelectedMonthIndex(index)}
                  className={`w-full text-left p-6 rounded-xl border shadow-sm transition-all h-full
                    ${canAccess 
                      ? 'bg-white border-gray-200 hover:border-green-400 hover:shadow-md cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed grayscale'}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${count > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Calendar size={24} />
                    </div>
                    
                    {/* Access Indicator for User */}
                    {!isOpen && user.role !== 'admin' && (
                      <span className="text-gray-400">
                        <Lock size={18} />
                      </span>
                    )}

                    {count > 0 && isOpen && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                        {count} Data
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {month}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-400">{YEAR}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isOpen ? 'Dibuka' : 'Ditutup'}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- View 2: Attendance Form ---
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setSelectedMonthIndex(null)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Absensi: {MONTHS[selectedMonthIndex]} {YEAR}</h2>
          <p className="text-gray-500">
            {isPeriodOpen(selectedMonthIndex!) ? 'Silakan input kehadiran.' : 'PERIODE DITUTUP (Mode Admin)'}
          </p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-bounce ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Warning for Admin if entering data in closed period */}
      {user.role === 'admin' && !isPeriodOpen(selectedMonthIndex!) && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg text-sm flex gap-2 items-center">
          <AlertCircle size={16} />
          <span>Periode ini sedang ditutup untuk User, namun Admin tetap bisa melakukan input.</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={user.unit ? `Cari Peserta ${user.unit}...` : "Ketik Nama Peserta atau Asal Sekolah..."}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {/* Default State Empty */}
          {searchTerm === '' && (
             <div className="text-center py-8 text-gray-400">
               <div className="flex justify-center gap-2 mb-2 opacity-30">
                 <Users size={32} />
                 <Search size={32} />
               </div>
               <p>
                 {user.unit 
                  ? `Mulai ketik nama peserta dari ${user.unit}...` 
                  : "Mulai ketik nama untuk mencari..."}
               </p>
             </div>
          )}

          {/* Not Found */}
          {searchTerm !== '' && filteredParticipants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ditemukan peserta dengan nama tersebut
              {user.unit ? ` di ${user.unit}` : ''}.
            </div>
          )}

          {/* List */}
          {filteredParticipants.map(participant => {
            const record = attendance.find(r => r.participantId === participant.id && r.dateString === targetDateString);
            const isPresent = !!record;
            
            return (
              <div 
                key={participant.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isPresent 
                    ? 'bg-gray-50 border-gray-200 opacity-80' 
                    : 'bg-white border-gray-100 hover:border-green-300 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => !isPresent && handleOpenModal(participant)}
              >
                <div>
                  <h4 className="font-bold text-gray-800">{participant.name}</h4>
                  <p className="text-sm text-gray-500">{participant.unit}</p>
                </div>
                <div>
                  {isPresent ? (
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(record.status)}
                      {record.status === 'izin' && record.notes && (
                        <span className="text-xs text-gray-500 max-w-[150px] truncate">"{record.notes}"</span>
                      )}
                    </div>
                  ) : (
                    <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                      Input
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400 mb-2">atau gunakan metode lain</p>
        <button 
          onClick={() => setShowQRScanner(!showQRScanner)}
          className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <QrCode size={20} />
          {showQRScanner ? 'Tutup Scanner' : 'Scan QR Code'}
        </button>
      </div>

      {showQRScanner && (
        <div className="bg-black p-4 rounded-xl flex items-center justify-center text-white h-64 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <QrCode size={120} />
          </div>
          <p className="text-center z-10">Fitur Kamera Scan QR <br/>(Simulasi Area)</p>
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-[ping_2s_infinite]"></div>
        </div>
      )}

      {/* Attendance Option Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Input Kehadiran</h3>
              <button onClick={() => setSelectedParticipant(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                  <Users size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-800">{selectedParticipant.name}</h4>
                <p className="text-sm text-gray-500">{selectedParticipant.unit}</p>
              </div>

              {!isIzinMode ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => submitAttendance('hadir')}
                    className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-green-800 font-bold"
                  >
                    <span className="flex items-center gap-3"><CheckCircle size={20} /> Hadir</span>
                    <span className="text-green-600 text-sm">Masuk</span>
                  </button>

                  <button 
                    onClick={() => submitAttendance('sakit')}
                    className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors text-yellow-800 font-bold"
                  >
                    <span className="flex items-center gap-3"><AlertCircle size={20} /> Sakit</span>
                    <span className="text-yellow-600 text-sm">Berhalangan</span>
                  </button>

                  <button 
                    onClick={() => setIsIzinMode(true)}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-blue-800 font-bold"
                  >
                    <span className="flex items-center gap-3"><FileText size={20} /> Izin</span>
                    <span className="text-blue-600 text-sm">Input Alasan</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Izin</label>
                    <textarea 
                      autoFocus
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                      placeholder="Contoh: Ada acara keluarga..."
                      value={izinReason}
                      onChange={(e) => setIzinReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsIzinMode(false)}
                      className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={() => {
                        if (!izinReason.trim()) {
                          alert("Mohon isi alasan izin.");
                          return;
                        }
                        submitAttendance('izin', izinReason);
                      }}
                      className="flex-1 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold shadow-lg"
                    >
                      Kirim Izin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceForm;