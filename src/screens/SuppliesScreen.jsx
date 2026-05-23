import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import SupplyTagCard from '../components/SupplyTagCard.jsx';

export default function SuppliesScreen() {
  const { roomCode, supplies, setSupplies, goHome } = useApp();

  const [showAdd,    setShowAdd]    = useState(false);
  const [newNameEn,  setNewNameEn]  = useState('');
  const [newNameDe,  setNewNameDe]  = useState('');
  const [newPhotoUrl,setNewPhotoUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError,   setAddError]   = useState('');
  const [uploading,  setUploading]  = useState(false);

  async function handlePhotoUpload(file) {
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `supplies/new-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('clean-home-photos')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('clean-home-photos').getPublicUrl(path);
      setNewPhotoUrl(data.publicUrl);
    } catch (e) {
      console.error('[CleanHome] photo upload:', e);
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd() {
    if (!newNameEn.trim()) {
      setAddError('Please enter an English name');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      const { data, error } = await supabase
        .from('clean_home_supply_tags')
        .insert({
          room_code: roomCode,
          name_en:   newNameEn.trim(),
          name_de:   newNameDe.trim() || null,
          photo_url: newPhotoUrl || null,
        })
        .select()
        .single();
      if (error) throw error;
      setSupplies(prev => [...prev, data]);
      setShowAdd(false);
      setNewNameEn('');
      setNewNameDe('');
      setNewPhotoUrl('');
    } catch (e) {
      console.error('[CleanHome] addSupply:', e);
      setAddError(e.message || 'Failed to add supply');
    } finally {
      setAddLoading(false);
    }
  }

  function handleDeleteSupply(id) {
    setSupplies(prev => prev.filter(s => s.id !== id));
  }

  function handleUpdateSupply(updated) {
    setSupplies(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div className="supplies-header">
        <div>
          <button className="back-btn back-btn-pill" onClick={goHome}>
            <span className="back-btn-icon">←</span>
            All Rooms
          </button>
          <h1 className="supplies-title">Supplies</h1>
        </div>
      </div>

      {/* ── List ── */}
      <div className="supplies-list">

        {/* Add form */}
        {showAdd ? (
          <div className="card supply-edit">
            <div className="supply-edit-row">
              {/* Photo upload */}
              <label className="supply-photo-btn" style={{ cursor: 'pointer' }}>
                {newPhotoUrl ? (
                  <img src={newPhotoUrl} alt="supply" className="supply-photo" />
                ) : (
                  <span>📷</span>
                )}
                {uploading && (
                  <div className="supply-photo-upload-overlay">
                    <div className="spinner" style={{ width: 20, height: 20 }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                />
              </label>

              <div className="supply-edit-fields">
                <input
                  className="input"
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                  placeholder="English name *"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  autoFocus
                />
                <input
                  className="input"
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                  placeholder="German name (optional)"
                  value={newNameDe}
                  onChange={e => setNewNameDe(e.target.value)}
                />
              </div>
            </div>

            {addError && <div className="error-box">{addError}</div>}

            <div className="supply-edit-actions">
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: '13px' }}
                onClick={() => { setShowAdd(false); setNewNameEn(''); setNewNameDe(''); setNewPhotoUrl(''); setAddError(''); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-teal"
                style={{ padding: '8px 14px', fontSize: '13px' }}
                disabled={addLoading || !newNameEn.trim()}
                onClick={handleAdd}
              >
                {addLoading ? 'Adding…' : '✓ Add'}
              </button>
            </div>
          </div>
        ) : (
          <button className="add-supply-btn" onClick={() => setShowAdd(true)}>
            ＋ Add Supply
          </button>
        )}

        {/* Supply cards */}
        {supplies.length === 0 && !showAdd && (
          <div className="empty-state">
            <div className="empty-state-icon">🧴</div>
            <div className="empty-state-title">No supplies yet</div>
            <div className="empty-state-text">Add cleaning supplies to assign them to rooms.</div>
          </div>
        )}

        {supplies.map(supply => (
          <div key={supply.id} className="card">
            <SupplyTagCard
              supply={supply}
              onDelete={() => handleDeleteSupply(supply.id)}
              onUpdate={handleUpdateSupply}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
