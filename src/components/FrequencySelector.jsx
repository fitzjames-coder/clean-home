import { FREQUENCY_META } from '../lib/constants.js';

const FREQUENCIES = ['D', 'W', '2W', '2+W'];

export default function FrequencySelector({ value, onChange }) {
  return (
    <div className="freq-selector">
      {FREQUENCIES.map(f => (
        <button
          key={f}
          type="button"
          className={`freq-btn${value === f ? ' active' : ''}`}
          onClick={() => onChange(f)}
          title={FREQUENCY_META[f].description}
        >
          {FREQUENCY_META[f].shortLabel}
        </button>
      ))}
    </div>
  );
}
