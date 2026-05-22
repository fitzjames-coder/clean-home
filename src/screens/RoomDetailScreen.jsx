import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  ROOM_ICONS, TOOL_ORDER,
} from '../lib/constants.js';
import ToolCard from '../components/ToolCard.jsx';

export default function RoomDetailScreen({ roomId }) {
  const { goHome, supplies: householdSupplies } = useApp();

  const [room,          setRoom]          = useState(null);
  const [tools,         setTools]         = useState([]);
  const [linkedSupplies,setLinkedSupplies] = useState([]);
  const [remarks,       setRemarks]       = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [loading,       setLoading]       = useState(true);

  // ── Load room data on mount (and whenever roomId changes) ──────────────────
  // Since screens are conditionally rendered, this component mounts fresh
  // every time we navigate to it — no stale state possible.
  const loadLinkedSupplies = useCallback(async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from('clean_home_room_supplies')
      .select('*, supply_tag:clean_home_supply_tags(*)')
      .eq('room_id', roomId);
    if (error) console.error('[CleanHome] loadLinkedSupplies:', error);
    setLinkedSupplies(data ?? []);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    async function loadData() {
      const [roomRes, toolsRes] = await Promise.all([
        supabase.from('clean_home_rooms').select().eq('id', roomId).single(),
        supabase.from('clean_home_tools').select().eq('room_id', roomId).order('created_at'),
      ]);

      if (!active) return;

      if (roomRes.data) {
        setRoom(roomRes.data);
        setRemarks(roomRes.data.remarks ?? '');
      }

      if (toolsRes.data) {
        const sorted = [...toolsRes.data].sort(
          (a, b) => TOOL_ORDER.indexOf(a.tool_type) - TOOL_ORDER.indexOf(b.tool_type)
        );
        setTools(sorted);
      }

      await loadLinkedSupplies();
      if (active) setLoading(false);
    }

    loadData();
    return () => { active = false; };
  }, [roomId, loadLinkedSupplies]);

  // ── Remarks ────────────────────────────────────────────────────────────────

  const remarksAreDirty = room !== null && remarks !== (room.remarks ?? '');

  async function saveRemarks() {
    if (!room || !remarksAreDirty) return;
    setSavingRemarks(true);
    const { error } = await supabase
      .from('clean_home_rooms')
      .update({ remarks })
      .eq('id', roomId);
    if (error) console.error('[CleanHome] saveRemarks:', error);
    setRoom(prev => prev ? { ...prev, remarks } : prev);
    setSavingRemarks(false);
  }

  // ── Back navigation ────────────────────────────────────────────────────────
  // goHome() re-fetches rooms before showing HomeScreen, so the list is always
  // fresh. No router tricks, cache-busting, or event listeners needed.
  async function handleBack() {
    if (remarksAreDirty) await saveRemarks();
    goHome();
  }

  // ── Tool updates ───────────────────────────────────────────────────────────

  function updateTool(toolId, partial) {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, ...partial } : t));
    if ('supply_tag_id' in partial || Object.keys(partial).length === 0) {
      loadLinkedSupplies();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const roomMeta = room ? ROOM_ICONS.find(i => i.value === room.icon) : null;

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)' }}>Room not found</p>
        <button className="btn btn-primary" onClick={handleBack}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div className="room-header">
        <button className="back-btn" onClick={handleBack}>
          <span className="back-btn-icon">←</span>
          All Rooms
        </button>

        <div className="room-detail-hero">
          <div className="room-hero-icon">{roomMeta?.emoji ?? '🏠'}</div>
          <div>
            <div className="room-detail-name">{room.name}</div>
            <div className="room-detail-type">{roomMeta?.label ?? 'Room'}</div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="room-content">

        {/* Cleaning tools */}
        <section>
          <div className="section-label">Cleaning Tools</div>
          <div className="tools-list">
            {tools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                availableSupplies={householdSupplies}
                linkedSupplies={linkedSupplies.filter(ls => ls.room_id === roomId)}
                roomId={roomId}
                onUpdate={partial => updateTool(tool.id, partial)}
              />
            ))}
          </div>
        </section>

        {/* Linked supplies summary */}
        {linkedSupplies.length > 0 && (
          <section>
            <div className="section-label">🏷️ Room Supplies</div>
            <div className="card" style={{ padding: '14px' }}>
              <div className="linked-supply-chips">
                {linkedSupplies.map(ls => (
                  <div key={ls.id} className="linked-chip">
                    {ls.supply_tag.photo_url && (
                      <img
                        src={ls.supply_tag.photo_url}
                        alt=""
                        className="supply-chip-photo"
                      />
                    )}
                    {ls.supply_tag.name_en}
                    {ls.supply_tag.name_de && (
                      <span className="linked-chip-de">/ {ls.supply_tag.name_de}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Remarks */}
        <section>
          <div className="remarks-header">
            <div className="section-label" style={{ marginBottom: 0 }}>Remarks</div>
            {remarksAreDirty && (
              <button
                className="save-btn"
                onClick={saveRemarks}
                disabled={savingRemarks}
              >
                💾 {savingRemarks ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
          <div className="card mt-2" style={{ padding: '14px' }}>
            <textarea
              className="textarea-inline"
              rows={4}
              placeholder="Add notes about this room…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              onBlur={saveRemarks}
            />
          </div>
          {savingRemarks && (
            <div className="text-hint mt-1">Saving…</div>
          )}
        </section>
      </div>
    </div>
  );
}
