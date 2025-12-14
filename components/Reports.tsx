import React, { useState, useMemo } from 'react';
import { Download, Calendar, ArrowLeft, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface ReportsProps {
  attendance: AttendanceRecord[];
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const Reports: React.FC<ReportsProps> = ({ attendance }) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const YEAR = 2026;

  // Filter attendance based on selected month or return all if no month selected
  const filteredAttendance = useMemo(() => {
    if (selectedMonthIndex === null) {
      return attendance;
    }
    const monthStr = `${YEAR}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    return attendance.filter(r => r.dateString.startsWith(monthStr));
  }, [attendance, selectedMonthIndex]);

  // Sort by timestamp descending
  const sortedAttendance = useMemo(() => {
    return [...filteredAttendance].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredAttendance]);

  const downloadCSV = () => {
    const headers = ['Tanggal', 'Jam', 'Nama Peserta', 'Unit Asal', 'Status', 'Keterangan'];
    const rows = sortedAttendance.map(r => {
      const dateObj = new Date(r.timestamp);
      // Handle legacy records without status
      const status = r.status || 'hadir';
      const notes = r.notes || '-';
      
      return [
        r.dateString,
        dateObj.toLocaleTimeString('id-ID'),
        `"${r.participantName}"`, // Quote to handle commas in names
        `"${r.participantUnit}"`,
        status.toUpperCase(),
        `"${notes}"`
      ].join(',');
    });

    const fileName = selectedMonthIndex !== null 
      ? `rekap_absensi_${MONTHS[selectedMonthIndex]}_${YEAR}.csv`
      : `rekap_absensi_semua_${YEAR}.csv`;

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'hadir':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold inline-block">HADIR</span>;
      case 'sakit':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold inline-block">SAKIT</span>;
      case 'izin':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold inline-block">IZIN</span>;
      default:
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold inline-block">HADIR</span>;
    }
  };

  // --- View 1: Month Grid ---
  if (selectedMonthIndex === null) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laporan & Rekap Bulanan</h2>
            <p className="text-gray-500">Pilih bulan untuk melihat detail laporan absensi tahun {YEAR}.</p>
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span className="hidden md:inline">Download Semua Data (CSV)</span>
            <span className="md:hidden">Semua CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTHS.map((month, index) => {
            const monthStr = `${YEAR}-${String(index + 1).padStart(2, '0')}`;
            const count = attendance.filter(r => r.dateString.startsWith(monthStr)).length;

            return (
              <button
                key={month}
                onClick={() => setSelectedMonthIndex(index)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${count > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                    <FileText size={24} />
                  </div>
                  {count > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
                      {count} Data
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                  {month}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{YEAR}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- View 2: Detailed Table ---
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedMonthIndex(null)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laporan: {MONTHS[selectedMonthIndex]} {YEAR}</h2>
            <p className="text-gray-500">
              Total {sortedAttendance.length} data absensi masuk.
            </p>
          </div>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-lg"
        >
          <Download size={18} />
          Download Laporan {MONTHS[selectedMonthIndex]}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
              <tr>
                <th className="p-4">No</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Nama Peserta</th>
                <th className="p-4">Unit / Sekolah</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedAttendance.map((record, idx) => {
                 // Handle legacy records
                 const status = record.status || 'hadir';
                 
                 return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500 w-12 text-center">{idx + 1}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      <div className="font-medium text-gray-800">
                        {new Date(record.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-xs">{new Date(record.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{record.participantName}</td>
                    <td className="p-4 text-gray-600">{record.participantUnit}</td>
                    <td className="p-4 text-center">
                      {getStatusBadge(status)}
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                  </tr>
                );
              })}
              {sortedAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                    <Calendar size={48} className="mb-2 opacity-20" />
                    <p>Belum ada data absensi pada bulan ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;