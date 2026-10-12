# One Piece TCG Simulator (Solitaire Sandbox) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an in-app One Piece Card Game Solitaire/Playtest Simulator (`/sim`) that allows administrators to load and playtest any deck with full field zone management, turn flow, DON!! mechanics, life tracking, and card inspectors.

**Architecture:** A standalone, responsive web playmat component powered by a dedicated React/Zustand game session state store. The simulator reads decks directly from the existing deck system (`RecommendedDeck` / user decks), enforces zone limits (Leader, 5 Characters, Stage, Trash, Life, Cost/DON!!), and is gated behind an Admin Guard (`useSettings().isAdmin`).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Prisma (SQLite), Supabase (Auth/Admin verification).

---

### Task 1: Admin Guard & Route Scaffolding (`/sim`)

**Files:**
- Create: `src/app/sim/page.tsx`
- Modify: `src/middleware.ts`
- Modify: `src/app/decks/[id]/page.tsx`

**Step 1: Create the `/sim` page with Admin Access Guard**
- If user is not admin (`!isAdmin`), display a polished "Admiral Eyes Only - Private Beta" locked state with an explanation and button to return to `/decks`.
- If user is admin (`isAdmin`), render the deck selector or simulator view.
- Accept query parameter `?deckId=...` to automatically load a deck.

**Step 2: Add Admin Playtest Entrypoint on Deck Detail Page (`/decks/[id]`)**
- On `src/app/decks/[id]/page.tsx`, when `isAdmin` is true, render a prominent action button:
  `Playtest Simulator [Admin Preview]` leading to `/sim?deckId=${deck.id}`.

**Step 3: Verify Admin Route Access**
- Test with non-admin state -> displays locked beta card.
- Test with admin state (`kylesantos0411@gmail.com` / `@kaipuccino` / role `'admin'`) -> grants full simulator access.

**Step 4: Commit**
```bash
git add src/app/sim/page.tsx src/app/decks/[id]/page.tsx src/middleware.ts
git commit -m "feat(sim): add admin-gated simulator route and deck playtest entrypoint"
```

---

### Task 2: Game State Store & Engine Types (`src/lib/sim/sim-types.ts` & `src/lib/sim/sim-store.ts`)

**Files:**
- Create: `src/lib/sim/sim-types.ts`
- Create: `src/lib/sim/sim-engine.ts`

**Step 1: Define Engine Data Models (`src/lib/sim/sim-types.ts`)**
- `SimCard`:
  - `instanceId`: unique string (uuid / counter) to distinguish duplicates of the same card
  - `cardId`: official code (e.g. `OP01-024`)
  - `name`: string
  - `category`: 'Leader' | 'Character' | 'Event' | 'Stage'
  - `colors`: string[]
  - `cost`: number
  - `power`: number
  - `counter`: number | null
  - `imageUrl`: string
  - `effect`: string | null
  - `trigger`: string | null
  - `rested`: boolean
  - `attachedDon`: number
- `GameState`:
  - `leader`: SimCard | null
  - `deck`: SimCard[]
  - `hand`: SimCard[]
  - `characters`: SimCard[] (max 5)
  - `stage`: SimCard | null
  - `life`: SimCard[]
  - `trash`: SimCard[]
  - `donDeck`: number (starts at 10)
  - `costActiveDon`: number
  - `costRestedDon`: number
  - `turn`: number
  - `goingFirst`: boolean
  - `hasMulliganed`: boolean
  - `mulliganOffered`: boolean
  - `targetOpponentLife`: number (default 5)
  - `logs`: string[]

**Step 2: Implement Core Engine State Transitions (`src/lib/sim/sim-engine.ts`)**
- `initGame(deck: RecommendedDeck | DeckExport, goingFirst?: boolean)`:
  - Finds Leader -> assigns to `leader`
  - Expands 50 cards with unique `instanceId`
  - Shuffles deck using Fisher-Yates
  - Sets Life cards count based on Leader's base power/life (default 5 or 4)
  - Draws top 5 cards into Hand
  - Sets `donDeck` = 10, `costActiveDon` = 0, `costRestedDon` = 0
  - Prompts for Mulligan
- `mulligan()`:
  - Returns current 5 hand cards to deck, reshuffles, draws 5 new cards, marks `hasMulliganed = true`
- `startNextTurn()`:
  - Increments turn
  - **Refresh Phase:** Unrests Leader, all Characters, Stage; returns all attached DON!! back to Cost Area
  - **Draw Phase:** Draws 1 card from deck (skips on Turn 1 if going 1st)
  - **DON!! Phase:** Moves 2 DON!! (or 1 on Turn 1 if going 1st) from `donDeck` to `costActiveDon` (max 10 total)
- `playCardFromHand(instanceId, targetSlot?)`:
  - Validates active DON!! >= card cost
  - Rests DON!! equal to cost
  - Places Character into field (max 5) or Stage into stage slot, or discards Event to Trash
- `attachDon(targetInstanceId)`:
  - Checks `costActiveDon >= 1`
  - Decrements `costActiveDon`, increments card `attachedDon`
- `detachDon(targetInstanceId)`:
  - Decrements card `attachedDon`, increments `costActiveDon`
- `toggleRest(targetInstanceId)`:
  - Flips card `rested` boolean
- `takeLifeDamage()`:
  - Moves top card of `life` to `hand` (or returns it to prompt for Trigger)
- `sendToTrash(instanceId, fromZone)`:
  - Moves card from field/hand to Trash; any attached DON!! return to `costRestedDon`

