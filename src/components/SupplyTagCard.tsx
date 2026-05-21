"use client";

import { useState, useRef } from "react";
import { Pencil, Trash2, Check, X, Camera } from "lucide-react";
import { SupplyTag } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface SupplyTagCardProps {
  supply: SupplyTag;
  onDelete: () => void;
  onUpdate: (updated: SupplyTag) => void;
}

export default function SupplyTagCard({ supply, onDelete, onUpdate }: SupplyTagCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameEn, setNameEn] = useState(supply.name_en);
  const [nameDe, setNameDe] = useState(supply.name_de || "");
  const [photoUrl, setPhotoUrl] = useState(supply.photo_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `supplies/${supply.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("clean-home-photos")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("clean-home-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!nameEn.trim()) return;
    setSaving(true);
    const updates = {
      name_en: nameEn.trim(),
      name_de: nameDe.trim() || null,
      photo_url: photoUrl || null,
    };
    const { data, error } = await supabase
      .from("clean_home_supply_tags")
      .update(updates)
      .eq("id", supply.id)
      .select()
      .single();
    if (!error && data) {
      onUpdate(data);
    }
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    await supabase.from("clean_home_supply_tags").delete().eq("id", supply.id);
    onDelete();
  }

  if (editing) {
    return (
      <div className="card p-4 space-y-3">
        {/* Photo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#2B7FFF] flex items-center justify-center bg-gray-50 overflow-hidden transition-colors relative"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="supply" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} className="text-gray-400" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
          <div className="flex-1 space-y-2">
            <input
              className="input-field py-2 text-sm"
              placeholder="English name *"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
            <input
              className="input-field py-2 text-sm"
              placeholder="German name (optional)"
              value={nameDe}
              onChange={(e) => setNameDe(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditing(false); setNameEn(supply.name_en); setNameDe(supply.name_de || ""); setPhotoUrl(supply.photo_url || ""); }}
            className="btn-ghost py-1.5 px-3 text-sm"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nameEn.trim()}
            className="btn-teal py-1.5 px-4 text-sm flex items-center gap-1.5"
          >
            <Check size={16} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 flex items-center gap-3">
      {/* Photo */}
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {supply.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={supply.photo_url} alt={supply.name_en} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🧴</span>
        )}
      </div>

      {/* Names */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{supply.name_en}</p>
        {supply.name_de && (
          <p className="text-xs text-gray-400 truncate">{supply.name_de}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Pencil size={16} className="text-gray-400" />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Check size={16} className="text-red-500" />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}
