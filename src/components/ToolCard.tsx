"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { Tool, SupplyTag, RoomSupply, Frequency } from "@/lib/database.types";
import { TOOL_META, FREQUENCY_META } from "@/lib/constants";
import { formatLastCleaned, formatLastCleanedFull, isDue } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import FrequencySelector from "./FrequencySelector";

interface ToolCardProps {
  tool: Tool;
  availableSupplies: SupplyTag[];
  linkedSupplies: (RoomSupply & { supply_tag: SupplyTag })[];
  roomId: string;
  onUpdate: (updated: Partial<Tool>) => void;
}

export default function ToolCard({
  tool,
  availableSupplies,
  linkedSupplies,
  roomId,
  onUpdate,
}: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [instructions, setInstructions] = useState(tool.instructions || "");
  const [savingInstr, setSavingInstr] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const meta = TOOL_META[tool.tool_type];
  const due = isDue(tool.last_completed, tool.frequency);
  const lastLabel = formatLastCleaned(tool.last_completed);
  const lastFull = formatLastCleanedFull(tool.last_completed);

  async function markDone() {
    if (markingDone) return;
    setMarkingDone(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("clean_home_tools")
      .update({ last_completed: now })
      .eq("id", tool.id);
    if (!error) onUpdate({ last_completed: now });
    setMarkingDone(false);
  }

  async function toggleActive() {
    if (togglingActive) return;
    setTogglingActive(true);
    const newActive = !tool.is_active;
    const { error } = await supabase
      .from("clean_home_tools")
      .update({ is_active: newActive })
      .eq("id", tool.id);
    if (!error) onUpdate({ is_active: newActive });
    setTogglingActive(false);
  }

  async function updateFrequency(f: Frequency) {
    const { error } = await supabase
      .from("clean_home_tools")
      .update({ frequency: f })
      .eq("id", tool.id);
    if (!error) onUpdate({ frequency: f });
  }

  async function saveInstructions() {
    setSavingInstr(true);
    await supabase
      .from("clean_home_tools")
      .update({ instructions })
      .eq("id", tool.id);
    onUpdate({ instructions });
    setSavingInstr(false);
  }

  async function toggleSupply(supplyTagId: string, linked: boolean) {
    if (linked) {
      // Remove: find the room_supply row
      const row = linkedSupplies.find((s) => s.supply_tag_id === supplyTagId);
      if (row) {
        await supabase.from("clean_home_room_supplies").delete().eq("id", row.id);
      }
    } else {
      await supabase.from("clean_home_room_supplies").insert({
        room_id: roomId,
        supply_tag_id: supplyTagId,
      });
    }
    // Trigger re-fetch from parent by calling onUpdate with a dummy partial
    onUpdate({});
  }

  if (!tool.is_active) {
    return (
      <div className="card p-4 flex items-center justify-between opacity-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl grayscale">{meta.emoji}</span>
          <div>
            <p className="font-semibold text-gray-500 text-sm">{meta.label}</p>
            <p className="text-xs text-gray-400">Inactive</p>
          </div>
        </div>
        <button onClick={toggleActive} className="p-2 rounded-full hover:bg-[#F0F6FF] transition-colors">
          <ToggleLeft size={22} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden transition-all ${due ? "border-[#2B7FFF]/15" : "border-[#2ECC8F]/15"}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Mark Done button */}
        <button
          onClick={markDone}
          disabled={markingDone}
          className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90 ${
            due
              ? "bg-[#E0EEFF] hover:bg-[#d0e8ff] border border-[#2B7FFF]/25"
              : "bg-[#e0f9f0] hover:bg-[#d0f5e8] border border-[#2ECC8F]/25"
          }`}
          title="Mark as cleaned"
        >
          {meta.emoji}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">{meta.label}</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                due ? "bg-[#E0EEFF] text-[#2B7FFF]" : "bg-[#d0f5e8] text-[#1aaa72]"
              }`}
            >
              {FREQUENCY_META[tool.frequency].shortLabel}
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 ${due ? "text-gray-400" : "text-[#2ECC8F]"}`}
            title={lastFull}
          >
            {lastLabel}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button onClick={toggleActive} title="Disable tool" className="p-2 rounded-full hover:bg-[#F0F6FF] transition-colors">
            <ToggleRight size={20} className="text-[#2B7FFF]" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-full hover:bg-[#F0F6FF] transition-colors"
          >
            {expanded ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mark done confirmation */}
      {markingDone && (
        <div className="px-4 pb-3 flex items-center gap-2 text-[#2ECC8F] text-sm">
          <CheckCircle2 size={16} />
          <span>Marked as cleaned!</span>
        </div>
      )}

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-5 space-y-4 border-t border-[#E8EFF8] pt-4">
          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Frequency
            </label>
            <FrequencySelector value={tool.frequency} onChange={updateFrequency} />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Instructions
            </label>
            <textarea
              className="input-field resize-none text-sm"
              rows={3}
              placeholder={`How to ${meta.label.toLowerCase()} this room…`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onBlur={saveInstructions}
            />
            {savingInstr && <p className="text-xs text-gray-400 mt-1">Saving…</p>}
          </div>

          {/* Supplies */}
          {availableSupplies.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1">
                  <Tag size={12} /> Supplies
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSupplies.map((supply) => {
                  const isLinked = linkedSupplies.some(
                    (ls) => ls.supply_tag_id === supply.id
                  );
                  return (
                    <button
                      key={supply.id}
                      onClick={() => toggleSupply(supply.id, isLinked)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isLinked
                          ? "bg-[#2B7FFF] text-white border-[#2B7FFF]"
                          : "bg-white text-[#4A6FA5] border-[#D4E2F0] hover:border-[#2B7FFF] hover:text-[#2B7FFF]"
                      }`}
                    >
                      {supply.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={supply.photo_url}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      {supply.name_en}
                      {supply.name_de && (
                        <span className="opacity-70">/ {supply.name_de}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
