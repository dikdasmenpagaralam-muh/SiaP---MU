import { Participant, AttendanceRecord, PeriodStatus } from '../types';

const STORAGE_KEY_PARTICIPANTS = 'pdm_participants';
const STORAGE_KEY_ATTENDANCE = 'pdm_attendance';
const STORAGE_KEY_PERIODS = 'pdm_periods';

// Seed data if empty
const SEED_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Ahmad Fauzan', unit: 'SMA Muhammadiyah Pagar Alam', registeredAt: new Date().toISOString() },
  { id: '2', name: 'Siti Rohimah', unit: 'SD Muhammadiyah 1 Pagar Alam', registeredAt: new Date().toISOString() },
  { id: '3', name: 'Rizky Saputra', unit: 'MTs Muhammadiyah Pagar Alam', registeredAt: new Date().toISOString() },
  { id: '4', name: 'Nurjanah', unit: 'Panti Asuhan Muhammadiyah', registeredAt: new Date().toISOString() },
  { id: '5', name: 'Budi Santoso', unit: 'PDM Pagar Alam', registeredAt: new Date().toISOString() },
];

export const getParticipants = (): Participant[] => {
  const data = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(SEED_PARTICIPANTS));
    return SEED_PARTICIPANTS;
  }
  return JSON.parse(data);
};

export const saveParticipants = (participants: Participant[]) => {
  localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(participants));
};

export const getAttendance = (): AttendanceRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
  return data ? JSON.parse(data) : [];
};

export const saveAttendance = (records: AttendanceRecord[]) => {
  localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
};

export const getPeriodStatuses = (): PeriodStatus[] => {
  const data = localStorage.getItem(STORAGE_KEY_PERIODS);
  return data ? JSON.parse(data) : [];
};

export const savePeriodStatus = (year: number, monthIndex: number, isOpen: boolean) => {
  const periods = getPeriodStatuses();
  const existingIndex = periods.findIndex(p => p.year === year && p.monthIndex === monthIndex);
  
  if (existingIndex >= 0) {
    periods[existingIndex].isOpen = isOpen;
  } else {
    periods.push({ year, monthIndex, isOpen });
  }
  
  localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods));
  return periods;
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY_PARTICIPANTS);
  localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
  localStorage.removeItem(STORAGE_KEY_PERIODS);
  window.location.reload();
};