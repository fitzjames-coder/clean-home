import { ROOM_ICONS } from '../lib/constants.js';

export default function RoomIconPicker({ value, onChange }) {
  return (
    <div className="icon-picker">
      {ROOM_ICONS.map(icon => {
        const IconComp = icon.Icon ?? null;
        return (
          <button
            key={icon.value}
            type="button"
            className={`icon-picker-btn${value === icon.value ? ' selected' : ''}`}
            onClick={() => onChange(icon.value)}
          >
            {IconComp
              ? <IconComp size={24} color={value === icon.value ? 'var(--blue)' : 'var(--text-muted)'} />
              : icon.emoji
            }
            <span>{icon.label}</span>
          </button>
        );
      })}
    </div>
  );
}
