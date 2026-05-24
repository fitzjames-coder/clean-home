import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  APPLIANCE_ICONS,
  APPLIANCE_FREQUENCY_OPTIONS,
  applianceStatus,
  formatLastCleaned,
  formatLastCleanedFull,
} from '../lib/constants.js';
import SupplyDetailModal from '../components/SupplyDetailModal.jsx';

const LONG_PRESS_MS = 2000;
const FREQ_ORDER    = ['W', '2W', 'M', '3M', '6M', 'Y'];

export default function ApplianceDetailScreen({ applianceId }) {
  const {
    appliances,
    supplies: householdSupplies,
    goToAppliances,
    updateAppliance,
    markApplianceDone,
    undoApplianceCompletion,
    addApplianceSupply,
    removeApplianceSupply,
  } = useApp();

  // Find appliance from context (already fetched at load time)
  const appliance = appliances.find(a => a.id === applianceId) ?? null;

  const [instructions,     setInstructions]     = useState(appliance?.instructions ?? '');
  const [savingInstr,      setSavingInstr]      = useState(false);
  const [marking,          setMarking]          = useState(false);
  const [confirmMark,      setConfirmMark]      = useState(false);
  const [prevCompleted,    setPrevCompleted]    = useState(null);
  const [pressing,         setPressing]         = useState(false);
  const [undoFlash,        setUndoFlash]        = useState(false);
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);
  const [detailSupply,     setDetailSupply]     = useState(null);

  const longPressTimer  = useRef(null);
  const undoFlashTimer  = useRef(null);

  // Keep instructions field in sync when appliance changes
  useEffect(() => {
    if (appliance) setInstructions(appliance.instructions ?? '');
  }, [appliance?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!appliance) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)' }}>Appliance not found</p>
        <button className="btn btn-primary" onClick={goToAppliances}>Go Back</button>
      </div>
    );
  }

  const meta         = APPLIANCE_ICONS[appliance.icon];
  const status       = applianceStatus(appliance);
  const last         = formatLastCleaned(appliance.last_completed);
  const lastFull     = formatLastCleanedFull(appliance.last_completed);
  const linkedSupplies = appliance.linked_supplies ?? [];

  // ── Mark done ─────────────────────────────────────────────────────────────

  async function handleMarkDone() {
    setMarking(true);
    setPrevCompleted(appliance.last_completed ?? null);
    await markApplianceDone(applianceId);
    setMarking(false);
    setConfirmMark(false);
  }

  // ── Long-press undo ───────────────────────────────────────────────────────

  function handlePressStart(e) {
    if (!appliance.last_completed) return;
    e.preventDefault();
    setPressing(true);
    longPressTimer.current = setTimeout(async () => {
      setPressing(false);
      await undoApplianceCompletion(applianceId, prevCompleted);
      setPrevCompleted(null);
      setUndoFlash(true);
      clearTimeout(undoFlashTimer.current);
      undoFlashTimer.current = setTimeout(() => setUndoFlash(false), 2000);
    }, LONG_PRESS_MS);
  }

  function handlePressEnd() {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    setPressing(false);
  }

  // ── Instructions ──────────────────────────────────────────────────────────

  async function saveInstructions() {
    if (instructions === (appliance.instructions ?? '')) return;
    setSavingInstr(true);
    const { error } = await supabase
      .from('clean_home_appliances')
      .update({ instructions })
      .eq('id', applianceId);
    if (error) console.error('[CleanHome] saveInstructions:', error);
    else updateAppliance(applianceId, { instructions });
    setSavingInstr(false);
  }

  // ── Frequency ─────────────────────────────────────────────────────────────

  async function handleFrequency(f) {
    const { error } = await supabase
      .from('clean_home_appliances')
      .update({ frequency: f })
      .eq('id', applianceId);
    if (!error) updateAppliance(applianceId, { frequency: f });
  }

  // ── Supply picker ─────────────────────────────────────────────────────────

  async function toggleSupply(supplyTagId, isLinked) {
    if (isLinked) {
      const link = linkedSupplies.find(ls => ls.supply_tag_id === supplyTagId);
      if (link) await removeApplianceSupply(applianceId, link.id);
    } else {
      await addApplianceSupply(applianceId, supplyTagId);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const lastClass =
    last === 'Never'        ? 'never' :
    status === 'ok'         ? 'done'  : 'due';

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div className="room-header">
        <button className="back-btn back-btn-pill" onClick={goToAppliances}>
          <span className="back-btn-icon">←</span>
          Appliances
        </button>

        <div className="room-detail-hero">
          {/* Tap to mark done · long-press to undo */}
          <button
            className={`room-hero-icon-btn${pressing ? ' tool-mark-btn-pressing' : ''}`}
            onClick={() => setConfirmMark(true)}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onPointerCancel={handlePressEnd}
            title={
              appliance.last_completed
                ? 'Tap to mark cleaned · Hold 2s to undo'
                : 'Mark as cleaned'
            }
          >
            <div className="room-hero-icon">
              {meta
                ? <img
                    src={meta.iconUrl}
                    alt={meta.label}
                    width={40}
                    height={40}
                    className="room-icon-img"
                  />
                : <span style={{ fontSize: 40 }}>🔌</span>
              }
            </div>
          </button>
          <div>
            <div className="room-detail-name">{appliance.name}</div>
            <div className="room-detail-type">{meta?.label ?? 'Appliance'}</div>
          </div>
        </div>

        {/* Mark-done confirmation panel */}
        {confirmMark && (
          <div className="room-mark-all-confirm">
            <p className="room-mark-all-text">Mark {appliance.name} as cleaned?</p>
            <div className="room-mark-all-actions">
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setConfirmMark(false)}
                disabled={marking}
              >
                Cancel
              </button>
              <button
                className="btn btn-teal"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={handleMarkDone}
                disabled={marking}
              >
                {marking ? 'Saving…' : '✓ Mark Done'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="room-content">

        {/* Last cleaned */}
        <section>
          <div className="section-label">Last Cleaned</div>
          <div className="card" style={{ padding: '14px 16px' }}>
            {undoFlash ? (
              <div className="tool-undo-flash">↩ Undone</div>
            ) : (
              <div className={`tool-last-cleaned ${lastClass}`} title={lastFull}>
                {last}
              </div>
            )}
          </div>
        </section>

        {/* Frequency */}
        <section>
          <div className="section-label">Cleaning Frequency</div>
          <div className="appliance-freq-selector">
            {FREQ_ORDER.map(f => (
              <button
                key={f}
                type="button"
                className={`freq-btn${appliance.frequency === f ? ' active' : ''}`}
                onClick={() => handleFrequency(f)}
                title={APPLIANCE_FREQUENCY_OPTIONS[f]?.label}
              >
                {APPLIANCE_FREQUENCY_OPTIONS[f]?.shortLabel ?? f}
              </button>
            ))}
          </div>
        </section>

        {/* Supply Tags */}
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

        {/* Instructions */}
        <section>
          <div className="remarks-header">
            <div className="section-label" style={{ marginBottom: 0 }}>Instructions</div>
            {savingInstr && (
              <div className="text-hint">Saving…</div>
            )}
          </div>
          <div className="card mt-2" style={{ padding: '14px' }}>
            <textarea
              className="textarea-inline"
              rows={4}
              placeholder={`How to clean the ${appliance.name}…`}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              onBlur={saveInstructions}
            />
          </div>
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
              <p className="text-hint">No supplies yet — go to Supplies to add some.</p>
            ) : (
              <div className="supply-picker-list">
                {householdSupplies.map(supply => {
                  const linked = linkedSupplies.some(ls => ls.supply_tag_id === supply.id);
                  return (
                    <button
                      key={supply.id}
                      className={`supply-picker-row${linked ? ' linked' : ''}`}
                      onClick={() => toggleSupply(supply.id, linked)}
                    >
                      <div className="supply-picker-check">{linked ? '✓' : ''}</div>
                      {supply.photo_url && (
                        <img src={supply.photo_url} alt="" className="supply-picker-photo" />
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

      {/* ── Supply detail modal ── */}
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
