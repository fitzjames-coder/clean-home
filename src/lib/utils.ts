import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Frequency } from './database.types';

export function formatLastCleaned(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatLastCleanedFull(dateStr: string | null): string {
  if (!dateStr) return 'Never cleaned';
  return format(new Date(dateStr), 'PPp');
}

export function generateHouseholdCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function isDue(lastCompleted: string | null, frequency: Frequency): boolean {
  if (!lastCompleted) return true;
  const last = new Date(lastCompleted);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  switch (frequency) {
    case 'D': return diffDays >= 1;
    case 'W': return diffDays >= 7;
    case '2W': return diffDays >= 14;
    case '2+W': return diffDays >= 21;
    default: return false;
  }
}

export function getStatusColor(lastCompleted: string | null, frequency: Frequency): string {
  if (!lastCompleted) return 'text-red-500';
  if (isDue(lastCompleted, frequency)) return 'text-amber-500';
  return 'text-brand-teal';
}
