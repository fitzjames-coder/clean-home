import { RoomIcon, ToolType, Frequency } from './database.types';

export const ROOM_ICONS: { value: RoomIcon; label: string; emoji: string }[] = [
  { value: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { value: 'bathroom', label: 'Bathroom', emoji: '🚿' },
  { value: 'kids-room', label: "Kids' Room", emoji: '🧸' },
  { value: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { value: 'hallway', label: 'Hallway', emoji: '🚪' },
  { value: 'living-room', label: 'Living Room', emoji: '🛋️' },
  { value: 'dining-room', label: 'Dining Room', emoji: '🪑' },
  { value: 'home-office', label: 'Home Office', emoji: '💻' },
  { value: 'garage', label: 'Garage', emoji: '🚗' },
  { value: 'garden', label: 'Garden', emoji: '🌱' },
];

export const TOOL_META: Record<ToolType, { label: string; emoji: string; description: string }> = {
  duster: { label: 'Duster', emoji: '🪣', description: 'Dust surfaces, shelves, and decor' },
  broom: { label: 'Broom', emoji: '🧹', description: 'Sweep floors and corners' },
  mop: { label: 'Mop', emoji: '🫧', description: 'Mop hard floors' },
  vacuum: { label: 'Vacuum', emoji: '🌀', description: 'Vacuum carpets and rugs' },
  bot: { label: 'Bot', emoji: '🤖', description: 'Run robot vacuum or automated clean' },
};

export const FREQUENCY_META: Record<Frequency, { label: string; shortLabel: string; description: string }> = {
  D: { label: 'Daily', shortLabel: 'D', description: 'Every day' },
  W: { label: 'Weekly', shortLabel: 'W', description: 'Once a week' },
  '2W': { label: 'Bi-Weekly', shortLabel: '2W', description: 'Every two weeks' },
  '2+W': { label: 'Less Often', shortLabel: '2+W', description: 'Every few weeks or less' },
};

export const TOOL_ORDER: ToolType[] = ['duster', 'broom', 'mop', 'vacuum', 'bot'];

export const HOUSEHOLD_CODE_KEY = 'clean_home_household_id';
