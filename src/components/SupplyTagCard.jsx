import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export default function SupplyTagCard({ supply, onDelete, onUpdate }) {
  const [editing,       setEditing]       = useState(false);
  const [nameEn,        setNameEn]        = useState(supply.name_en);
  const [nameDe,        setNameDe]        = useState(supply.name_de ?? '');
  const [photoUrl,      setPhotoUrl]      = useState(supply.photo_url ?? '');
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  async function handlePhotoUpload(file) {
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `supplies/${supply.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('clean-home-photos')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('clean-home-photos').getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (e) {
      console.error('[CleanHome] SupplyTagCard upload:', e);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!nameEn.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('clean_home_supply_tags')
      .update({ name_en: nameEn.trim(), name_de: nameDe.trim() || null, photo_url: photoUrl || null })
      .eq('id', supply.id)
      .select()
      .single();
    if (error) console.error('[CleanHome] saveSupply:', error);
    if (!error && data) onUpdate(data);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    const { error } = await supabase.from('clean_home_supply_tags').delete().eq('id', supply.id);
    if (error) console.error('[CleanHome] deleteSupply:', error);
    onDelete();
  }

  function cancelEdit() {
    setEditing(false);
    setNameEn(supply.name_en);
    setNameDe(supply.name_de ?? '');
    setPhotoUrl(supply.photo_url ?? '');
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="supply-edit">
        <div className="supply-edit-row">
          <button
            type="button"
            className="supply-photo-btn"
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl
              ? <img src={photoUrl} alt="supply" className="supply-photo" />
              : <span>📷</span>
            }
            {uploading && (
              <div className="supply-photo-upload-overlay">
                <div className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
          />

          <div className="supply-edit-fields">
            <input
              className="input"
              style={{ padding: '8px 12px', fontSize: '14px' }}
              placeholder="English name *"
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
            />
            <input
              className="input"
              style={{ padding: '8px 12px', fontSize: '14px' }}
              placeholder="German name (optional)"
              value={nameDe}
              onChange={e => setNameDe(e.target.value)}
            />
          </div>
        </div>

        <div className="supply-edit-actions">
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 14px', fontSize: '13px' }}
            onClick={cancelEdit}
          >
            ✕
          </button>
          <button
            className="btn btn-teal"
            style={{ padding: '6px 14px', fontSize: '13px' }}
            disabled={saving || !nameEn.trim()}
            onClick={handleSave}
          >
            ✓ {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  // ── Display mode ──────────────────────────────────────────────────────────
  return (
    <div className="supply-card">
      <div className="supply-photo-wrap">
        {supply.photo_url
          ? <img src={supply.photo_url} alt={supply.name_en} className="supply-photo" />
          : <span>🧴</span>
        }
      </div>

      <div className="supply-names">
        <div className="supply-name-en">{supply.name_en}</div>
        {supply.name_de && <div className="supply-name-de">{supply.name_de}</div>}
      </div>

      <div className="supply-actions">
        <button
          className="btn-icon"
          onClick={() => setEditing(true)}
          title="Edit"
        >
          ✏️
        </button>

        {confirmDelete ? (
          <div className="confirm-delete-row">
            <button
              className="btn btn-danger"
              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 8 }}
              onClick={handleDelete}
            >
              ✓
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 8 }}
              onClick={() => setConfirmDelete(false)}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="btn-icon"
            onClick={() => setConfirmDelete(true)}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
