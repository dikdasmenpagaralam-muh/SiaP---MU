import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Download, Upload, Plus, Trash2, Search, FileDown, Filter, ChevronLeft, ChevronRight, Lock, AlertTriangle, X } from 'lucide-react';
import { Participant, User } from '../types';

interface ParticipantManagerProps {
  participants: Participant[];
  onAdd: (participant: Participant) => void;
  onDelete: (id: string) => void;
  onImport: (participants: Participant[]) => void;
  user: User;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ participants, onAdd, onDelete, onImport, user }) => {
  const [newMode, setNewMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize unit if user is restricted
  useEffect(() => {
    if (user.unit) {
      setNewUnit(user.unit);
    }
  }, [user.unit]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterUnit]);

  // Download Template Logic
  const handleDownloadTemplate = () => {
    let csvContent = "nama_peserta,asal_sekolah_atau_amal_usaha\nAhmad Fauzan,SMA Muhammadiyah Pagar Alam\nSiti Rohimah,SD Muhammadiyah 1 Pagar Alam\n";
    
    // Customize template help if user has a unit
    if (user.unit) {
      csvContent = `nama_peserta\nBudi Santoso\nSiti Aminah\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_peserta_pdm.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing Logic
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newParticipants: Participant[] = [];

      // Skip header (index 0), start from 1
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle basic CSV split
        const parts = line.split(',');
        let name = parts[0]?.trim();
        let unit = parts[1]?.trim();

        // If user is restricted to a unit, force that unit
        if (user.unit) {
          unit = user.unit;
        }
        
        if (name && unit) {
          newParticipants.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: name,
            unit: unit,
            registeredAt: new Date().toISOString()
          });
        }
      }

      if (newParticipants.length > 0) {
        onImport(newParticipants);
        alert(`Berhasil mengimpor ${newParticipants.length} data peserta${user.unit ? ` ke ${user.unit}` : ''}.`);
      } else {
        alert('Gagal membaca data atau format CSV salah.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUnit = user.unit || newUnit;

    if (newName && finalUnit) {
      onAdd({
        id: Date.now().toString(),
        name: newName,
        unit: finalUnit,
        registeredAt: new Date().toISOString()
      });
      setNewName('');
      if (!user.unit) setNewUnit(''); // clear unit only if admin
      setNewMode(false);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Extract unique units for filter (Admin only)
  const uniqueUnits = useMemo(() => {
    const units = new Set(participants.map(p => p.unit));
    return ['Semua', ...Array.from(units).sort()];
  }, [participants]);

  const filtered = participants.filter(p => {
    // 1. Restriction Filter (Unit User)
    if (user.unit && p.unit !== user.unit) return false;

    // 2. Search Filter
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.unit.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Dropdown Filter (Admin)
    const matchesFilter = filterUnit === 'Semua' || p.unit === filterUnit;
    
    return matchesSearch && matchesFilter;
  });

  // Adjust pagination if data shrinks (e.g., after deletion)
  useEffect(() => {
    const maxPage = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filtered.length, currentPage]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Peserta</h2>
          <p className="text-gray-500">
            {user.unit 
              ? `Kelola daftar peserta untuk ${user.unit}.` 
              : 'Kelola seluruh daftar peserta pengajian.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 bg-white"
          >
            <FileDown size={18} />
            <span className="hidden md:inline">Template CSV</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload size={18} />
            <span className="hidden md:inline">Import Excel/CSV</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => setNewMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Tambah Manual</span>
          </button>
        </div>
      </div>

      {newMode && (
        <form onSubmit={handleManualAdd} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-4">Tambah Peserta Baru {user.unit ? `(${user.unit})` : ''}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input 
                required
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Contoh: Ahmad Fauzan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah / AUM</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={user.unit || newUnit} 
                  onChange={e => setNewUnit(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${user.unit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="Contoh: SMA Muhammadiyah"
                  disabled={!!user.unit}
                />
                {user.unit && (
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNewMode(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama peserta..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Show Filter only for Admin (who has no specific unit) */}
          {!user.unit && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={20} className="text-gray-500" />
              <select 
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full md:w-64 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500"
              >
                {uniqueUnits.map(unit => (
                  <option key={unit} value={unit}>{unit === 'Semua' ? 'Semua Unit' : unit}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
              <tr>
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">Nama Peserta</th>
                <th className="p-4">Asal Unit</th>
                <th className="p-4">Terdaftar</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                  <td className="p-4 font-medium text-gray-800">{p.name}</td>
                  <td className="p-4 text-gray-600">{p.unit}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(p.registeredAt).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-right">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(p);
                      }}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Hapus Peserta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
            {/* Total Footer */}
            <tfoot className="bg-gray-100 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="p-4 font-bold text-gray-700">Total Peserta</td>
                <td colSpan={2} className="p-4 font-bold text-gray-900 text-right">
                  {filtered.length} <span className="font-normal text-gray-500 text-sm">dari {participants.length}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
            <button 
              type="button"
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                ${currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>
            
            <span className="text-sm text-gray-600 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button 
              type="button"
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Selanjutnya
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus peserta <strong className="text-gray-900">{deleteTarget.name}</strong>? 
              <br/><span className="text-sm mt-2 block text-gray-500">Tindakan ini tidak dapat dibatalkan.</span>
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantManager;