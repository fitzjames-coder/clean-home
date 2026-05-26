import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ROOM_CODE_KEY } from '../lib/constants';

const AppContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// AppProvider
//
// Screens: 'loading' | 'setup' | 'home' | 'room' | 'appliances' |
//          'appliance' | 'add-appliance' | 'supplies'
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [screen,              setScreen]              = useState('loading');
  const [selectedRoomId,      setSelectedRoomId]      = useState(null);
  const [selectedApplianceId, setSelectedApplianceId] = useState(null);
  const [roomCode,            setRoomCode]            = useState(null);
  const [rooms,               setRooms]               = useState([]);
  const [appliances,          setAppliances]          = useState([]);
  const [supplies,            setSupplies]            = useState([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_CODE_KEY);
    if (saved) {
      setRoomCode(saved);
      Promise.all([
        fetchRooms(saved),
        fetchAppliances(saved),
        fetchSupplies(saved),
      ]).then(() => setScreen('home'));
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
      alert(`[CleanHome] Failed to load rooms: ${error.message}\n\nCheck the browser console for details.`);
      return;
    }

    const rooms = data ?? [];

    if (rooms.length > 0) {
      const roomIds = rooms.map(r => r.id);
      const { data: toolData, error: toolErr } = await supabase
        .from('clean_home_tools')
        .select('id, room_id, tool_type, is_active, last_completed, frequency')
        .in('room_id', roomIds);

      if (toolErr) {
        console.error('[CleanHome] fetchRooms (tools):', toolErr);
      } else {
        const toolsByRoom = {};
        for (const tool of toolData ?? []) {
          (toolsByRoom[tool.room_id] ??= []).push(tool);
        }
        for (const room of rooms) {
          room.tools = toolsByRoom[room.id] ?? [];
        }
      }
    }

    setRooms(rooms);
  }

  async function fetchAppliances(code) {
    const c = code ?? roomCode;
    if (!c) return;
    const { data, error } = await supabase
      .from('clean_home_appliances')
      .select()
      .eq('room_code', c)
      .order('sort_order', { ascending: true })
      .order('created_at',  { ascending: true });
    if (error) {
      console.error('[CleanHome] fetchAppliances:', error);
      alert(`[CleanHome] Failed to load appliances: ${error.message}\n\nCheck the browser console for details.`);
      return;
    }

    const rows = data ?? [];

    // Bulk-fetch linked supply tags for all appliances
    if (rows.length > 0) {
      const appIds = rows.map(a => a.id);
      const { data: linkData, error: linkErr } = await supabase
        .from('clean_home_appliance_supplies')
        .select('*, supply_tag:clean_home_supply_tags(*)')
        .in('appliance_id', appIds);

      if (linkErr) {
        console.error('[CleanHome] fetchAppliances (supplies):', linkErr);
      } else {
        const byApp = {};
        for (const link of linkData ?? []) {
          (byApp[link.appliance_id] ??= []).push(link);
        }
        for (const row of rows) {
          row.linked_supplies = byApp[row.id] ?? [];
        }
      }
    } else {
      for (const row of rows) row.linked_supplies = [];
    }

    setAppliances(rows);
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
      alert(`[CleanHome] Failed to load supplies: ${error.message}\n\nCheck the browser console for details.`);
      return;
    }
    setSupplies(data ?? []);
  }

  async function fetchToolHistory(toolId) {
    const { data, error } = await supabase
      .from('clean_home_tool_completions')
      .select('completed_at')
      .eq('tool_id', toolId)
      .order('completed_at', { ascending: false })
      .limit(5);
    if (error) {
      console.error('[CleanHome] fetchToolHistory:', error);
      return [];
    }
    return (data ?? []).map(r => r.completed_at);
  }

  async function fetchApplianceHistory(applianceId) {
    const { data, error } = await supabase
      .from('clean_home_appliance_completions')
      .select('completed_at')
      .eq('appliance_id', applianceId)
      .order('completed_at', { ascending: false })
      .limit(3);
    if (error) {
      console.error('[CleanHome] fetchApplianceHistory:', error);
      return [];
    }
    return (data ?? []).map(r => r.completed_at);
  }

  // ── Appliance mutations ───────────────────────────────────────────────────

  function addAppliance(appliance) {
    setAppliances(prev => [...prev, { ...appliance, linked_supplies: [] }]);
  }

  function updateAppliance(id, updates) {
    setAppliances(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  function deleteAppliance(id) {
    setAppliances(prev => prev.filter(a => a.id !== id));
  }

  async function markApplianceDone(id) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('clean_home_appliances')
      .update({ last_completed: now })
      .eq('id', id);
    if (error) {
      console.error('[CleanHome] markApplianceDone:', error);
      alert(`Failed to mark appliance done: ${error.message}`);
      return null;
    }
    updateAppliance(id, { last_completed: now });
    // Write completion history row
    await supabase.from('clean_home_appliance_completions').insert({
      appliance_id: id,
      completed_at: now,
    });
    return now;
  }

  async function undoApplianceCompletion(id, previousValue) {
    // Delete the most recent history row (guard: only if rows exist)
    const { data: rows } = await supabase
      .from('clean_home_appliance_completions')
      .select('id')
      .eq('appliance_id', id)
      .order('completed_at', { ascending: false })
      .limit(1);
    if (rows?.length > 0) {
      await supabase.from('clean_home_appliance_completions').delete().eq('id', rows[0].id);
    }
    // Revert last_completed
    const { error } = await supabase
      .from('clean_home_appliances')
      .update({ last_completed: previousValue })
      .eq('id', id);
    if (error) {
      console.error('[CleanHome] undoApplianceCompletion:', error);
      alert(`Failed to undo completion: ${error.message}`);
      return;
    }
    updateAppliance(id, { last_completed: previousValue });
  }

  async function addApplianceSupply(applianceId, supplyTagId) {
    const { data, error } = await supabase
      .from('clean_home_appliance_supplies')
      .insert({ appliance_id: applianceId, supply_tag_id: supplyTagId })
      .select('*, supply_tag:clean_home_supply_tags(*)')
      .single();
    if (error) {
      console.error('[CleanHome] addApplianceSupply:', error);
      alert(`Failed to link supply: ${error.message}`);
      return;
    }
    setAppliances(prev => prev.map(a =>
      a.id === applianceId
        ? { ...a, linked_supplies: [...(a.linked_supplies ?? []), data] }
        : a
    ));
  }

  async function removeApplianceSupply(applianceId, linkId) {
    const { error } = await supabase
      .from('clean_home_appliance_supplies')
      .delete()
      .eq('id', linkId);
    if (error) {
      console.error('[CleanHome] removeApplianceSupply:', error);
      alert(`Failed to remove supply: ${error.message}`);
      return;
    }
    setAppliances(prev => prev.map(a =>
      a.id === applianceId
        ? { ...a, linked_supplies: (a.linked_supplies ?? []).filter(ls => ls.id !== linkId) }
        : a
    ));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async function goHome() {
    await fetchRooms();
    setSelectedRoomId(null);
    setScreen('home');
  }

  function goToRoom(roomId) {
    setSelectedRoomId(roomId);
    setScreen('room');
  }

  async function goToAppliances() {
    await fetchAppliances();
    setSelectedApplianceId(null);
    setScreen('appliances');
  }

  function goToAppliance(applianceId) {
    setSelectedApplianceId(applianceId);
    setScreen('appliance');
  }

  function goToAddAppliance() {
    setScreen('add-appliance');
  }

  async function goToSupplies() {
    await fetchSupplies();
    setScreen('supplies');
  }

  function onCodeSet(code) {
    const normalized = code.trim().toUpperCase();
    localStorage.setItem(ROOM_CODE_KEY, normalized);
    setRoomCode(normalized);
    Promise.all([
      fetchRooms(normalized),
      fetchAppliances(normalized),
      fetchSupplies(normalized),
    ]).then(() => setScreen('home'));
  }

  function changeCode() {
    localStorage.removeItem(ROOM_CODE_KEY);
    setRoomCode(null);
    setRooms([]);
    setAppliances([]);
    setSupplies([]);
    setScreen('setup');
  }

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    screen,
    selectedRoomId,
    selectedApplianceId,
    roomCode,
    rooms,
    appliances,
    supplies,
    // navigation
    goHome,
    goToRoom,
    goToAppliances,
    goToAppliance,
    goToAddAppliance,
    goToSupplies,
    onCodeSet,
    changeCode,
    // data refresh
    fetchRooms,
    fetchAppliances,
    fetchSupplies,
    // direct setters (optimistic updates)
    setRooms,
    setAppliances,
    setSupplies,
    // appliance mutations
    addAppliance,
    updateAppliance,
    deleteAppliance,
    markApplianceDone,
    undoApplianceCompletion,
    addApplianceSupply,
    removeApplianceSupply,
    // tool history
    fetchToolHistory,
    // appliance history
    fetchApplianceHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
