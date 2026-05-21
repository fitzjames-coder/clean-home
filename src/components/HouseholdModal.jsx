import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { generateHouseholdCode, HOUSEHOLD_CODE_KEY } from '../lib/constants.js';

function friendlyError(msg) {
  const s = msg.toLowerCase();
  if (s.includes('failed to fetch') || s.includes('networkerror'))
    return 'Could not reach the server. Check your internet connection.';
  if (s.includes('missing supabase'))
    return 'Supabase configuration missing. Check environment variables.';
  if (s.includes('jwt') || s.includes('apikey'))
    return 'Authentication error. Check the Supabase anon key.';
  if (s.includes('does not exist') || s.includes('relation'))
    return 'Database table not found. Apply the schema SQL in Supabase.';
  return msg;
}

export default function HouseholdModal({ onSuccess }) {
  const [tab,           setTab]           = useState('create');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode,      setJoinCode]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  async function handleCreate() {
    if (!householdName.trim()) { setError('Please enter a household name'); return; }
    setLoading(true);
    setError('');
    try {
      const code = generateHouseholdCode();
      const { data, error: dbErr } = await supabase
        .from('clean_home_households')
        .insert({ name: householdName.trim(), code })
        .select()
        .single();
      if (dbErr) throw dbErr;
      if (!data) throw new Error('No data returned from insert.');
      localStorage.setItem(HOUSEHOLD_CODE_KEY, data.id);
      onSuccess(data);
    } catch (e) {
      setError(friendlyError(e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('Please enter a join code'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('clean_home_households')
        .select()
        .eq('code', code)
        .single();
      if (dbErr) {
        if (dbErr.code === 'PGRST116') {
          setError('Household not found. Double-check the code.');
          return;
        }
        throw dbErr;
      }
      if (!data) { setError('Household not found.'); return; }
      localStorage.setItem(HOUSEHOLD_CODE_KEY, data.id);
      onSuccess(data);
    } catch (e) {
      setError(friendlyError(e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) { setTab(t); setError(''); }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      width: '100%',
    }}>
      <div className="modal-sheet" style={{ borderRadius: '28px 28px 0 0' }}>
        <div className="modal-header">
          <h2 className="modal-title">Welcome to Clean Home</h2>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          <button
            className={`tab-btn${tab === 'create' ? ' active' : ''}`}
            onClick={() => switchTab('create')}
          >
            🏠 Create
          </button>
          <button
            className={`tab-btn${tab === 'join' ? ' active' : ''}`}
            onClick={() => switchTab('join')}
          >
            👥 Join
          </button>
        </div>

        {tab === 'create' ? (
          <div>
            <div className="field">
              <label className="field-label">Household Name</label>
              <input
                className="input"
                placeholder="e.g. The Smith House"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <p className="text-hint">A unique 6-character code will be generated for sharing.</p>
          </div>
        ) : (
          <div>
            <div className="field">
              <label className="field-label">Join Code</label>
              <input
                className="input"
                style={{ textAlign: 'center', letterSpacing: '0.15em', fontSize: '20px', fontWeight: 700 }}
                placeholder="ABC123"
                value={joinCode}
                maxLength={6}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <p className="text-hint">Ask a household member for their 6-character code.</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-full mt-6"
          disabled={loading}
          onClick={tab === 'create' ? handleCreate : handleJoin}
        >
          {loading ? 'Please wait…' : tab === 'create' ? 'Create Household' : 'Join Household'}
        </button>
      </div>
    </div>
  );
}
