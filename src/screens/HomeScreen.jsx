import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ROOM_ICONS } from '../lib/constants.js';
import { supabase } from '../lib/supabase.js';
import AddRoomModal from '../components/AddRoomModal.jsx';

export default function HomeScreen() {
  const {
    household, rooms, goToRoom, goToSupplies, switchHousehold, setRooms,
  } = useApp();

  const [showAddRoom,    setShowAddRoom]    = useState(false);
  const [showCode,       setShowCode]       = useState(false);
  const [confirmDeleteId,setConfirmDeleteId] = useState(null);
  const [deletingId,     setDeletingId]     = useState(null);
  const [logoFailed,     setLogoFailed]     = useState(false);

  async function deleteRoom(id) {
    setDeletingId(id);
    const { error } = await supabase.from('clean_home_rooms').delete().eq('id', id);
    if (error) console.error('[CleanHome] deleteRoom:', error);
    setRooms(prev => prev.filter(r => r.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  function getRoomEmoji(iconValue) {
    return ROOM_ICONS.find(i => i.value === iconValue)?.emoji ?? '🏠';
  }

  function copyCode() {
    navigator.clipboard?.writeText(household.code);
    setShowCode(false);
  }

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div className="home-header">
        <div className="home-header-row">
          <div>
            <div className="home-logo-row">
              {logoFailed ? (
                <div className="home-logo-fallback">🏠</div>
              ) : (
                <img
                  src="/icon.svg"
                  alt="Clean Home"
                  className="home-logo"
                  onError={() => setLogoFailed(true)}
                />
              )}
              <h1 className="home-title">Clean Home</h1>
            </div>

            {household && (
              <button
                className="home-household-btn"
                onClick={() => setShowCode(v => !v)}
              >
                <span>🔗</span>
                {household.name}
              </button>
            )}
          </div>

          {household && (
            <button className="settings-btn" onClick={switchHousehold} title="Switch household">
              ⚙️
            </button>
          )}
        </div>

        {showCode && household && (
          <div className="share-code-panel">
            <div>
              <div className="share-code-label">Share code</div>
              <div className="share-code-value">{household.code}</div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={copyCode}>
              Copy
            </button>
          </div>
        )}
      </div>

      {/* ── Rooms list ── */}
      <div className="rooms-list">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-title">No rooms yet</div>
            <div className="empty-state-text">Add your first room to start tracking cleaning tasks.</div>
          </div>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="room-card">
              <button className="room-card-btn" onClick={() => goToRoom(room.id)}>
                <div className="room-icon-wrap">{getRoomEmoji(room.icon)}</div>
                <div className="room-info">
                  <div className="room-name">{room.name}</div>
                  {room.remarks
                    ? <div className="room-remarks">{room.remarks}</div>
                    : <div className="room-remarks-placeholder">No remarks</div>
                  }
                </div>
                <div className="room-chevron">›</div>
              </button>

              <div className="room-delete-area">
                {confirmDeleteId === room.id ? (
                  <div className="room-confirm-delete">
                    <button
                      className="btn-confirm-delete"
                      disabled={deletingId === room.id}
                      onClick={() => deleteRoom(room.id)}
                    >
                      {deletingId === room.id ? '…' : 'Delete'}
                    </button>
                    <button className="btn-cancel-delete" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="room-delete-btn"
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(room.id); }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FAB bar ── */}
      {household && (
        <div className="fab-bar">
          <div className="fab-bar-inner">
            <button className="fab-supplies" onClick={goToSupplies}>
              <span className="fab-supplies-icon">🏷️</span>
              Supplies
            </button>
            <button className="fab-add-room" onClick={() => setShowAddRoom(true)}>
              <span>＋</span>
              Add Room
            </button>
          </div>
        </div>
      )}

      {/* ── Add room modal ── */}
      {showAddRoom && household && (
        <AddRoomModal
          householdId={household.id}
          onClose={() => setShowAddRoom(false)}
          onSuccess={room => {
            setRooms(prev => [...prev, room]);
            setShowAddRoom(false);
          }}
        />
      )}
    </div>
  );
}
