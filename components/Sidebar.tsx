import React from 'react';
import { LayoutDashboard, UserCheck, Users, FileText, Menu, X, LogOut } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen, user, onLogout }) => {
  // Define menu items
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { id: 'attendance', label: 'Absensi Kehadiran', icon: UserCheck, roles: ['admin', 'user'] },
    { id: 'participants', label: 'Data Peserta', icon: Users, roles: ['admin', 'user'] },
    { id: 'reports', label: 'Laporan & Rekap', icon: FileText, roles: ['admin'] },
  ];

  // Filter based on role
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  const handleNavClick = (view: string) => {
    onChangeView(view as ViewState);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-green-400">SI-ABSENSI</h1>
            <p className="text-xs text-slate-400">PDM Pagar Alam</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Keluar
          </button>
          <p className="mt-4 text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Muhammadiyah Pagar Alam
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;