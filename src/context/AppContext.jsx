import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HOUSEHOLD_CODE_KEY } from '../lib/constants';

const AppContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// AppProvider
//
// State-based navigation: no URL router, no browser history, no caching layer.
// "currentScreen" is just a React state variable. Switching screens is a
// function call. Re-fetching data before showing a screen is trivial — just
// await the fetch, then set the screen. This eliminates every navigation/
// caching bug that plagued the Next.js version.
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // Screens: 'loading' | 'household' | 'home' | 'room' | 'supplies'
  const [screen, setScreen]               = useState('loading');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [household, setHousehold]         = useState(null);
  const [rooms, setRooms]                 = useState([]);
  const [supplies, setSupplies]           = useState([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem(HOUSEHOLD_CODE_KEY);
    if (savedId) {
      initHousehold(savedId);
    } else {
      setScreen('household');
    }
  }, []); // runs once on app start

  async function initHousehold(id) {
    const { data, error } = await supabase
      .from('clean_home_households')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[CleanHome] initHousehold:', error);
      localStorage.removeItem(HOUSEHOLD_CODE_KEY);
      setScreen('household');
      return;
    }

    setHousehold(data);
    await Promise.all([fetchRooms(data.id), fetchSupplies(data.id)]);
    setScreen('home');
  }

  // ── Data fetchers ──────────────────────────────────────────────────────────

  async function fetchRooms(householdId) {
    const id = householdId ?? household?.id;
    if (!id) return;
    const { data, error } = await supabase
      .from('clean_home_rooms')
      .select()
      .eq('household_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at',  { ascending: true });
    if (error) console.error('[CleanHome] fetchRooms:', error);
    setRooms(data ?? []);
  }

  async function fetchSupplies(householdId) {
    const id = householdId ?? household?.id;
    if (!id) return;
    const { data, error } = await supabase
      .from('clean_home_supply_tags')
      .select()
      .eq('household_id', id)
      .order('name_en');
    if (error) console.error('[CleanHome] fetchSupplies:', error);
    setSupplies(data ?? []);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  // Each navigation function fetches fresh data FIRST, then switches the
  // screen. There is no cache to bust — state is always authoritative.

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

  // Called by HouseholdModal after a successful create or join
  function onHouseholdSet(hh) {
    localStorage.setItem(HOUSEHOLD_CODE_KEY, hh.id);
    setHousehold(hh);
    // Kick off background loads then show home
    Promise.all([fetchRooms(hh.id), fetchSupplies(hh.id)]).then(() => {
      setScreen('home');
    });
  }

  function switchHousehold() {
    localStorage.removeItem(HOUSEHOLD_CODE_KEY);
    setHousehold(null);
    setRooms([]);
    setSupplies([]);
    setScreen('household');
  }

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    screen,
    selectedRoomId,
    household,
    rooms,
    supplies,
    // navigation
    goHome,
    goToRoom,
    goToSupplies,
    onHouseholdSet,
    switchHousehold,
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
