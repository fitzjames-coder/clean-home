import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ROOM_CODE_KEY } from '../lib/constants';

const AppContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// AppProvider
//
// Simple room-code scoping — no household table, no FK lookups, no joins.
// Every row in clean_home_rooms and clean_home_supply_tags carries a plain
// `room_code` text column. The code is stored in localStorage and used as
// the filter for every SELECT/INSERT. This matches the Pantry app pattern.
//
// Screens: 'loading' | 'setup' | 'home' | 'room' | 'supplies'
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [screen,         setScreen]         = useState('loading');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomCode,       setRoomCode]       = useState(null);
  const [rooms,          setRooms]          = useState([]);
  const [supplies,       setSupplies]       = useState([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_CODE_KEY);
    if (saved) {
      setRoomCode(saved);
      Promise.all([fetchRooms(saved), fetchSupplies(saved)]).then(() => {
        setScreen('home');
      });
    } else {
      setScreen('setup');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data fetchers ──────────────────────────────────────────────────────────

  async function fetchRooms(code) {
    const c = code ?? roomCode;
    if (!c) return;
    const { data, error } = await supabase
      .from('clean_home_rooms')
      .select()
      .eq('room_code', c)
      .order('sort_order', { ascending: true })
      .order('created_at',  { ascending: true });
    if (error) {
      console.error('[CleanHome] fetchRooms:', error);
      // Do NOT overwrite state with [] on error — leave previous data intact
      // so a transient DB failure doesn't blank the room list.
      alert(`[CleanHome] Failed to load rooms: ${error.message}\n\nCheck the browser console for details.`);
      return;
    }
    setRooms(data ?? []);
  }

  async function fetchSupplies(code) {
    const c = code ?? roomCode;
    if (!c) return;
    const { data, error } = await supabase
      .from('clean_home_supply_tags')
      .select()
      .eq('room_code', c)
      .order('name_en');
    if (error) {
      console.error('[CleanHome] fetchSupplies:', error);
      // Do NOT overwrite state with [] on error — leave previous data intact.
      alert(`[CleanHome] Failed to load supplies: ${error.message}\n\nCheck the browser console for details.`);
      return;
    }
    setSupplies(data ?? []);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async function goHome() {
    await fetchRooms(); // always refresh before showing the list
    setSelectedRoomId(null);
    setScreen('home');
  }

  function goToRoom(roomId) {
    setSelectedRoomId(roomId);
    setScreen('room');
  }

  async function goToSupplies() {
    await fetchSupplies();
    setScreen('supplies');
  }

  // Called by RoomCodeScreen when the user enters their code
  function onCodeSet(code) {
    const normalized = code.trim().toUpperCase();
    localStorage.setItem(ROOM_CODE_KEY, normalized);
    setRoomCode(normalized);
    Promise.all([fetchRooms(normalized), fetchSupplies(normalized)]).then(() => {
      setScreen('home');
    });
  }

  // Clear the saved code and return to setup screen
  function changeCode() {
    localStorage.removeItem(ROOM_CODE_KEY);
    setRoomCode(null);
    setRooms([]);
    setSupplies([]);
    setScreen('setup');
  }

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    screen,
    selectedRoomId,
    roomCode,
    rooms,
    supplies,
    // navigation
    goHome,
    goToRoom,
    goToSupplies,
    onCodeSet,
    changeCode,
    // data refresh (used by screens after mutations)
    fetchRooms,
    fetchSupplies,
    // direct setters (used by screens for optimistic updates)
    setRooms,
    setSupplies,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
