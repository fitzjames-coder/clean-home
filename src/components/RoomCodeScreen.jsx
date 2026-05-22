import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// RoomCodeScreen
//
// First-launch screen: user types their household code (e.g. "FITZ1").
// No DB lookup — the code is stored directly on every row, so any code
// is valid. Everyone in the household uses the same code.
// ─────────────────────────────────────────────────────────────────────────────

export default function RoomCodeScreen({ onSuccess }) {
  const [code,  setCode]  = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a code');
      return;
    }
    if (trimmed.length < 3) {
      setError('Code must be at least 3 characters');
      return;
    }
    onSuccess(trimmed);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div className="modal-sheet" style={{ width: '100%', maxWidth: 420 }}>
        <div className="modal-header" style={{ justifyContent: 'center' }}>
          <h2 className="modal-title">Welcome to Clean Home</h2>
        </div>

        <p className="text-hint" style={{ marginBottom: 24, textAlign: 'center' }}>
          Enter your household code to get started.<br />
          Everyone in your home uses the same code.
        </p>

        <div className="field">
          <label className="field-label">Household Code</label>
          <input
            className="input"
            style={{
              textAlign:     'center',
              letterSpacing: '0.2em',
              fontSize:      '22px',
              fontWeight:    700,
              textTransform: 'uppercase',
            }}
            placeholder="e.g. FITZ1"
            value={code}
            maxLength={20}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-full mt-6"
          onClick={handleSubmit}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
