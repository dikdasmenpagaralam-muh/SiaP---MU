import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { AttendanceRecord, Participant, User } from '../types';

interface DashboardProps {
  participants: Participant[];
  attendance: AttendanceRecord[];
  user?: User;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Dashboard: React.FC<DashboardProps> = ({ participants, attendance, user }) => {
  // Check if user is restricted to a unit
  const isUnitUser = !!user?.unit;

  // Filter Data based on User Unit
  const filteredParticipants = isUnitUser 
    ? participants.filter(p => p.unit === user.unit)
    : participants;

  const filteredAttendance = isUnitUser
    ? attendance.filter(r => r.participantUnit === user.unit)
    : attendance;

  // Stats Calculation
  const totalParticipants = filteredParticipants.length;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Count only those who are "HADIR" (present), excluding 'sakit' or 'izin'
  const attendanceToday = filteredAttendance.filter(r => 
    r.dateString === today && (r.status === 'hadir' || !r.status)
  ).length;
  
  const attendanceRate = totalParticipants > 0 
    ? ((attendanceToday / totalParticipants) * 100).toFixed(1) 
    : '0';

  // Group by Unit for Pie Chart (Only useful for Admin)
  const unitStats = filteredParticipants.reduce((acc, curr) => {
    const existing = acc.find(x => x.name === curr.unit);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.unit, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Simple Mock History Data
  const historyData = [
    { name: 'Jan', hadir: Math.floor(totalParticipants * 0.7) },
    { name: 'Feb', hadir: Math.floor(totalParticipants * 0.8) },
    { name: 'Mar', hadir: Math.floor(totalParticipants * 0.65) },
    { name: 'Apr', hadir: Math.floor(totalParticipants * 0.85) },
    { name: 'Ini', hadir: attendanceToday },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Dashboard {user?.unit ? `- ${user.unit}` : ''}
        </h2>
        <p className="text-gray-500">Ringkasan data absensi pengajian bulanan.</p>
      </div>

      {/* Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${!isUnitUser ? 'lg:grid-cols-4' : ''} gap-4`}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Peserta</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalParticipants}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hadir Bulan Ini</p>
            <h3 className="text-2xl font-bold text-gray-800">{attendanceToday}</h3>
            <p className="text-xs text-gray-400 mt-1">*Tidak termasuk sakit/izin</p>
          </div>
        </div>

        {!isUnitUser && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Persentase</p>
                <h3 className="text-2xl font-bold text-gray-800">{attendanceRate}%</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Tanggal</p>
                <h3 className="text-lg font-bold text-gray-800">{today}</h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts - Hide for Unit User */}
      {!isUnitUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tren Kehadiran</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Legend />
                  <Bar dataKey="hadir" name="Jumlah Hadir" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Sebaran Unit Amal Usaha
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                  >
                    {unitStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;