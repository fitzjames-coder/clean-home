import { AppProvider, useApp } from './context/AppContext.jsx';
import HomeScreen              from './screens/HomeScreen.jsx';
import RoomDetailScreen        from './screens/RoomDetailScreen.jsx';
import AppliancesScreen        from './screens/AppliancesScreen.jsx';
import ApplianceDetailScreen   from './screens/ApplianceDetailScreen.jsx';
import AddApplianceScreen      from './screens/AddApplianceScreen.jsx';
import SuppliesScreen          from './screens/SuppliesScreen.jsx';
import RoomCodeScreen          from './components/RoomCodeScreen.jsx';
import BottomNav               from './components/BottomNav.jsx';

function AppContent() {
  const {
    screen,
    selectedRoomId,
    selectedApplianceId,
    onCodeSet,
    goHome,
    goToAppliances,
    goToSupplies,
  } = useApp();

  if (screen === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="app-shell">
        <RoomCodeScreen onSuccess={onCodeSet} />
      </div>
    );
  }

  // Top-level screens show the bottom nav; detail / add screens do not
  const isTopLevel = screen === 'home' || screen === 'appliances' || screen === 'supplies';

  // Derive active tab — defaults to 'rooms' because screen starts at 'home'
  const activeTab =
    screen === 'appliances' ? 'appliances' :
    screen === 'supplies'   ? 'supplies'   :
    'rooms';

  function handleTabChange(tab) {
    if (tab === 'rooms')           goHome();
    else if (tab === 'appliances') goToAppliances();
    else if (tab === 'supplies')   goToSupplies();
  }

  return (
    <div className="app-shell">
      {screen === 'home'          && <HomeScreen />}
      {screen === 'room'          && <RoomDetailScreen roomId={selectedRoomId} />}
      {screen === 'appliances'    && <AppliancesScreen />}
      {screen === 'appliance'     && <ApplianceDetailScreen applianceId={selectedApplianceId} />}
      {screen === 'add-appliance' && <AddApplianceScreen />}
      {screen === 'supplies'      && <SuppliesScreen />}

      {isTopLevel && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
