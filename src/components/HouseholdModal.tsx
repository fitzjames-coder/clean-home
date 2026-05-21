"use client";

import { useState } from "react";
import { X, Home, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateHouseholdCode, } from "@/lib/utils";
import { HOUSEHOLD_CODE_KEY } from "@/lib/constants";
import { Household } from "@/lib/database.types";

interface HouseholdModalProps {
  onClose: () => void;
  onSuccess: (household: Household) => void;
}

type Tab = "create" | "join";

export default function HouseholdModal({ onClose, onSuccess }: HouseholdModalProps) {
  const [tab, setTab] = useState<Tab>("create");
  const [householdName, setHouseholdName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!householdName.trim()) {
      setError("Please enter a household name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = generateHouseholdCode();
      const { data, error: dbErr } = await supabase
        .from("clean_home_households")
        .insert({ name: householdName.trim(), code })
        .select()
        .single();
      if (dbErr) throw dbErr;
      localStorage.setItem(HOUSEHOLD_CODE_KEY, data.id);
      onSuccess(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create household");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter a join code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: dbErr } = await supabase
        .from("clean_home_households")
        .select()
        .eq("code", code)
        .single();
      if (dbErr || !data) {
        setError("Household not found. Check the code and try again.");
        return;
      }
      localStorage.setItem(HOUSEHOLD_CODE_KEY, data.id);
      onSuccess(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join household");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Welcome to Clean Home</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => { setTab("create"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "create" ? "bg-white text-[#2B7FFF] shadow-sm" : "text-gray-500"
            }`}
          >
            <Home size={16} /> Create
          </button>
          <button
            onClick={() => { setTab("join"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "join" ? "bg-white text-[#2B7FFF] shadow-sm" : "text-gray-500"
            }`}
          >
            <Users size={16} /> Join
          </button>
        </div>

        {tab === "create" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Household Name
              </label>
              <input
                className="input-field"
                placeholder="e.g. The Smith House"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <p className="text-xs text-gray-500">
              A unique 6-character code will be generated so others can join your household.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Join Code
              </label>
              <input
                className="input-field uppercase tracking-widest text-center text-lg font-semibold"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <p className="text-xs text-gray-500">
              Ask a household member for their 6-character code.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}

        <button
          onClick={tab === "create" ? handleCreate : handleJoin}
          disabled={loading}
          className="btn-primary w-full mt-6"
        >
          {loading ? "Please wait…" : tab === "create" ? "Create Household" : "Join Household"}
        </button>
      </div>
    </div>
  );
}
