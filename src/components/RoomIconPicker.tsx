"use client";

import { ROOM_ICONS } from "@/lib/constants";
import { RoomIcon } from "@/lib/database.types";

interface RoomIconPickerProps {
  value: RoomIcon;
  onChange: (icon: RoomIcon) => void;
}

export default function RoomIconPicker({ value, onChange }: RoomIconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ROOM_ICONS.map((icon) => (
        <button
          key={icon.value}
          type="button"
          onClick={() => onChange(icon.value)}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${
            value === icon.value
              ? "border-[#2B7FFF] bg-blue-50"
              : "border-gray-100 bg-gray-50 hover:border-gray-200"
          }`}
          title={icon.label}
        >
          <span className="text-2xl">{icon.emoji}</span>
          <span className="text-[10px] text-gray-500 leading-tight text-center">
            {icon.label.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
}
