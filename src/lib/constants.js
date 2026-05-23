import DusterIcon     from '../components/icons/DusterIcon.jsx';
import SweepingIcon   from '../components/icons/SweepingIcon.jsx';
import MoppingIcon    from '../components/icons/MoppingIcon.jsx';
import VacuumIcon     from '../components/icons/VacuumIcon.jsx';
import VacuumBotIcon  from '../components/icons/VacuumBotIcon.jsx';
import DiningRoomIcon from '../components/icons/DiningRoomIcon.jsx';

export const ROOM_ICONS = [
  { value: 'bedroom',     label: 'Bedroom',     emoji: '🛏️' },
  { value: 'bathroom',    label: 'Bathroom',    emoji: '🚿' },
  { value: 'kids-room',   label: "Kids' Room",  emoji: '🧸' },
  { value: 'kitchen',     label: 'Kitchen',     emoji: '🍳' },
  { value: 'hallway',     label: 'Hallway',     emoji: '🚪' },
  { value: 'living-room', label: 'Living Room', emoji: '🛋️' },
  { value: 'dining-room', label: 'Dining Room', Icon: DiningRoomIcon },
  { value: 'home-office', label: 'Home Office', emoji: '💻' },
  { value: 'garage',      label: 'Garage',      emoji: '🚗' },
  { value: 'garden',      label: 'Garden',      emoji: '🌱' },
];

export const TOOL_META = {
  duster: { label: 'Duster',     Icon: DusterIcon,    description: 'Dust surfaces, shelves, and decor' },
  broom:  { label: 'Sweeping',   Icon: SweepingIcon,  description: 'Sweep floors and corners' },
  mop:    { label: 'Mopping',    Icon: MoppingIcon,   description: 'Mop hard floors' },
  vacuum: { label: 'Vacuum',     Icon: VacuumIcon,    description: 'Vacuum carpets and rugs' },
  bot:    { label: 'Vacuum Bot', Icon: VacuumBotIcon, description: 'Run robot vacuum or automated clean' },
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
 *
 * New majority rule (replaces the old single-tool 2.5-day critical threshold):
 *   - 'ok'       = zero active tools are overdue
 *   - 'overdue'  = ≥1 active tool overdue, but fewer than half are overdue
 *   - 'critical' = half or more active tools are overdue
 *                  (Math.ceil so 3 active tools → 2+ overdue = critical)
 *
 * toolStatus() is unchanged — ToolCard per-tool styling is unaffected.
 *
 * @param {Array<{is_active: boolean, last_completed: string|null, frequency: string}>} tools
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
 * Returns active overdue/critical tools sorted by TOOL_ORDER.
 * Each entry is { tool_type, frequency } — enough to render "Sweeping: W".
 * Returns [] when all tools are on track.
 *
 * Requires tools rows to include `tool_type` (fetched from clean_home_tools).
 *
 * @param {Array<{tool_type: string, is_active: boolean, last_completed: string|null, frequency: string}>} tools
 * @returns {Array<{tool_type: string, frequency: string}>}
 */
export function overdueToolsForRoom(tools) {
  return tools
    .filter(t => t.is_active && toolStatus(t.last_completed, t.frequency) !== 'ok')
    .sort((a, b) => TOOL_ORDER.indexOf(a.tool_type) - TOOL_ORDER.indexOf(b.tool_type))
    .slice(0, 5)
    .map(t => ({ tool_type: t.tool_type, frequency: t.frequency }));
}
