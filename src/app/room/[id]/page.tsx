"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tag, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Room, Tool, SupplyTag, RoomSupply } from "@/lib/database.types";
import { ROOM_ICONS, TOOL_ORDER, HOUSEHOLD_CODE_KEY } from "@/lib/constants";
import { logError } from "@/lib/errors";
import ToolCard from "@/components/ToolCard";

type LinkedSupply = RoomSupply & { supply_tag: SupplyTag };

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [supplies, setSupplies] = useState<SupplyTag[]>([]);
  const [linkedSupplies, setLinkedSupplies] = useState<LinkedSupply[]>([]);
  const [remarks, setRemarks] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Load everything on mount ─────────────────────────────────────────────

  const loadLinkedSupplies = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("clean_home_room_supplies")
      .select("*, supply_tag:clean_home_supply_tags(*)")
      .eq("room_id", id);
    if (error) logError("RoomDetailPage.loadLinkedSupplies", error);
    setLinkedSupplies((data as LinkedSupply[]) ?? []);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadData() {
      const [roomRes, toolsRes] = await Promise.all([
        supabase.from("clean_home_rooms").select().eq("id", id).single(),
        supabase.from("clean_home_tools").select().eq("room_id", id).order("created_at"),
      ]);

      if (!active) return;

      if (roomRes.error) logError("RoomDetailPage — fetch room", roomRes.error);
      if (toolsRes.error) logError("RoomDetailPage — fetch tools", toolsRes.error);

      if (roomRes.data) {
        setRoom(roomRes.data);
        setRemarks(roomRes.data.remarks ?? "");
      }

      if (toolsRes.data) {
        const sorted = [...toolsRes.data].sort(
          (a, b) =>
            TOOL_ORDER.indexOf(a.tool_type as (typeof TOOL_ORDER)[number]) -
            TOOL_ORDER.indexOf(b.tool_type as (typeof TOOL_ORDER)[number])
        );
        setTools(sorted);
      }

      // Supply tags for this household
      const householdId = localStorage.getItem(HOUSEHOLD_CODE_KEY);
      if (householdId) {
        const { data: tagData, error: tagErr } = await supabase
          .from("clean_home_supply_tags")
          .select()
          .eq("household_id", householdId)
          .order("name_en");
        if (!active) return;
        if (tagErr) logError("RoomDetailPage — fetch supply tags", tagErr);
        setSupplies(tagData ?? []);
      }

      await loadLinkedSupplies();
      if (active) setLoading(false);
    }

    loadData();
    return () => { active = false; };
  }, [id, loadLinkedSupplies]);

  // ─── Remarks save ─────────────────────────────────────────────────────────

  // True when the textarea has changes not yet committed to Supabase
  const remarksAreDirty = room !== null && remarks !== (room.remarks ?? "");

  async function saveRemarks() {
    if (!room || !remarksAreDirty) return;
    setSavingRemarks(true);
    const { error } = await supabase
      .from("clean_home_rooms")
      .update({ remarks })
      .eq("id", id);
    if (error) logError("RoomDetailPage.saveRemarks", error);
    // Sync local room state so dirty flag resets
    setRoom((prev) => (prev ? { ...prev, remarks } : prev));
    setSavingRemarks(false);
  }

  // ─── Back navigation ──────────────────────────────────────────────────────
  // router.refresh() clears Next.js's client-side router cache before we push
  // to '/'. Without it, Next.js may serve the cached (stale) home page and the
  // home component won't re-mount — so its useEffect won't run and the room
  // list won't update. After refresh(), the home component always re-mounts
  // fresh and its simple useEffect always fetches the current rooms from Supabase.
  async function handleBack() {
    if (remarksAreDirty) await saveRemarks();
    router.refresh();
    router.push("/");
  }

  // ─── Tool updates ─────────────────────────────────────────────────────────

  function updateTool(toolId: string, partial: Partial<Tool>) {
    setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, ...partial } : t)));
    // Supply toggle: re-fetch linked supplies list
    if ("supply_tag_id" in partial || Object.keys(partial).length === 0) {
      loadLinkedSupplies();
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const roomMeta = room ? ROOM_ICONS.find((i) => i.value === room.icon) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Room not found</p>
        <button
          onClick={() => { router.refresh(); router.push("/"); }}
          className="btn-primary"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#2B7FFF] font-semibold mb-5 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          All Rooms
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#EBF4FF] to-[#E3FBF3] flex items-center justify-center text-4xl shadow-inner">
            {roomMeta?.emoji ?? "🏠"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-400">{roomMeta?.label ?? "Room"}</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-5 pb-10 space-y-5 overflow-y-auto">

        {/* Cleaning tools */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Cleaning Tools
          </h2>
          <div className="space-y-3">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                availableSupplies={supplies}
                linkedSupplies={linkedSupplies.filter((ls) => ls.room_id === id)}
                roomId={id}
                onUpdate={(partial) => updateTool(tool.id, partial)}
              />
            ))}
          </div>
        </section>

        {/* Room supplies summary */}
        {linkedSupplies.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag size={12} /> Room Supplies
            </h2>
            <div className="card p-4">
              <div className="flex flex-wrap gap-2">
                {linkedSupplies.map((ls) => (
                  <div key={ls.id} className="tag-chip">
                    {ls.supply_tag.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ls.supply_tag.photo_url}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    {ls.supply_tag.name_en}
                    {ls.supply_tag.name_de && (
                      <span className="text-[#2B7FFF]/60">/ {ls.supply_tag.name_de}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Remarks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Remarks
            </h2>
            {/* Visible Save button — only shown when there are unsaved changes */}
            {remarksAreDirty && (
              <button
                onClick={saveRemarks}
                disabled={savingRemarks}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2B7FFF] px-3 py-1.5 rounded-xl hover:bg-[#1A6FEF] active:scale-95 transition-all disabled:opacity-60"
              >
                <Save size={12} />
                {savingRemarks ? "Saving…" : "Save"}
              </button>
            )}
          </div>
          <div className="card p-4">
            <textarea
              className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none placeholder-gray-300"
              rows={4}
              placeholder="Add notes about this room…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onBlur={saveRemarks}  // auto-save when focus leaves the field
            />
          </div>
          {savingRemarks && (
            <p className="text-xs text-gray-400 mt-1.5 px-1">Saving…</p>
          )}
        </section>
      </div>
    </div>
  );
}
