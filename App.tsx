import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AttendanceForm from './components/AttendanceForm';
import ParticipantManager from './components/ParticipantManager';
import Reports from './components/Reports';
import Login from './components/Login';
import { ViewState, Participant, AttendanceRecord, User, AttendanceStatus } from './types';
import * as DataService from './services/dataService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State with Lazy Initialization
  // This reads from LocalStorage ONCE when the app mounts.
  const [participants, setParticipants] = useState<Participant[]>(() => DataService.getParticipants());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => DataService.getAttendance());

  // Persistence Effects:
  // Whenever participants state changes, save it to LocalStorage.
  useEffect(() => {
    DataService.saveParticipants(participants);
  }, [participants]);

  // Whenever attendance state changes, save it to LocalStorage.
  useEffect(() => {
    DataService.saveAttendance(attendance);
  }, [attendance]);

  // Load User Session
  useEffect(() => {
    const savedUser = localStorage.getItem('pdm_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pdm_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pdm_current_user');
    setCurrentView('dashboard'); 
  };

  // Handlers
  const handleAddParticipant = (newParticipant: Participant) => {
    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleDeleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleImportParticipants = (newParticipants: Participant[]) => {
    setParticipants(prev => {
      // Merge without duplicates (based on name)
      const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
      const uniqueNew = newParticipants.filter(p => !existingNames.has(p.name.toLowerCase()));
      return [...prev, ...uniqueNew];
    });
  };

  const handleCheckIn = (participant: Participant, status: AttendanceStatus, notes?: string, customDate?: Date) => {
    const now = customDate || new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, -1);
    const dateStr = localISOTime.split('T')[0];

    const record: AttendanceRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      participantId: participant.id,
      participantName: participant.name,
      participantUnit: participant.unit,
      timestamp: now.toISOString(),
      dateString: dateStr,
      status: status,
      notes: notes
    };

    setAttendance(prev => [...prev, record]);
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard participants={participants} attendance={attendance} user={currentUser} />;
      case 'attendance':
        return (
          <AttendanceForm 
            participants={participants} 
            attendance={attendance} 
            onCheckIn={handleCheckIn}
            user={currentUser}
          />
        );
      case 'participants':
        return (
          <ParticipantManager 
            participants={participants}
            onAdd={handleAddParticipant}
            onDelete={handleDeleteParticipant}
            onImport={handleImportParticipants}
            user={currentUser}
          />
        );
      case 'reports':
        if (currentUser.role !== 'admin') return <Dashboard participants={participants} attendance={attendance} user={currentUser} />;
        return <Reports attendance={attendance} />;
      default:
        return <Dashboard participants={participants} attendance={attendance} user={currentUser} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800">Sistem Absensi PDM</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;