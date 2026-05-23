import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { TOOL_META, FREQUENCY_META, isDue, formatLastCleaned, formatLastCleanedFull } from '../lib/constants.js';
import FrequencySelector from './FrequencySelector.jsx';

const LONG_PRESS_MS = 2000;

export default function ToolCard({ tool, onUpdate }) {
  const [expanded,       setExpanded]       = useState(false);
  const [instructions,   setInstructions]   = useState(tool.instructions ?? '');
  const [savingInstr,    setSavingInstr]    = useState(false);
  const [markingDone,    setMarkingDone]    = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // ── Undo state ────────────────────────────────────────────────────────────
  // prevCompleted: the last_completed value before the most recent mark-done
  // undoFlash:    show "Undone" confirmation briefly
  // pressing:     long-press in progress (drives pulse animation)
  const [prevCompleted, setPrevCompleted] = useState(null);
  const [undoFlash,     setUndoFlash]     = useState(false);
  const [pressing,      setPressing]      = useState(false);
  const longPressTimer  = useRef(null);
  const undoFlashTimer  = useRef(null);

  const meta     = TOOL_META[tool.tool_type];
  const due      = isDue(tool.last_completed, tool.frequency);
  const last     = formatLastCleaned(tool.last_completed);
  const lastFull = formatLastCleanedFull(tool.last_completed);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function markDone() {
    if (markingDone) return;
    setMarkingDone(true);
    // Remember where we were so the user can undo
    setPrevCompleted(tool.last_completed ?? null);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('clean_home_tools')
      .update({ last_completed: now })
      .eq('id', tool.id);
    if (!error) onUpdate({ last_completed: now });
    setMarkingDone(false);
  }

  async function undoMarkDone() {
    // Revert to the stored previous value (null means "never cleaned")
    const prev = prevCompleted;
    const { error } = await supabase
      .from('clean_home_tools')
      .update({ last_completed: prev })
      .eq('id', tool.id);
    if (!error) {
      onUpdate({ last_completed: prev });
      setPrevCompleted(null);
      // Show brief "Undone" flash
      setUndoFlash(true);
      clearTimeout(undoFlashTimer.current);
      undoFlashTimer.current = setTimeout(() => setUndoFlash(false), 2000);
    }
  }

  async function toggleActive() {
    if (togglingActive) return;
    setTogglingActive(true);
    const newActive = !tool.is_active;
    const { error } = await supabase
      .from('clean_home_tools')
      .update({ is_active: newActive })
      .eq('id', tool.id);
    if (!error) onUpdate({ is_active: newActive });
    setTogglingActive(false);
  }

  async function updateFrequency(f) {
    const { error } = await supabase
      .from('clean_home_tools')
      .update({ frequency: f })
      .eq('id', tool.id);
    if (!error) onUpdate({ frequency: f });
  }

  async function saveInstructions() {
    setSavingInstr(true);
    await supabase.from('clean_home_tools').update({ instructions }).eq('id', tool.id);
    onUpdate({ instructions });
    setSavingInstr(false);
  }

  // ── Long-press handlers (undo gesture) ───────────────────────────────────

  function handlePressStart(e) {
    // Only handle long-press when tool has been marked done at some point
    if (!tool.last_completed) return;
    e.preventDefault();          // prevent text selection on mobile
    setPressing(true);
    longPressTimer.current = setTimeout(() => {
      setPressing(false);
      undoMarkDone();
    }, LONG_PRESS_MS);
  }

  function handlePressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressing(false);
  }

  // ── Icon helper ───────────────────────────────────────────────────────────

  function ToolIcon({ size = 26, style = {} }) {
    if (meta?.iconUrl) {
      return (
        <img
          src={meta.iconUrl}
          alt={meta.label}
          width={size}
          height={size}
          className="tool-icon-img"
          style={style}
        />
      );
    }
    return <span style={{ fontSize: size, ...style }}>{meta?.emoji ?? '?'}</span>;
  }

  // ── Inactive state ────────────────────────────────────────────────────────

  if (!tool.is_active) {
    return (
      <div className="tool-card inactive">
        <div className="tool-card-main">
          <ToolIcon size={28} style={{ filter: 'grayscale(1)', opacity: 0.6 }} />
          <div className="tool-info">
            <div className="tool-name">{meta.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inactive</div>
          </div>
          <div className="tool-controls">
            <button
              className="tool-toggle-btn"
              onClick={toggleActive}
              title="Re-enable tool"
              style={{ fontSize: 22, color: 'var(--text-muted)' }}
            >
              🔘
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active state ──────────────────────────────────────────────────────────

  const stateClass = due ? 'due' : 'done';

  return (
    <div className={`tool-card ${stateClass}`}>
      <div className="tool-card-main">
        {/* Mark-done button — tap: mark done; long-press: undo */}
        <button
          className={`tool-mark-btn ${stateClass}${pressing ? ' tool-mark-btn-pressing' : ''}`}
          onClick={markDone}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onPointerCancel={handlePressEnd}
          disabled={markingDone}
          title={tool.last_completed ? 'Tap to mark done · Hold 2s to undo' : 'Mark as cleaned'}
        >
          <ToolIcon size={26} />
        </button>

        {/* Info */}
        <div className="tool-info">
          <div className="tool-name-row">
            <span className="tool-name">{meta.label}</span>
            <span className={`tool-freq-badge ${stateClass}`}>
              {FREQUENCY_META[tool.frequency].shortLabel}
            </span>
          </div>
          {undoFlash ? (
            <div className="tool-undo-flash">↩ Undone</div>
          ) : (
            <div
              className={`tool-last-cleaned ${last === 'Never' ? 'never' : stateClass}`}
              title={lastFull}
            >
              {last}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="tool-controls">
          <button
            className="tool-toggle-btn"
            onClick={toggleActive}
            title="Disable tool"
            style={{ fontSize: 22, color: 'var(--blue)' }}
          >
            🔵
          </button>
          <button
            className="tool-expand-btn"
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="tool-expanded">
          {/* Frequency */}
          <div>
            <div className="section-label">Frequency</div>
            <FrequencySelector value={tool.frequency} onChange={updateFrequency} />
          </div>

          {/* Instructions */}
          <div>
            <div className="section-label">Instructions</div>
            <textarea
              className="textarea"
              rows={3}
              placeholder={`How to ${meta.label.toLowerCase()} this room…`}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              onBlur={saveInstructions}
            />
            {savingInstr && <div className="text-hint mt-1">Saving…</div>}
          </div>
        </div>
      )}
    </div>
  );
}
