export const ROOM_ICONS = [
  { value: 'bedroom',     label: 'Bedroom',     iconUrl: '/room-icons/bedroom.png' },
  { value: 'bathroom',    label: 'Bathroom',    iconUrl: '/room-icons/bathroom.png' },
  { value: 'kids-room',   label: "Kid's Room",  iconUrl: '/room-icons/kids-room.png' },
  { value: 'kitchen',     label: 'Kitchen',     iconUrl: '/room-icons/kitchen.png' },
  { value: 'hallway',     label: 'Hallway',     iconUrl: '/room-icons/hallway.png' },
  { value: 'living-room', label: 'Living Room', iconUrl: '/room-icons/living-room.png' },
  { value: 'dining-room', label: 'Dining Room', iconUrl: '/room-icons/dining-room.png' },
  { value: 'home-office', label: 'Home Office', iconUrl: '/room-icons/home-office.png' },
  { value: 'garage',      label: 'Garage',      iconUrl: '/room-icons/garage.png' },
  { value: 'garden',      label: 'Garden',      iconUrl: '/room-icons/garden.png' },
];

export const TOOL_META = {
  duster:   { label: 'Duster',     iconUrl: '/tool-icons/duster.png',    description: 'Dust surfaces, shelves, and decor' },
  broom:    { label: 'Sweeping',   iconUrl: '/tool-icons/broom.png',     description: 'Sweep floors and corners' },
  mop:      { label: 'Mopping',    iconUrl: '/tool-icons/mop.png',       description: 'Mop hard floors' },
  vacuum:   { label: 'Vacuum',     iconUrl: '/tool-icons/vacuum.png',    description: 'Vacuum carpets and rugs' },
  bot:      { label: 'Vacuum Bot', iconUrl: '/tool-icons/bot.png',       description: 'Run robot vacuum or automated clean' },
  wiping:   { label: 'Wiping',     iconUrl: '/tool-icons/wiping.png',    description: 'Wipe down surfaces and countertops' },
  watering: { label: 'Watering',   iconUrl: '/tool-icons/watering.png',  description: 'Water plants' },
};

export const FREQUENCY_META = {
  D:    { label: 'Daily',      shortLabel: 'D',   description: 'Every day' },
  W:    { label: 'Weekly',     shortLabel: 'W',   description: 'Once a week' },
  '2W': { label: 'Bi-Weekly',  shortLabel: '2W',  description: 'Every two weeks' },
  '2+W':{ label: 'Less Often', shortLabel: '2+W', description: 'Every few weeks or less' },
};

export const TOOL_ORDER = ['duster', 'wiping', 'broom', 'mop', 'vacuum', 'bot', 'watering'];

// Key used to persist the room code in localStorage
export const ROOM_CODE_KEY = 'clean_home_room_code';

// Long-press duration for undo gestures (tools + appliances)
export const LONG_PRESS_UNDO_MS = 1500;

// ── Appliance icons ───────────────────────────────────────────────────────────

export const APPLIANCE_ICONS = {
  stove:             { label: 'Stove',             iconUrl: '/appliance-icons/Stove.png' },
  dryer:             { label: 'Dryer',             iconUrl: '/appliance-icons/Dryer.png' },
  washer:            { label: 'Washer',            iconUrl: '/appliance-icons/Washer.png' },
  dishwasher:        { label: 'Dishwasher',        iconUrl: '/appliance-icons/Dishwasher.png' },
  refrigerator:      { label: 'Refrigerator',      iconUrl: '/appliance-icons/Refrigerator.png' },
  microwave:         { label: 'Microwave',         iconUrl: '/appliance-icons/Microwave.png' },
  robot_vacuum_dock: { label: 'Robot Vacuum Dock', iconUrl: '/appliance-icons/Robot_vacuum_dock.png' },
};

// ── Appliance frequencies ─────────────────────────────────────────────────────

export const APPLIANCE_FREQUENCY_OPTIONS = {
  W:  { label: 'Weekly',      shortLabel: 'W'  },
  '2W':{ label: 'Bi-weekly',  shortLabel: '2W' },
  M:  { label: 'Monthly',     shortLabel: 'M'  },
  '3M':{ label: 'Quarterly',  shortLabel: '3M' },
  '6M':{ label: 'Half-yearly',shortLabel: '6M' },
  Y:  { label: 'Yearly',      shortLabel: 'Y'  },
};

// Threshold in days for each appliance frequency
const APPLIANCE_THRESHOLDS = {
  W:   7,
  '2W':14,
  M:   30,
  '3M':90,
  '6M':180,
  Y:   365,
};

// Grace period: how many days past threshold before escalating to 'critical'
const APPLIANCE_GRACE = {
  W:   2,
  '2W':3,
  M:   7,
  '3M':14,
  '6M':21,
  Y:   30,
};

/**
 * Returns 'never' | 'ok' | 'overdue' | 'critical' for a single appliance.
 */
export function applianceStatus(appliance) {
  if (!appliance.last_completed) return 'never';
  const threshold = APPLIANCE_THRESHOLDS[appliance.frequency] ?? 30;
  const grace     = APPLIANCE_GRACE[appliance.frequency] ?? 7;
  const diffDays  = (Date.now() - new Date(appliance.last_completed).getTime()) / 86400000;
  if (diffDays < threshold)           return 'ok';
  if (diffDays < threshold + grace)   return 'overdue';
  return 'critical';
}

/**
 * Returns true if any appliance in the array is overdue or critical.
 * Used for the nav tab notification dot.
 */
export function anyApplianceOverdue(appliances) {
  return appliances.some(a => {
    const s = applianceStatus(a);
    return s === 'overdue' || s === 'critical';
  });
}

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
 * Returns active overdue/critical tools sorted by TOOL_ORDER, max 7.
 * Includes last_completed so callers can display the new date format.
 *
 * @returns {Array<{tool_type, frequency, last_completed}>}
 */
export function overdueToolsForRoom(tools) {
  return tools
    .filter(t => t.is_active && toolStatus(t.last_completed, t.frequency) !== 'ok')
    .sort((a, b) => TOOL_ORDER.indexOf(a.tool_type) - TOOL_ORDER.indexOf(b.tool_type))
    .slice(0, 7)
    .map(t => ({ tool_type: t.tool_type, frequency: t.frequency, last_completed: t.last_completed }));
}
