import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { TOOL_ORDER, TOOL_META } from '../lib/constants.js';
import RoomIconPicker from './RoomIconPicker.jsx';

export default function AddRoomModal({ householdId, onClose, onSuccess }) {
  const [name,    setName]    = useState('');
  const [icon,    setIcon]    = useState('living-room');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('Please enter a room name'); return; }

    // Guard: household ID must be present before attempting any insert
    if (!householdId) {
      const msg = 'No household ID – cannot create room. Try reloading the app.';
      console.error('[CleanHome] AddRoomModal: householdId is missing!', { householdId });
      setError(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ── Step 1: Insert room ─────────────────────────────────────────────
      const roomPayload = { household_id: householdId, name: name.trim(), icon };
      console.log('[CleanHome] AddRoomModal: inserting room…', roomPayload);

      const { data: room, error: roomErr } = await supabase
        .from('clean_home_rooms')
        .insert(roomPayload)
        .select()
        .single();

      if (roomErr) {
        console.error('[CleanHome] AddRoomModal: room insert error →', roomErr);
        throw roomErr;
      }
      if (!room) {
        // This happens when RLS blocks the insert but returns no explicit error
        const msg = 'Room insert returned no data. Check Supabase Row Level Security policies — inserts may be blocked.';
        console.error('[CleanHome] AddRoomModal:', msg);
        throw new Error(msg);
      }

      console.log('[CleanHome] AddRoomModal: room created ✓', room);

      // ── Step 2: Insert 5 default tools ─────────────────────────────────
      const toolRows = TOOL_ORDER.map(tool_type => ({
        room_id:      room.id,
        tool_type,
        tool_name:    TOOL_META[tool_type].label,   // "Duster" | "Broom" | "Mop" | "Vacuum" | "Bot"
        is_active:    true,
        frequency:    'W',
        instructions: '',
      }));

      console.log('[CleanHome] AddRoomModal: inserting tools…', toolRows);

      const { data: toolData, error: toolErr } = await supabase
        .from('clean_home_tools')
        .insert(toolRows)
        .select();

      if (toolErr) {
        // Tool insert failure is non-fatal for the room, but must be loud
        console.error('[CleanHome] AddRoomModal: tool insert error →', toolErr);
        throw toolErr;
      }
      if (!toolData || toolData.length === 0) {
        console.warn('[CleanHome] AddRoomModal: tool insert returned no rows — check RLS on clean_home_tools');
      } else {
        console.log(`[CleanHome] AddRoomModal: ${toolData.length} tools created ✓`, toolData.map(t => t.tool_name));
      }

      // ── Step 3: Notify parent ───────────────────────────────────────────
      onSuccess(room);

    } catch (e) {
      console.error('[CleanHome] AddRoomModal: handleSubmit failed →', e);
      setError(e?.message || 'Failed to create room. Open the browser console for details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title">Add Room</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="field">
          <label className="field-label">Room Name</label>
          <input
            className="input"
            placeholder="e.g. Master Bedroom"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field-label">Room Type</label>
          <RoomIconPicker value={icon} onChange={setIcon} />
        </div>

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-full mt-4"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Creating…' : 'Add Room'}
        </button>
      </div>
    </div>
  );
}
