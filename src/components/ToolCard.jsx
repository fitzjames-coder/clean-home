import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { TOOL_META, FREQUENCY_META, isDue, formatLastCleaned, formatLastCleanedFull } from '../lib/constants.js';
import FrequencySelector from './FrequencySelector.jsx';

export default function ToolCard({
  tool,
  availableSupplies,
  linkedSupplies,
  roomId,
  onUpdate,
}) {
  const [expanded,       setExpanded]       = useState(false);
  const [instructions,   setInstructions]   = useState(tool.instructions ?? '');
  const [savingInstr,    setSavingInstr]    = useState(false);
  const [markingDone,    setMarkingDone]    = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const meta  = TOOL_META[tool.tool_type];
  const due   = isDue(tool.last_completed, tool.frequency);
  const last  = formatLastCleaned(tool.last_completed);
  const lastFull = formatLastCleanedFull(tool.last_completed);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function markDone() {
    if (markingDone) return;
    setMarkingDone(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('clean_home_tools')
      .update({ last_completed: now })
      .eq('id', tool.id);
    if (!error) onUpdate({ last_completed: now });
    setMarkingDone(false);
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

  async function toggleSupply(supplyTagId, isLinked) {
    if (isLinked) {
      const row = linkedSupplies.find(s => s.supply_tag_id === supplyTagId);
      if (row) await supabase.from('clean_home_room_supplies').delete().eq('id', row.id);
    } else {
      await supabase.from('clean_home_room_supplies').insert({ room_id: roomId, supply_tag_id: supplyTagId });
    }
    onUpdate({}); // signal parent to refresh linked supplies
  }

  // ── Inactive state ────────────────────────────────────────────────────────

  if (!tool.is_active) {
    return (
      <div className="tool-card inactive">
        <div className="tool-card-main">
          <span style={{ fontSize: 28, filter: 'grayscale(1)' }}>{meta.emoji}</span>
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
        {/* Mark-done button */}
        <button
          className={`tool-mark-btn ${stateClass}`}
          onClick={markDone}
          disabled={markingDone}
          title="Mark as cleaned"
        >
          {meta.emoji}
        </button>

        {/* Info */}
        <div className="tool-info">
          <div className="tool-name-row">
            <span className="tool-name">{meta.label}</span>
            <span className={`tool-freq-badge ${stateClass}`}>
              {FREQUENCY_META[tool.frequency].shortLabel}
            </span>
          </div>
          <div className={`tool-last-cleaned ${stateClass}`} title={lastFull}>
            {last}
          </div>
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

          {/* Supply tags */}
          {availableSupplies.length > 0 && (
            <div>
              <div className="section-label">🏷️ Supplies</div>
              <div className="supply-chips">
                {availableSupplies.map(supply => {
                  const isLinked = linkedSupplies.some(ls => ls.supply_tag_id === supply.id);
                  return (
                    <button
                      key={supply.id}
                      className={`supply-chip${isLinked ? ' linked' : ''}`}
                      onClick={() => toggleSupply(supply.id, isLinked)}
                    >
                      {supply.photo_url && (
                        <img src={supply.photo_url} alt="" className="supply-chip-photo" />
                      )}
                      {supply.name_en}
                      {supply.name_de && (
                        <span style={{ opacity: 0.65 }}>/ {supply.name_de}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
