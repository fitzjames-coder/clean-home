"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SupplyTag } from "@/lib/database.types";
import { HOUSEHOLD_CODE_KEY } from "@/lib/constants";
import SupplyTagCard from "@/components/SupplyTagCard";

export default function SuppliesPage() {
  const router = useRouter();
  const [supplies, setSupplies] = useState<SupplyTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameDe, setNewNameDe] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadSupplies = useCallback(async (hid: string) => {
    const { data } = await supabase
      .from("clean_home_supply_tags")
      .select()
      .eq("household_id", hid)
      .order("name_en");
    setSupplies(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const hid = localStorage.getItem(HOUSEHOLD_CODE_KEY);
    if (!hid) {
      router.push("/");
      return;
    }
    setHouseholdId(hid);
    loadSupplies(hid);
  }, [router, loadSupplies]);

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `supplies/new-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("clean-home-photos")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("clean-home-photos").getPublicUrl(path);
      setNewPhotoUrl(data.publicUrl);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd() {
    if (!newNameEn.trim()) {
      setError("English name is required");
      return;
    }
    if (!householdId) return;
    setSaving(true);
    setError("");
    try {
      const { data, error: dbErr } = await supabase
        .from("clean_home_supply_tags")
        .insert({
          household_id: householdId,
          name_en: newNameEn.trim(),
          name_de: newNameDe.trim() || null,
          photo_url: newPhotoUrl || null,
        })
        .select()
        .single();
      if (dbErr) throw dbErr;
      setSupplies((prev) => [...prev, data].sort((a, b) => a.name_en.localeCompare(b.name_en)));
      setNewNameEn("");
      setNewNameDe("");
      setNewPhotoUrl("");
      setShowAdd(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add supply");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#2B7FFF] font-semibold mb-5 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧴 Supplies</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {supplies.length} item{supplies.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary flex items-center gap-1.5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mx-5 mb-5 card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">New Supply</h3>

          {/* Photo upload */}
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#2B7FFF] flex items-center justify-center bg-gray-50 overflow-hidden transition-colors relative flex-shrink-0"
            >
              {newPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newPhotoUrl} alt="preview" className="w-full h-full object-cover" />
              ) : uploading ? (
                <div className="w-5 h-5 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={20} className="text-gray-400" />
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
                className="input-field py-2.5 text-sm"
                placeholder="English name *"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                autoFocus
              />
              <input
                className="input-field py-2.5 text-sm"
                placeholder="German name (optional)"
                value={newNameDe}
                onChange={(e) => setNewNameDe(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdd(false); setError(""); setNewNameEn(""); setNewNameDe(""); setNewPhotoUrl(""); }}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || uploading}
              className="btn-teal flex-1"
            >
              {saving ? "Adding…" : "Add Supply"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-5 pb-10">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-8 h-8 border-2 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : supplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🧴</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No supplies yet</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Add cleaning supplies and tag them to rooms.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {supplies.map((supply) => (
              <SupplyTagCard
                key={supply.id}
                supply={supply}
                onDelete={() =>
                  setSupplies((prev) => prev.filter((s) => s.id !== supply.id))
                }
                onUpdate={(updated) =>
                  setSupplies((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