**Step 3: Write Unit Tests for Engine Transitions**
- Create `tests/sim-engine.test.ts`
- Test initial deal, turn increment, mulligan, DON!! growth, card placement.

**Step 4: Commit**
```bash
git add src/lib/sim/sim-types.ts src/lib/sim/sim-engine.ts
git commit -m "feat(sim): implement core simulator game state machine and rules logic"
```

---

### Task 3: Interactive Responsive Playmat Component (`src/components/sim/SimPlaymat.tsx`)

**Files:**
- Create: `src/components/sim/SimPlaymat.tsx`
- Create: `src/components/sim/SimCardItem.tsx`
- Create: `src/components/sim/SimZoneArea.tsx`
- Create: `src/components/sim/SimHandTray.tsx`
- Create: `src/components/sim/SimPhaseBar.tsx`

**Step 1: Build Card Component (`src/components/sim/SimCardItem.tsx`)**
- Visual representation of card in active or rested state (90-degree rotation when rested with smooth CSS transition).
- Attached DON!! badge indicator (`+2000 (2 DON!!)`).
- Quick action menu on tap/click:
  - Tap: Toggle Active/Rested
  - Action: + Attach DON!! / - Detach DON!!
  - Action: Send to Trash (K.O.)
  - Action: Return to Hand
  - Action: Inspect (Full Card View)

**Step 2: Build Field Zones (`src/components/sim/SimZoneArea.tsx`)**
- **Opponent Goldfish Target:** Opponent Leader banner with Life counter (decrement/increment on attack).
- **Stage Zone:** 1 slot.
- **Leader Zone:** 1 slot with gold border.
- **Character Zone:** 5 horizontal slots (or flexible grid on mobile). Empty slots have dashed drop/tap targets.
- **Cost Area (DON!! Zone):** Clear visual piles for Active DON!! (gold glow) and Rested DON!! (dimmed).
- **Life Zone:** Stack of face-down cards with count badge. Tap to reveal / take damage.
- **Trash Zone:** Stack of discarded cards with counter. Tap to open Trash modal.
- **Deck Zone:** Remaining card count. Tap to draw a card anytime.

**Step 3: Build Hand Tray (`src/components/sim/SimHandTray.tsx`)**
- Bottom-docked horizontal scrollable card tray.
- Cards show cost, power, and counter value at a glance.
- Tap card in hand -> displays action sheet:
  - "Play to Field" (checks active DON!! cost)
  - "Use Counter (+1000/+2000) -> Trash"
  - "Discard to Trash"
  - "Inspect Card"

**Step 4: Build Phase & Turn Bar (`src/components/sim/SimPhaseBar.tsx`)**
- Header / floating control bar:
  - Turn indicator ("Turn 3 • 6 Active DON!!")
  - "Next Turn" one-click button (runs Refresh, Draw, and DON!! phases automatically)
  - "Reset / Restart Game" button
  - "Action Log" dropdown drawer (tracks plays, damage, DON!! spent)

**Step 5: Commit**
```bash
git add src/components/sim/
git commit -m "feat(sim): create responsive playmat UI with zone layout and hand tray"
```

---

### Task 4: Card Inspector, Mulligan Modal & Trash Viewer

**Files:**
- Create: `src/components/sim/SimCardInspectorModal.tsx`
- Create: `src/components/sim/SimMulliganModal.tsx`
- Create: `src/components/sim/SimPileViewerModal.tsx`

**Step 1: Mulligan Modal**
- Shown on game start: displays 5 drawn cards.
- Choice: "Keep Hand" or "Mulligan (Draw 5 new cards)".

**Step 2: Card Inspector Modal**
- Tap/hover any card to see full-screen high-resolution art, full effect text, triggers, attributes, and calculated current power (base power + DON!! * 1000).

**Step 3: Pile Viewer Modal (Trash & Scry/Search)**
- Tap Trash or trigger "Search Deck" -> modal displaying grid of cards in the pile with search/filter.

**Step 4: Commit**
```bash
git add src/components/sim/SimCardInspectorModal.tsx src/components/sim/SimMulliganModal.tsx src/components/sim/SimPileViewerModal.tsx
git commit -m "feat(sim): add card inspector, mulligan dialog, and trash pile viewer"
```

---

### Task 5: Integration, Deck Selector & Verification

**Files:**
- Modify: `src/app/sim/page.tsx`
- Modify: `src/app/decks/[id]/page.tsx`

**Step 1: Wire Up Deck Selection in `/sim`**
- If no `deckId` provided, show quick-select grid of popular recommended decks (e.g. Zoro, Whitebeard, Law, Katakuri, Doflamingo) or custom user decks.
- Clicking any deck loads the full 50-card list + Leader + 10 DON!! into the simulator.

**Step 2: Admin Access Lock Verification**
- Log in as non-admin / incognito -> Verify `/sim` shows Admin Locked banner.
- Log in as admin (`kylesantos0411@gmail.com` / `kaipuccino`) -> Full playmat loads instantly.

**Step 3: Build & Lint Verification**
- Run `npm run build` to verify 0 type errors across all new simulator files.

**Step 4: Commit & Push**
```bash
git add .
git commit -m "feat(sim): finalize simulator integration with deck loaders and admin permissions"
git push origin master
```

---

## Execution Choice
Plan complete and saved to `docs/plans/2026-10-12-tcg-simulator-sandbox.md`.
Shall we proceed with Task 1 (scaffolding the admin-locked route and playtest entrypoints)?
