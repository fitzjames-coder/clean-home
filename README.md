# 🏠 Clean Home

A modern home cleaning tracker built with **Next.js 15**, **Supabase**, and **Tailwind CSS**.
Track cleaning tasks for every room, coordinate with household members, and manage supplies — all in one place.

---

## ✨ Features

### 🏡 Household System
- **Create** a household with a unique 6-character code
- **Join** an existing household using a share code
- Shared sync: all members see the same rooms, tools, and supplies

### 🛋️ Home Screen
- List of rooms with icons, last-cleaned status, and remarks preview
- Delete confirmation flow for rooms
- One-tap to open Room Detail
- FAB to add rooms or manage supplies

### 🧹 Room Detail Screen
- **5 cleaning tools** per room: Duster 🪣, Broom 🧹, Mop 🫧, Vacuum 🌀, Bot 🤖
- **All tools active by default** — toggle any off individually
- **Last completed timestamp** stored from day one
- Tap tool emoji to **mark as cleaned**
- **Frequency settings**: D (daily) / W (weekly) / 2W (bi-weekly) / 2+W (occasional)
- Due indicator: amber when overdue, green when on track
- **Instruction box** per tool (auto-saves on blur)
- **Supply tag linking** — tag supplies to a room via any tool card
- **Remarks panel** — free-form notes per room (auto-saves)

### 🧴 Supply Tags Screen
- Add supplies with **photo upload** (stored in Supabase Storage)
- **English name** (required) + **German name** (optional)
- Edit or delete any supply
- Link supplies to rooms from within the Room Detail screen

### 🎨 Design
- Bright blue `#2B7FFF` + teal/green `#2ECC8F` palette
- Soft rounded corners, card-based UI
- Mobile-first, max-width `md` centered layout

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/fitzjames-coder/clean-home.git
cd clean-home
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor
3. *(Optional)* Create a Storage bucket named `clean-home-photos` with public access for photo uploads
4. Copy your Project URL and Anon Key

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `clean_home_households` | Household with join code |
| `clean_home_rooms` | Rooms belonging to a household |
| `clean_home_tools` | 5 tools per room with timestamps & frequency |
| `clean_home_supply_tags` | Supply items with bilingual names & photo |
| `clean_home_room_supplies` | Many-to-many: rooms ↔ supplies |

---

## 🏗️ Tech Stack

- **[Next.js 15](https://nextjs.org/)** — App Router, React Server/Client Components
- **[Supabase](https://supabase.com/)** — PostgreSQL database + Storage
- **[Tailwind CSS 3](https://tailwindcss.com/)** — Utility-first styling
- **[Lucide React](https://lucide.dev/)** — Icons
- **[date-fns](https://date-fns.org/)** — Date formatting

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home Screen (rooms list)
│   ├── globals.css         # Global styles + Tailwind
│   ├── room/[id]/
│   │   └── page.tsx        # Room Detail Screen
│   └── supplies/
│       └── page.tsx        # Supply Tags Screen
├── components/
│   ├── AddRoomModal.tsx    # Add room sheet
│   ├── FrequencySelector.tsx # D/W/2W/2+W picker
│   ├── HouseholdModal.tsx  # Create/join household sheet
│   ├── RoomIconPicker.tsx  # 10-icon grid picker
│   ├── SupplyTagCard.tsx   # Supply item (view + inline edit)
│   └── ToolCard.tsx        # Tool row with expand/collapse
└── lib/
    ├── constants.ts        # Room icons, tool meta, frequency labels
    ├── database.types.ts   # TypeScript interfaces
    ├── supabase.ts         # Supabase client
    └── utils.ts            # Date helpers, due-status logic
```

---

## 🔑 Room Icons

Bedroom 🛏️ · Bathroom 🚿 · Kids' Room 🧸 · Kitchen 🍳 · Hallway 🚪
Living Room 🛋️ · Dining Room 🪑 · Home Office 💻 · Garage 🚗 · Garden 🌱