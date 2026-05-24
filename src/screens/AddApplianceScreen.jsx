import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import { APPLIANCE_ICONS, APPLIANCE_FREQUENCY_OPTIONS } from '../lib/constants.js';

const FREQ_ORDER     = ['W', '2W', 'M', '3M', '6M', 'Y'];
const ICON_ORDER     = ['stove', 'dryer', 'washer', 'dishwasher', 'refrigerator'];
const DEFAULT_FREQ   = 'M';
const DEFAULT_ICON   = 'stove';

export default function AddApplianceScreen() {
  const { roomCode, goToAppliances, addAppliance } = useApp();

  const [name,         setName]         = useState('');
  const [icon,         setIcon]         = useState(DEFAULT_ICON);
  const [frequency,    setFrequency]    = useState(DEFAULT_FREQ);
  const [instructions, setInstructions] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  async function handleSubmit() {
    if (!name.trim()) { setError('Please enter an appliance name'); return; }
    if (!roomCode) { setError('No room code — try reloading the app'); return; }

    setLoading(true);
    setError('');

    try {
      const payload = {
        room_code:    roomCode,
        name:         name.trim(),
        icon,
        frequency,
        instructions: instructions.trim() || null,
      };

      const { data, error: insertErr } = await supabase
        .from('clean_home_appliances')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      if (!data) throw new Error('Insert returned no data — check Supabase RLS policies.');

      addAppliance(data);
      goToAppliances();
    } catch (e) {
      console.error('[CleanHome] addAppliance:', e);
      setError(e?.message || 'Failed to add appliance. Check the browser console.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div className="room-header">
        <button className="back-btn back-btn-pill" onClick={goToAppliances}>
          <span className="back-btn-icon">←</span>
          Appliances
        </button>
        <h1 className="supplies-title">Add Appliance</h1>
      </div>

      {/* ── Form ── */}
      <div className="room-content">

        {/* Name */}
        <section>
          <div className="field">
            <label className="field-label">Appliance Name</label>
            <input
              className="input"
              placeholder="e.g. Kitchen Stove, Laundry Washer"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
        </section>

        {/* Icon picker */}
        <section>
          <div className="section-label">Appliance Type</div>
          <div className="appliance-icon-picker">
            {ICON_ORDER.map(key => {
              const meta = APPLIANCE_ICONS[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`appliance-icon-btn${icon === key ? ' selected' : ''}`}
                  onClick={() => setIcon(key)}
                >
                  <img
                    src={meta.iconUrl}
                    alt={meta.label}
                    width={40}
                    height={40}
                    className="room-icon-img"
                  />
                  <span>{meta.label}</span>
                </button>
              );
            })}
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
                className={`freq-btn${frequency === f ? ' active' : ''}`}
                onClick={() => setFrequency(f)}
                title={APPLIANCE_FREQUENCY_OPTIONS[f]?.label}
              >
                {APPLIANCE_FREQUENCY_OPTIONS[f]?.shortLabel ?? f}
              </button>
            ))}
          </div>
          <div className="text-hint mt-1">
            {APPLIANCE_FREQUENCY_OPTIONS[frequency]?.label}
          </div>
        </section>

        {/* Instructions */}
        <section>
          <div className="field">
            <label className="field-label">Instructions <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea
              className="textarea"
              rows={3}
              placeholder={`How to clean the ${name || 'appliance'}…`}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>
        </section>

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-full"
          disabled={loading || !name.trim()}
          onClick={handleSubmit}
        >
          {loading ? 'Adding…' : '＋ Add Appliance'}
        </button>

      </div>
    </div>
  );
}
