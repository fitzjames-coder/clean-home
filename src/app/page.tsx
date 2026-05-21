"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Share2, Tag, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Room, Household } from "@/lib/database.types";
import { ROOM_ICONS, HOUSEHOLD_CODE_KEY } from "@/lib/constants";
import { logError } from "@/lib/errors";
import HouseholdModal from "@/components/HouseholdModal";
import AddRoomModal from "@/components/AddRoomModal";
import AppLogo from "@/components/AppLogo";

export default function HomePage() {
  const router = useRouter();
  const [household, setHousehold] = useState<Household | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const loadHousehold = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("clean_home_households")
      .select()
      .eq("id", id)
      .single();
    if (error) logError("HomePage.loadHousehold", error);
    if (data) {
      setHousehold(data);
      loadRooms(data.id);
    } else {
      localStorage.removeItem(HOUSEHOLD_CODE_KEY);
      setShowHouseholdModal(true);
      setLoading(false);
    }
  }, []);

  const loadRooms = async (householdId: string) => {
    const { data, error } = await supabase
      .from("clean_home_rooms")
      .select()
      .eq("household_id", householdId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) logError("HomePage.loadRooms", error);
    setRooms(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const savedId = localStorage.getItem(HOUSEHOLD_CODE_KEY);
    if (savedId) {
      loadHousehold(savedId);
    } else {
      setShowHouseholdModal(true);
      setLoading(false);
    }
  }, [loadHousehold]);

  // Re-fetch rooms when the user navigates back to this page.
  // Next.js App Router caches client components and doesn't re-mount them on
  // back-navigation, so useEffect above won't re-run. Listening for the
  // window's 'focus' event is the reliable cross-browser way to detect
  // when the user returns to this tab / navigates back from the room page.
  useEffect(() => {
    const handleFocus = () => {
      const savedId = localStorage.getItem(HOUSEHOLD_CODE_KEY);
      if (savedId) loadHousehold(savedId);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadHousehold]);

  async function deleteRoom(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("clean_home_rooms").delete().eq("id", id);
    if (error) logError("HomePage.deleteRoom", error);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  function getRoomIcon(icon: string) {
    return ROOM_ICONS.find((i) => i.value === icon)?.emoji || "🏠";
  }

  function switchHousehold() {
    localStorage.removeItem(HOUSEHOLD_CODE_KEY);
    setHousehold(null);
    setRooms([]);
    setShowHouseholdModal(true);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#2B7FFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-12 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <AppLogo size={44} />
                <h1 className="text-3xl font-bold text-gray-900">Clean Home</h1>
              </div>
              {household && (
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="mt-1 flex items-center gap-1.5 text-sm text-[#2B7FFF] font-medium"
                >
                  <Share2 size={14} />
                  {household.name}
                </button>
              )}
            </div>
            {household && (
              <button
                onClick={switchHousehold}
                className="p-2.5 rounded-2xl bg-white border border-[#E8EFF8] shadow-sm hover:bg-[#F0F6FF] transition-colors"
                title="Switch household"
              >
                <Settings size={18} className="text-gray-500" />
              </button>
            )}
          </div>

          {/* Household code reveal */}
          {showCode && household && (
            <div className="mt-3 bg-[#2B7FFF]/10 border border-[#2B7FFF]/20 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#2B7FFF] font-medium mb-0.5">Share code</p>
                <p className="text-2xl font-bold tracking-widest text-[#2B7FFF]">
                  {household.code}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(household.code);
                  setShowCode(false);
                }}
                className="btn-primary py-2 text-xs"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Rooms list */}
        <div className="flex-1 px-5 pb-28">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">No rooms yet</h2>
              <p className="text-gray-400 text-sm max-w-xs">
                Add your first room to start tracking cleaning tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="card group relative overflow-hidden"
                >
                  <button
                    onClick={() => router.push(`/room/${room.id}`)}
                    className="flex items-center gap-4 p-4 w-full text-left hover:bg-[#F0F6FF]/60 transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#EBF4FF] to-[#E3FBF3] flex items-center justify-center text-3xl shadow-inner">
                      {getRoomIcon(room.icon)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base">{room.name}</p>
                      {room.remarks ? (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">{room.remarks}</p>
                      ) : (
                        <p className="text-sm text-gray-300 mt-0.5 italic">No remarks</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-300 group-hover:text-[#2B7FFF] transition-colors text-lg">
                      ›
                    </div>
                  </button>

                  {/* Delete */}
                  <div className="absolute right-4 top-4 flex items-center gap-1">
                    {confirmDeleteId === room.id ? (
                      <>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          disabled={deletingId === room.id}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg"
                        >
                          {deletingId === room.id ? "…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-1 bg-[#F0F6FF] text-[#4A6FA5] rounded-lg"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(room.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={15} className="text-gray-300 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom FAB bar */}
      {household && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-8 pt-3 bg-gradient-to-t from-[#F8FAFF] to-transparent pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
            <button
              onClick={() => router.push("/supplies")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#2B7FFF]/25 shadow-sm text-sm font-semibold text-[#2B7FFF] hover:bg-[#F0F6FF] transition-colors"
            >
              <Tag size={16} className="text-[#2ECC8F]" />
              Supplies
            </button>
            <button
              onClick={() => setShowAddRoom(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2B7FFF] shadow-lg text-white font-bold text-sm hover:bg-[#1A6FEF] active:scale-95 transition-all"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showHouseholdModal && (
        <HouseholdModal
          onClose={() => setShowHouseholdModal(false)}
          onSuccess={(h) => {
            setHousehold(h);
            setShowHouseholdModal(false);
            loadRooms(h.id);
          }}
        />
      )}

      {showAddRoom && household && (
        <AddRoomModal
          householdId={household.id}
          onClose={() => setShowAddRoom(false)}
          onSuccess={(room) => {
            setRooms((prev) => [...prev, room]);
            setShowAddRoom(false);
          }}
        />
      )}
    </>
  );
}
