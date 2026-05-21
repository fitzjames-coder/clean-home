export type ToolType = 'duster' | 'broom' | 'mop' | 'vacuum' | 'bot';
export type Frequency = 'D' | 'W' | '2W' | '2+W';
export type RoomIcon =
  | 'bedroom'
  | 'bathroom'
  | 'kids-room'
  | 'kitchen'
  | 'hallway'
  | 'living-room'
  | 'dining-room'
  | 'home-office'
  | 'garage'
  | 'garden';

export interface Household {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Room {
  id: string;
  household_id: string;
  name: string;
  icon: RoomIcon;
  remarks: string;
  sort_order: number;
  created_at: string;
}

export interface Tool {
  id: string;
  room_id: string;
  tool_type: ToolType;
  /** Human-readable name stored in the DB: "Duster" | "Broom" | "Mop" | "Vacuum" | "Bot" */
  tool_name: string;
  is_active: boolean;
  last_completed: string | null;
  frequency: Frequency;
  instructions: string;
  created_at: string;
}

export interface SupplyTag {
  id: string;
  household_id: string;
  name_en: string;
  name_de: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface RoomSupply {
  id: string;
  room_id: string;
  supply_tag_id: string;
  created_at: string;
}

export interface RoomWithTools extends Room {
  tools: Tool[];
  supplies: (RoomSupply & { supply_tag: SupplyTag })[];
}
