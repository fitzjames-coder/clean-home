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

// Key used to persist the room code in localStorage
export const ROOM_CODE_KEY = 'clean_home_room_code';

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

// ── Room-card status helpers ──────────────────────────────────────────────────

const THRESHOLDS = { D: 1, W: 7, '2W': 14, '2+W': 21 };
const CRITICAL_GRACE = 2.5; // days past threshold before escalating to critical

/**
 * Returns 'ok' | 'overdue' | 'critical' for a single tool.
 *
 * - ok       : not yet past the frequency threshold
 * - overdue  : past threshold, but less than (threshold + 2.5) days overdue
 * - critical : at or beyond (threshold + 2.5) days overdue
 *
 * Never-cleaned tools (lastCompleted is null) return 'overdue'. We don't
 * escalate them to critical because we don't have created_at here.
 */
export function toolStatus(lastCompleted, frequency) {
  const threshold = THRESHOLDS[frequency] ?? 7;
  if (!lastCompleted) return 'overdue';
  const diffDays = (Date.now() - new Date(lastCompleted).getTime()) / 86400000;
  if (diffDays < threshold)                    return 'ok';
  if (diffDays < threshold + CRITICAL_GRACE)   return 'overdue';
  return 'critical';
}

/**
 * Returns the worst status across all active tools in a room.
 * 'critical' > 'overdue' > 'ok'. Returns 'ok' when there are no active tools.
 *
 * @param {Array<{is_active: boolean, last_completed: string|null, frequency: string}>} tools
 */
export function roomStatus(tools) {
  let worst = 'ok';
  for (const tool of tools) {
    if (!tool.is_active) continue;
    const s = toolStatus(tool.last_completed, tool.frequency);
    if (s === 'critical') return 'critical';   // can't get worse — short-circuit
    if (s === 'overdue')  worst = 'overdue';
  }
  return worst;
}
