import { AppProvider, useApp } from './context/AppContext.jsx';
import HomeScreen       from './screens/HomeScreen.jsx';
import RoomDetailScreen from './screens/RoomDetailScreen.jsx';
import SuppliesScreen   from './screens/SuppliesScreen.jsx';
import RoomCodeScreen   from './components/RoomCodeScreen.jsx';

function AppContent() {
  const { screen, selectedRoomId, onCodeSet } = useApp();

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

  return (
    <div className="app-shell">
      {screen === 'home'     && <HomeScreen />}
      {screen === 'room'     && <RoomDetailScreen roomId={selectedRoomId} />}
      {screen === 'supplies' && <SuppliesScreen />}
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
