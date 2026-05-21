"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Room, RoomIcon } from "@/lib/database.types";
import { TOOL_ORDER, TOOL_META } from "@/lib/constants";
import { extractErrorMessage, logError } from "@/lib/errors";
import RoomIconPicker from "./RoomIconPicker";

interface AddRoomModalProps {
  householdId: string;
  onClose: () => void;
  onSuccess: (room: Room) => void;
}

export default function AddRoomModal({ householdId, onClose, onSuccess }: AddRoomModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<RoomIcon>("living-room");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Please enter a room name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Create room
      const { data: room, error: roomErr } = await supabase
        .from("clean_home_rooms")
        .insert({ household_id: householdId, name: name.trim(), icon })
        .select()
        .single();
      if (roomErr) {
        logError("AddRoomModal — insert room", roomErr);
        throw roomErr;
      }

      // Create default tools (all active) — tool_name must be supplied explicitly
      // because the column has no server-side default and is required in the DB.
      const toolRows = TOOL_ORDER.map((tool_type) => ({
        room_id: room.id,
        tool_type,
        tool_name: TOOL_META[tool_type].label, // "Duster" | "Broom" | "Mop" | "Vacuum" | "Bot"
        is_active: true,
        frequency: "W",
        instructions: "",
      }));
      const { error: toolErr } = await supabase
        .from("clean_home_tools")
        .insert(toolRows);
      if (toolErr) {
        logError("AddRoomModal — insert tools", toolErr);
        throw toolErr;
      }

      onSuccess(room);
    } catch (e: unknown) {
      logError("AddRoomModal.handleSubmit", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Add Room</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F0F6FF] transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Name</label>
            <input
              className="input-field"
              placeholder="e.g. Master Bedroom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
            <RoomIconPicker value={icon} onChange={setIcon} />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full mt-6"
        >
          {loading ? "Creating…" : "Add Room"}
        </button>
      </div>
    </div>
  );
}
