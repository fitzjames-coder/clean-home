export const ROOM_ICONS = [
  { value: 'bedroom',     label: 'Bedroom',     emoji: '🛏️' },
  { value: 'bathroom',    label: 'Bathroom',    emoji: '🚿' },
  { value: 'kids-room',   label: "Kids' Room",  emoji: '🧸' },
  { value: 'kitchen',     label: 'Kitchen',     emoji: '🍳' },
  { value: 'hallway',     label: 'Hallway',     emoji: '🚪' },
  { value: 'living-room', label: 'Living Room', emoji: '🛋️' },
  { value: 'dining-room', label: 'Dining Room', emoji: '🪑' },
  { value: 'home-office', label: 'Home Office', emoji: '💻' },
  { value: 'garage',      label: 'Garage',      emoji: '🚗' },
  { value: 'garden',      label: 'Garden',      emoji: '🌱' },
];

export const TOOL_META = {
  duster: { label: 'Duster', emoji: '🪣', description: 'Dust surfaces, shelves, and decor' },
  broom:  { label: 'Broom',  emoji: '🧹', description: 'Sweep floors and corners' },
  mop:    { label: 'Mop',    emoji: '🫧', description: 'Mop hard floors' },
  vacuum: { label: 'Vacuum', emoji: '🌀', description: 'Vacuum carpets and rugs' },
  bot:    { label: 'Bot',    emoji: '🤖', description: 'Run robot vacuum or automated clean' },
};

export const FREQUENCY_META = {
  D:    { label: 'Daily',      shortLabel: 'D',   description: 'Every day' },
  W:    { label: 'Weekly',     shortLabel: 'W',   description: 'Once a week' },
  '2W': { label: 'Bi-Weekly',  shortLabel: '2W',  description: 'Every two weeks' },
  '2+W':{ label: 'Less Often', shortLabel: '2+W', description: 'Every few weeks or less' },
};

export const TOOL_ORDER = ['duster', 'broom', 'mop', 'vacuum', 'bot'];

export const HOUSEHOLD_CODE_KEY = 'clean_home_household_id';

// ── Date helpers ─────────────────────────────────────────────────────────────

export function isDue(lastCompleted, frequency) {
  if (!lastCompleted) return true;
  const diffDays = (Date.now() - new Date(lastCompleted).getTime()) / 86400000;
  const thresholds = { D: 1, W: 7, '2W': 14, '2+W': 21 };
  return diffDays >= (thresholds[frequency] ?? 7);
}

export function formatLastCleaned(dateStr) {
  if (!dateStr) return 'Never';
  const diffMs  = Date.now() - new Date(dateStr).getTime();
  const diffDays = diffMs / 86400000;
  if (diffDays < 1)  return 'Today';
  if (diffDays < 2)  return 'Yesterday';
  const d = Math.floor(diffDays);
  if (d < 7)  return `${d} days ago`;
  const w = Math.floor(d / 7);
  return `${w} week${w > 1 ? 's' : ''} ago`;
}

export function formatLastCleanedFull(dateStr) {
  if (!dateStr) return 'Never cleaned';
  return new Date(dateStr).toLocaleString();
}

export function generateHouseholdCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
