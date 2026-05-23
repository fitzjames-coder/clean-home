import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ROOM_ICONS, TOOL_META, roomStatus, overdueToolsForRoom, formatLastCleaned } from '../lib/constants.js';
import { supabase } from '../lib/supabase.js';
import AddRoomModal from '../components/AddRoomModal.jsx';

export default function HomeScreen() {
  const {
    roomCode, rooms, goToRoom, goToSupplies, changeCode, setRooms,
  } = useApp();

  const [showAddRoom,     setShowAddRoom]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId,      setDeletingId]      = useState(null);
  const [logoFailed,      setLogoFailed]      = useState(false);

  async function deleteRoom(id) {
    setDeletingId(id);
    const { error } = await supabase.from('clean_home_rooms').delete().eq('id', id);
    if (error) console.error('[CleanHome] deleteRoom:', error);
    setRooms(prev => prev.filter(r => r.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  /** Render either a custom img or the native emoji for a room's icon slot. */
  function renderRoomIcon(iconValue) {
    const meta = ROOM_ICONS.find(i => i.value === iconValue);
    if (!meta) return '🏠';
    if (meta.iconUrl) {
      return (
        <img
          src={meta.iconUrl}
          alt={meta.label}
          width={32}
          height={32}
          className="room-icon-img"
        />
      );
    }
    return meta.emoji;
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

            {roomCode && (
              <div className="home-household-btn">
                <span>🔑</span>
                {roomCode}
              </div>
            )}
          </div>

          <button className="settings-btn" onClick={changeCode} title="Change code">
            ⚙️
          </button>
        </div>
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
          rooms.map(room => {
            const status = roomStatus(room.tools ?? []);
            const statusClass = status === 'ok' ? '' : ` room-card-${status}`;
            return (
            <div key={room.id} className={`room-card${statusClass}`}>
              <button className="room-card-btn" onClick={() => goToRoom(room.id)}>
                <div className="room-icon-wrap">{renderRoomIcon(room.icon)}</div>
                <div className="room-info">
                  <div className="room-name">{room.name}</div>
                  {room.remarks ? (
                    <div className="room-remarks">{room.remarks}</div>
                  ) : (() => {
                    const overdue = overdueToolsForRoom(room.tools ?? []);
                    return overdue.length > 0
                      ? <div className="room-overdue-tools">
                          {overdue.map(t => (
                            <div key={t.tool_type} className="room-overdue-line">
                              {TOOL_META[t.tool_type].label}: {t.frequency} | {formatLastCleaned(t.last_completed)}
                            </div>
                          ))}
                        </div>
                      : null;
                  })()}
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
            );
          })
        )}
      </div>

      {/* ── FAB bar ── */}
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

      {/* ── Add room modal ── */}
      {showAddRoom && (
        <AddRoomModal
          roomCode={roomCode}
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
