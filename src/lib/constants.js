export const ROOM_ICONS = [
  { value: 'bedroom',     label: 'Bedroom',     iconUrl: '/room-icons/bedroom.PNG' },
  { value: 'bathroom',    label: 'Bathroom',    iconUrl: '/room-icons/bathroom.PNG' },
  { value: 'kids-room',   label: "Kid's Room",  iconUrl: '/room-icons/kids-room.PNG' },
  { value: 'kitchen',     label: 'Kitchen',     iconUrl: '/room-icons/kitchen.PNG' },
  { value: 'hallway',     label: 'Hallway',     iconUrl: '/room-icons/hallway.PNG' },
  { value: 'living-room', label: 'Living Room', iconUrl: '/room-icons/living-room.PNG' },
  { value: 'dining-room', label: 'Dining Room', iconUrl: '/room-icons/dining-room.PNG' },
  { value: 'home-office', label: 'Home Office', iconUrl: '/room-icons/home-office.PNG' },
  { value: 'garage',      label: 'Garage',      iconUrl: '/room-icons/garage.PNG' },
  { value: 'garden',      label: 'Garden',      iconUrl: '/room-icons/garden.PNG' },
];

export const TOOL_META = {
  duster: { label: 'Duster',     iconUrl: '/tool-icons/duster.PNG',  description: 'Dust surfaces, shelves, and decor' },
  broom:  { label: 'Sweeping',   iconUrl: '/tool-icons/broom.PNG',   description: 'Sweep floors and corners' },
  mop:    { label: 'Mopping',    iconUrl: '/tool-icons/mop.PNG',     description: 'Mop hard floors' },
  vacuum: { label: 'Vacuum',     iconUrl: '/tool-icons/vacuum.PNG',  description: 'Vacuum carpets and rugs' },
  bot:    { label: 'Vacuum Bot', iconUrl: '/tool-icons/bot.PNG',     description: 'Run robot vacuum or automated clean' },
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

/**
 * Format a last-cleaned timestamp in the new style:
 *   "May 23 | 5h ago"   — date (short, no year unless different) | rolling relative
 *   "Never"             — when dateStr is null
 *
 * Relative tiers:
 *   < 1 h  → "just now"
 *   1–23 h → "5h ago"
 *   24+ h  → "1 day ago", "3 days ago"
 *   7+ d   → "1 week ago", "2 weeks ago"
 *   30+ d  → "1 month ago", "2 months ago"
 *
 * Uses a rolling 24-hour window — NOT calendar-day boundaries.
 */
export function formatLastCleaned(dateStr) {
  if (!dateStr) return 'Never';

  const now      = Date.now();
  const cleaned  = new Date(dateStr).getTime();
  const diffMs   = now - cleaned;
  const diffMins = diffMs / 60000;
  const diffHrs  = diffMs / 3600000;
  const diffDays = diffMs / 86400000;

  // Relative label
  let relative;
  if (diffMins < 60) {
    relative = 'just now';
  } else if (diffHrs < 24) {
    const h = Math.floor(diffHrs);
    relative = `${h}h ago`;
  } else if (diffDays < 7) {
    const d = Math.floor(diffDays);
    relative = `${d} day${d !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const w = Math.floor(diffDays / 7);
    relative = `${w} week${w !== 1 ? 's' : ''} ago`;
  } else {
    const m = Math.floor(diffDays / 30);
    relative = `${m} month${m !== 1 ? 's' : ''} ago`;
  }

  // Absolute date label — short month + day, add year only when different
  const d        = new Date(dateStr);
  const nowDate  = new Date(now);
  const monthStr = d.toLocaleString('default', { month: 'short' });
  const dayStr   = d.getDate();
  const yearStr  = d.getFullYear() !== nowDate.getFullYear()
    ? `, ${d.getFullYear()}`
    : '';
  const absDate  = `${monthStr} ${dayStr}${yearStr}`;

  return `${absDate} | ${relative}`;
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
 * Returns 'ok' | 'overdue' | 'critical' for the room card.
 * Majority rule: critical if ≥ Math.ceil(active/2) tools are overdue.
 */
export function roomStatus(tools) {
  const active = tools.filter(t => t.is_active);
  if (active.length === 0) return 'ok';

  const overdueCount = active.filter(
    t => toolStatus(t.last_completed, t.frequency) !== 'ok'
  ).length;

  if (overdueCount === 0)                              return 'ok';
  if (overdueCount >= Math.ceil(active.length / 2))   return 'critical';
  return 'overdue';
}

/**
 * Returns active overdue/critical tools sorted by TOOL_ORDER, max 5.
 * Includes last_completed so callers can display the new date format.
 *
 * @returns {Array<{tool_type, frequency, last_completed}>}
 */
export function overdueToolsForRoom(tools) {
  return tools
    .filter(t => t.is_active && toolStatus(t.last_completed, t.frequency) !== 'ok')
    .sort((a, b) => TOOL_ORDER.indexOf(a.tool_type) - TOOL_ORDER.indexOf(b.tool_type))
    .slice(0, 5)
    .map(t => ({ tool_type: t.tool_type, frequency: t.frequency, last_completed: t.last_completed }));
}
