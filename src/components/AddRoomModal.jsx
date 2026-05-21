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
    setLoading(true);
    setError('');
    try {
      // Create room
      const { data: room, error: roomErr } = await supabase
        .from('clean_home_rooms')
        .insert({ household_id: householdId, name: name.trim(), icon })
        .select()
        .single();
      if (roomErr) throw roomErr;

      // Create 5 default tools
      const toolRows = TOOL_ORDER.map(tool_type => ({
        room_id: room.id,
        tool_type,
        tool_name: TOOL_META[tool_type].label,
        is_active: true,
        frequency: 'W',
        instructions: '',
      }));
      const { error: toolErr } = await supabase.from('clean_home_tools').insert(toolRows);
      if (toolErr) throw toolErr;

      onSuccess(room);
    } catch (e) {
      console.error('[CleanHome] addRoom:', e);
      setError(e?.message || 'Failed to create room');
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
