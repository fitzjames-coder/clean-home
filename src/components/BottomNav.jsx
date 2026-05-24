import { useApp } from '../context/AppContext.jsx';
import { roomStatus, anyApplianceOverdue } from '../lib/constants.js';

export default function BottomNav({ activeTab, onTabChange }) {
  const { rooms, appliances } = useApp();

  // Notification dots
  const roomsOverdue = rooms.some(r => {
    const s = roomStatus(r.tools ?? []);
    return s === 'overdue' || s === 'critical';
  });
  const appliancesOverdue = anyApplianceOverdue(appliances);

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-tab${activeTab === 'rooms' ? ' active' : ''}`}
        onClick={() => onTabChange('rooms')}
      >
        <div className="bottom-nav-icon-wrap">
          <img src="/rooms.png" alt="Rooms" className="nav-icon" />
          {roomsOverdue && <span className="bottom-nav-dot" />}
        </div>
        <span className="bottom-nav-label">Rooms</span>
      </button>

      <button
        className={`bottom-nav-tab${activeTab === 'appliances' ? ' active' : ''}`}
        onClick={() => onTabChange('appliances')}
      >
        <div className="bottom-nav-icon-wrap">
          <img
            src="/appliance-icons/Stove.png"
            alt="Appliances"
            className="bottom-nav-appliance-icon"
          />
          {appliancesOverdue && <span className="bottom-nav-dot" />}
        </div>
        <span className="bottom-nav-label">Appliances</span>
      </button>

      <button
        className={`bottom-nav-tab${activeTab === 'supplies' ? ' active' : ''}`}
        onClick={() => onTabChange('supplies')}
      >
        <div className="bottom-nav-icon-wrap">
          <img src="/supplies.png" alt="Supplies" className="nav-icon" />
        </div>
        <span className="bottom-nav-label">Supplies</span>
      </button>
    </nav>
  );
}
