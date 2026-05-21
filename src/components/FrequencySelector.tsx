"use client";

import { Frequency } from "@/lib/database.types";
import { FREQUENCY_META } from "@/lib/constants";

interface FrequencySelectorProps {
  value: Frequency;
  onChange: (f: Frequency) => void;
}

const FREQUENCIES: Frequency[] = ["D", "W", "2W", "2+W"];

export default function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <div className="flex gap-1">
      {FREQUENCIES.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            value === f
              ? "bg-[#2B7FFF] text-white shadow-sm"
              : "bg-[#eef4ff] text-[#5a7ab8] hover:bg-[#e3f0ff]"
          }`}
          title={FREQUENCY_META[f].description}
        >
          {FREQUENCY_META[f].shortLabel}
        </button>
      ))}
    </div>
  );
}
