export interface Participant {
  id: string;
  name: string;
  unit: string; // Asal sekolah atau amal usaha
  registeredAt: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin';

export interface AttendanceRecord {
  id: string;
  participantId: string;
  participantName: string;
  participantUnit: string;
  timestamp: string; // ISO String
  dateString: string; // YYYY-MM-DD for easier grouping
  status: AttendanceStatus;
  notes?: string; // Alasan izin atau catatan lainnya
}

export interface UnitStat {
  name: string;
  count: number;
}

export type ViewState = 'dashboard' | 'attendance' | 'participants' | 'reports';

export type Role = 'admin' | 'user';

export interface User {
  username: string;
  name: string;
  role: Role;
  unit?: string; // If defined, user can only see data from this unit
}

export interface PeriodStatus {
  year: number;
  monthIndex: number; // 0-11
  isOpen: boolean;
}