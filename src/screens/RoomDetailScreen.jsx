import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import { ROOM_ICONS, TOOL_ORDER } from '../lib/constants.js';
import ToolCard from '../components/ToolCard.jsx';
import SupplyDetailModal from '../components/SupplyDetailModal.jsx';

export default function RoomDetailScreen({ roomId }) {
  const { goHome, supplies: householdSupplies } = useApp();

  const [room,            setRoom]            = useState(null);
  const [tools,           setTools]           = useState([]);
  const [linkedSupplies,  setLinkedSupplies]  = useState([]);
  const [remarks,         setRemarks]         = useState('');
  const [savingRemarks,   setSavingRemarks]   = useState(false);
  const [loading,         setLoading]         = useState(true);

  // ── Supply-picker + detail modal state ────────────────────────────────────
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);
  const [detailSupply,     setDetailSupply]     = useState(null); // supply object | null

  // ── Mark-all-done state ───────────────────────────────────────────────────
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [markingAll,     setMarkingAll]     = useState(false);

  // ── Load data on mount ────────────────────────────────────────────────────
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

  async function handleBack() {
    if (remarksAreDirty) await saveRemarks();
    goHome();
  }

  // ── Tool updates ───────────────────────────────────────────────────────────

  function updateTool(toolId, partial) {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, ...partial } : t));
  }

  // ── Mark all active tools done (except bot) ────────────────────────────────

  async function markAllDone() {
    setMarkingAll(true);
    const now = new Date().toISOString();
    const toMark = tools.filter(t => t.is_active && t.tool_type !== 'bot');
    await Promise.all(
      toMark.map(t =>
        supabase.from('clean_home_tools').update({ last_completed: now }).eq('id', t.id)
      )
    );
    setTools(prev =>
      prev.map(t => (t.is_active && t.tool_type !== 'bot') ? { ...t, last_completed: now } : t)
    );
    setConfirmMarkAll(false);
    setMarkingAll(false);
  }

  // ── Supply picker ──────────────────────────────────────────────────────────

  async function toggleLinkedSupply(supplyTagId, isLinked) {
    if (isLinked) {
      const row = linkedSupplies.find(ls => ls.supply_tag_id === supplyTagId);
      if (row) {
        await supabase.from('clean_home_room_supplies').delete().eq('id', row.id);
        setLinkedSupplies(prev => prev.filter(ls => ls.id !== row.id));
      }
    } else {
      const { data, error } = await supabase
        .from('clean_home_room_supplies')
        .insert({ room_id: roomId, supply_tag_id: supplyTagId })
        .select('*, supply_tag:clean_home_supply_tags(*)')
        .single();
      if (!error && data) setLinkedSupplies(prev => [...prev, data]);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const roomMeta     = room ? ROOM_ICONS.find(i => i.value === room.icon) : null;
  const RoomHeroIcon = roomMeta?.Icon ?? null;

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
          {/* Tappable icon → mark all done */}
          <button
            className="room-hero-icon-btn"
            onClick={() => setConfirmMarkAll(true)}
            title="Mark all tools as done"
          >
            <div className="room-hero-icon">
              {RoomHeroIcon
                ? <RoomHeroIcon size={36} color="var(--blue)" />
                : (roomMeta?.emoji ?? '🏠')
              }
            </div>
          </button>
          <div>
            <div className="room-detail-name">{room.name}</div>
            <div className="room-detail-type">{roomMeta?.label ?? 'Room'}</div>
          </div>
        </div>

        {/* Mark-all confirmation panel */}
        {confirmMarkAll && (
          <div className="room-mark-all-confirm">
            <p className="room-mark-all-text">
              Mark all active tools as cleaned?{' '}
              <span style={{ color: 'var(--text-muted)' }}>Cleaning Bot will be skipped.</span>
            </p>
            <div className="room-mark-all-actions">
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setConfirmMarkAll(false)}
                disabled={markingAll}
              >
                Cancel
              </button>
              <button
                className="btn btn-teal"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={markAllDone}
                disabled={markingAll}
              >
                {markingAll ? 'Saving…' : '✓ Mark All Done'}
              </button>
            </div>
          </div>
        )}
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
                onUpdate={partial => updateTool(tool.id, partial)}
              />
            ))}
          </div>
        </section>

        {/* Room-level Supply Tags */}
        <section>
          <div className="room-supplies-header">
            <div className="section-label" style={{ marginBottom: 0 }}>Supply Tags</div>
            <button
              className="room-supplies-add-btn"
              onClick={() => setShowSupplyPicker(true)}
              title="Add / remove supplies"
            >
              ＋
            </button>
          </div>

          {linkedSupplies.length === 0 ? (
            <div className="room-supplies-empty">
              No supplies linked — tap ＋ to add some.
            </div>
          ) : (
            <div className="room-supply-chips">
              {linkedSupplies.map(ls => (
                <button
                  key={ls.id}
                  className="room-supply-chip"
                  onClick={() => setDetailSupply(ls.supply_tag)}
                >
                  {ls.supply_tag.photo_url && (
                    <img
                      src={ls.supply_tag.photo_url}
                      alt=""
                      className="room-supply-chip-photo"
                    />
                  )}
                  <span>{ls.supply_tag.name_en}</span>
                  {ls.supply_tag.name_de && (
                    <span className="linked-chip-de">/ {ls.supply_tag.name_de}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

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

      {/* ── Supply picker modal ── */}
      {showSupplyPicker && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowSupplyPicker(false)}
        >
          <div className="modal-sheet">
            <div className="modal-header">
              <h2 className="modal-title">Supply Tags</h2>
              <button className="modal-close" onClick={() => setShowSupplyPicker(false)}>✕</button>
            </div>

            {householdSupplies.length === 0 ? (
              <p className="text-hint">
                No supplies yet — go to Supplies to add some.
              </p>
            ) : (
              <div className="supply-picker-list">
                {householdSupplies.map(supply => {
                  const linked = linkedSupplies.some(ls => ls.supply_tag_id === supply.id);
                  return (
                    <button
                      key={supply.id}
                      className={`supply-picker-row${linked ? ' linked' : ''}`}
                      onClick={() => toggleLinkedSupply(supply.id, linked)}
                    >
                      <div className="supply-picker-check">{linked ? '✓' : ''}</div>
                      {supply.photo_url && (
                        <img
                          src={supply.photo_url}
                          alt=""
                          className="supply-picker-photo"
                        />
                      )}
                      <div className="supply-picker-names">
                        <div className="supply-picker-name-en">{supply.name_en}</div>
                        {supply.name_de && (
                          <div className="supply-picker-name-de">{supply.name_de}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Supply detail modal (tap on a chip) ── */}
      {detailSupply && (
        <SupplyDetailModal
          supply={detailSupply}
          onClose={() => setDetailSupply(null)}
          onEdit={() => setDetailSupply(null)}
        />
      )}
    </div>
  );
}
