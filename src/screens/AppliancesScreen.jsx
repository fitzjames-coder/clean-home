import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  APPLIANCE_ICONS,
  APPLIANCE_FREQUENCY_OPTIONS,
  applianceStatus,
  formatLastCleaned,
} from '../lib/constants.js';

export default function AppliancesScreen() {
  const {
    roomCode, appliances, goToAppliance, goToAddAppliance,
    changeCode, deleteAppliance,
  } = useApp();

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId,      setDeletingId]      = useState(null);
  const [logoFailed,      setLogoFailed]      = useState(false);

  async function handleDelete(id) {
    setDeletingId(id);
    const { error } = await supabase
      .from('clean_home_appliances')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[CleanHome] deleteAppliance:', error);
      alert(`Failed to delete appliance: ${error.message}`);
    } else {
      deleteAppliance(id);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  function renderIcon(iconKey) {
    const meta = APPLIANCE_ICONS[iconKey];
    if (!meta) return <span style={{ fontSize: 28 }}>🔌</span>;
    return (
      <img
        src={meta.iconUrl}
        alt={meta.label}
        width={36}
        height={36}
        className="room-icon-img"
      />
    );
  }

  return (
    <div className="screen">
      {/* ── Header (mirrors HomeScreen) ── */}
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

      {/* ── Appliances list ── */}
      <div className="appliances-list">
        {appliances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔌</div>
            <div className="empty-state-title">No appliances yet</div>
            <div className="empty-state-text">Track cleaning schedules for your appliances.</div>
            <button
              className="btn btn-primary mt-4"
              style={{ marginTop: 24 }}
              onClick={goToAddAppliance}
            >
              ＋ Add Appliance
            </button>
          </div>
        ) : (
          appliances.map(appliance => {
            const status     = applianceStatus(appliance);
            const statusClass = (status === 'overdue' || status === 'critical' || status === 'never')
              ? ` room-card-${status === 'critical' ? 'critical' : 'overdue'}`
              : '';
            const freq = APPLIANCE_FREQUENCY_OPTIONS[appliance.frequency];
            const last = formatLastCleaned(appliance.last_completed);

            return (
              <div key={appliance.id} className={`room-card${statusClass}`}>
                {/* Tap → open detail immediately */}
                <button
                  className="room-card-btn"
                  onClick={() => goToAppliance(appliance.id)}
                >
                  <div className="room-icon-wrap">
                    {renderIcon(appliance.icon)}
                  </div>
                  <div className="room-info">
                    <div className="room-name">{appliance.name}</div>
                    <div className="appliance-card-meta">
                      <span
                        className={`tool-freq-badge ${status === 'ok' ? 'done' : 'due'}`}
                        style={{ marginRight: 6 }}
                      >
                        {freq?.shortLabel ?? appliance.frequency}
                      </span>
                      <span
                        className={`tool-last-cleaned ${
                          last === 'Never' ? 'never' :
                          status === 'ok'  ? 'done'  : 'due'
                        }`}
                      >
                        {last}
                      </span>
                    </div>
                  </div>
                  <div className="room-chevron">›</div>
                </button>

                {/* Always-visible delete area */}
                <div className="room-delete-area">
                  {confirmDeleteId === appliance.id ? (
                    <div className="room-confirm-delete">
                      <button
                        className="btn-confirm-delete"
                        disabled={deletingId === appliance.id}
                        onClick={() => handleDelete(appliance.id)}
                      >
                        {deletingId === appliance.id ? '…' : 'Delete'}
                      </button>
                      <button
                        className="btn-cancel-delete"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="room-delete-btn"
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(appliance.id); }}
                      title="Delete appliance"
                    >
                      <img src="/trash-icon.png" alt="Delete" className="trash-icon" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FAB: Add Appliance ── */}
      {appliances.length > 0 && (
        <div className="fab-bar">
          <button className="fab-add-room" onClick={goToAddAppliance}>
            <span>＋</span>
            Add Appliance
          </button>
        </div>
      )}
    </div>
  );
}
