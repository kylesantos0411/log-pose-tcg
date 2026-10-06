Implement a new feature in the existing application that allows users to quickly select one or multiple cards from the existing card listing and add them directly to their Collection.

IMPORTANT:
THIS MUST BE AN ADDITIVE FEATURE ONLY.

Do NOT redesign, restructure, refactor, replace, or modify the existing application's current system, navigation, workflow, database logic, scraping logic, pricing logic, card data logic, or visual design.

The existing application must continue working exactly as it currently does.

The goal is to ADD this feature on top of the existing application, not to redesign any existing functionality.

==================================================
1. DO NOT CHANGE THE EXISTING APPLICATION
==================================================

Do NOT change:

- Existing application flow
- Existing navigation
- Existing page structure
- Existing card listing layout
- Existing card design
- Existing colors
- Existing fonts
- Existing typography
- Existing spacing
- Existing buttons
- Existing card images
- Existing card details page
- Existing filtering
- Existing sorting
- Existing search
- Existing pricing system
- Existing pricing sources
- Existing scraping system
- Existing card database
- Existing Collection system
- Existing authentication
- Existing API structure unless absolutely necessary
- Existing database structure unless absolutely necessary
- Existing mobile layout
- Existing desktop layout

Do not introduce unrelated improvements.

Do not perform unrelated refactoring.

Do not replace existing components just because they could be implemented differently.

Use the existing architecture and components wherever possible.

Only modify the minimum files/components necessary to implement this feature.

==================================================
2. FEATURE OBJECTIVE
==================================================

Add a quick selection system to the existing card listing.

The intended flow is:

EXISTING CARD LIST
        ↓
SELECT CARD(S)
        ↓
SELECTED CARDS BECOME FOCUSED
        ↓
ADD TO COLLECTION
        ↓
EXISTING COLLECTION SYSTEM

The user should not need to open every card individually just to add it to their Collection.

The user should be able to select cards directly from the existing card grid/list.

==================================================
3. EXISTING CARD INFORMATION MUST REMAIN
==================================================

The current card listing already displays information such as:

- Card image
- Card code
- Card price

For example:

EB04-017
₱19.57

Keep all of this exactly as it currently appears.

Do NOT redesign the card component.

Do NOT move the card code.

Do NOT move the price.

Do NOT change the price formatting.

Do NOT replace the existing card image.

Do NOT change the existing card information hierarchy.

The new selection functionality should be integrated into the existing card component with minimal visual impact.

==================================================
4. CARD SELECTION
==================================================

Allow the user to select cards directly from the existing card listing.

The user must be able to:

- Select one card
- Select multiple cards
- Deselect a selected card
- Select and deselect cards in any order

Add a small selection control/indicator to each card.

The selection control must:

- Be easy to tap/click
- Be visually consistent with the existing application
- Not cover important card information
- Not significantly increase the card size
- Not interfere with the existing card image
- Not interfere with the card code
- Not interfere with the price

The selection control should clearly indicate whether the card is selected.

==================================================
5. PRESERVE EXISTING CARD CLICK BEHAVIOR
==================================================

IMPORTANT:

Do NOT break the existing card interaction.

If clicking/tapping the card currently opens the card details page, that behavior must remain unchanged.

The selection control should have its own interaction.

For example:

Normal card area:
→ Existing card-details behavior

Selection control:
→ Select/deselect card

Do not change the existing navigation behavior simply to implement selection.

==================================================
6. FOCUS / DIMMING EFFECT
==================================================

When the user selects a card, introduce a temporary visual focus effect.

The selected card should become more visually prominent.

At the same time, the unselected cards should become slightly dimmed/darkened.

Example:

BEFORE SELECTION:

[ CARD ] [ CARD ] [ CARD ]
[ CARD ] [ CARD ] [ CARD ]

All cards appear normally.

AFTER SELECTING ONE:

[ DIM ] [ SELECTED / BRIGHT ] [ DIM ]
[ DIM ] [ DIM ] [ DIM ]

The selected card should:

- Appear brighter/more prominent
- Have a clear selected state
- Remain completely readable
- Keep its existing image
- Keep its existing card code
- Keep its existing price
- Keep its existing information

The unselected cards should:

- Become slightly darker/dimmed
- Still remain visible
- Still remain readable
- Still be interactive
- Still be selectable

Do NOT completely hide the unselected cards.

Do NOT blur the unselected cards.

Do NOT make them excessively dark.

Do NOT change the application's color palette.

The dimming effect should be subtle and polished.

==================================================
7. MULTIPLE SELECTED CARDS
==================================================

If multiple cards are selected, ALL selected cards should remain visually focused.

Example:

[ SELECTED ] [ DIM ] [ SELECTED ]
[ DIM ] [ SELECTED ] [ DIM ]

Selected cards:
→ Bright/focused

Unselected cards:
→ Slightly dimmed

The user must still be able to select or deselect any card while this state is active.

The dimming effect must never prevent interaction with unselected cards.

==================================================
8. RETURN TO NORMAL STATE
==================================================

When there are no selected cards:

- All cards return to their normal appearance.
- Remove the dimming effect.
- Remove the focus state.
- Remove the selection indicators.

If the user deselects the last selected card, immediately restore the normal card-grid appearance.

The focus/dimming effect must be temporary.

Do not permanently modify card styling.

==================================================
9. TRANSITION / ANIMATION
==================================================

If the existing UI framework naturally supports transitions, use a short and subtle transition.

For example:

Selected:
Normal → Focused

Unselected:
Normal → Slightly Dimmed

Deselect:
Focused → Normal

Keep the transition fast and subtle.

Do NOT introduce a new animation library just for this feature.

Do NOT create excessive animations.

The application should still feel fast and responsive.

==================================================
10. ADD TO COLLECTION ACTION
==================================================

When at least one card is selected, provide an action:

"Add to Collection"

This action should only appear or become active when one or more cards are selected.

The action should follow the application's existing UI style.

Do not introduce a completely new button design system.

The user should be able to select multiple cards and add them to Collection in one action.

Example:

User selects:

EB04-017
EB04-018
EB04-019
EB04-020

Then taps:

"Add to Collection"

All four cards should be added using the existing Collection system.

==================================================
11. USE THE EXISTING COLLECTION SYSTEM
==================================================

IMPORTANT:

Do NOT create a second Collection system.

Do NOT create a separate collection database.

Do NOT create duplicate card models.

Use the application's existing Collection functionality.

The new feature should simply provide another way to add cards to the existing Collection.

If the application already has a function/service/API for adding a card to Collection, reuse it.

If the application already has a Collection state/store, reuse it.

If the application already has a Collection database/table, reuse it.

Do not create a replacement.

==================================================
12. USE EXISTING CARD IDENTIFIERS
==================================================

When adding a card to Collection, use the existing card's unique identifier.

Prefer the application's existing:

- Card ID
- Database ID
- Card code
- Existing unique identifier

Do NOT identify cards only by:

- Card name
- Image
- Price

Do NOT create a new card record simply because the user selected the card.

The selected card should reference the existing card record.

For example:

Existing card:

EB04-017

If the database already contains EB04-017, use that existing record.

Do not create another EB04-017 record.

==================================================
13. PRESERVE CARD DATA
==================================================

When adding the card to Collection, preserve the existing card information.

At minimum, use the existing data for:

- Card ID
- Card code
- Card name
- Card image
- Set
- Existing card metadata
- Existing pricing information where applicable

Do NOT scrape the card again.

Do NOT make another external request simply because the user selected the card.

Use the card information already loaded by the current card listing.

==================================================
14. PRICE HANDLING
==================================================

The current application already has its own pricing system.

DO NOT change it.

DO NOT add another pricing source.

DO NOT recalculate prices.

DO NOT replace the current price.

DO NOT modify the existing price logic.

If the card currently displays:

EB04-017
₱19.57

keep it exactly as the application currently displays it.

The new selection feature should simply preserve and carry the existing card data.

==================================================
15. DUPLICATE / EXISTING COLLECTION HANDLING
==================================================

Before adding cards, respect the application's existing Collection behavior.

If a selected card already exists in the user's Collection:

- Do not accidentally create duplicate database records.
- Follow the application's existing quantity/duplicate logic.

If the Collection supports quantity:

Use the existing quantity mechanism.

If the Collection already handles duplicates in another way:

Follow that existing behavior.

Do NOT invent a completely new duplicate-handling system unless the current application has no logic for it.

==================================================
16. MULTI-SELECT OPERATION
==================================================

The feature should support adding multiple cards efficiently.

Example:

Selected cards:

EB04-017
EB04-018
EB04-019
EB04-020
EB04-021

User presses:

"Add to Collection"

The system should process the selected cards efficiently.

If the existing backend supports batch operations, use the existing architecture to perform a batch operation.

Do not make unnecessary individual requests if the existing system already supports a safe batch approach.

However:

Do NOT introduce a new backend architecture just for this feature.

Use the smallest implementation compatible with the existing system.

==================================================
17. SUCCESS FEEDBACK
==================================================

After successful addition, provide a small confirmation.

Examples:

"1 card added to Collection"

or:

"5 cards added to Collection"

The confirmation should be subtle and consistent with the existing application.

Do not create a completely new notification system.

After successful addition:

- Clear the temporary selection state.
- Restore all cards to normal appearance.
- Remove the dimming effect.
- Keep the user on the current card-listing page.

Do NOT automatically force navigation to Collection.

Optionally, if the existing UI supports it naturally, provide:

"View Collection"

But do not change the existing navigation structure.

==================================================
18. ERROR HANDLING
==================================================

If adding cards fails:

- Do not falsely report success.
- Keep the selected cards selected.
- Keep the focus/dimming state active.
- Show an appropriate error message.
- Allow the user to retry.

If the system supports partial success:

Clearly handle which cards were successfully added and which failed.

Do not create duplicate records during retries.

Follow the application's existing error-handling conventions.

==================================================
19. MOBILE USABILITY
==================================================

The feature must work properly on mobile.

The selection control must be:

- Easy to tap
- Large enough for reliable touch interaction
- Not too small
- Not overlapping important information
- Not covering the card code
- Not covering the price
- Not interfering with card navigation

The focus/dimming effect must also work correctly on mobile.

The selected card must remain clearly visible.

The user must still be able to select additional cards while selection mode is active.

Do NOT redesign the mobile layout.

==================================================
20. DESKTOP USABILITY
==================================================

The feature must also work correctly on desktop.

Mouse interaction should allow:

- Select
- Deselect
- Multiple selection
- Add to Collection

Do not change the existing desktop card-grid layout.

==================================================
21. SELECTION STATE
==================================================

Selection state should be temporary UI state.

It should not permanently modify the card database.

It should not modify card pricing.

It should not modify the card itself.

After successful addition to Collection:

- Clear selected cards.
- Restore normal card appearance.
- Remove dimming.
- Remove focus state.

If the operation fails:

- Keep selection state.
- Allow retry.

Use the application's existing state-management approach.

Do NOT introduce another state-management library unless absolutely necessary.

==================================================
22. PERFORMANCE
==================================================

Use the card data already loaded on the page.

Do not repeatedly retrieve the same card information.

Do not scrape the card again.

Do not request pricing again.

Do not request card images again.

Do not create unnecessary API calls.

For multiple cards, use the existing application's most efficient safe approach.

==================================================
23. DATA INTEGRITY
==================================================

The selected card must always correspond to the correct existing database card.

Do not accidentally add:

- Wrong card
- Wrong set
- Wrong card code
- Wrong image
- Wrong price
- Wrong database record

The selection must use the exact card object/data already being rendered by the existing card listing.

==================================================
24. DO NOT ALTER EXISTING SCRAPING
==================================================

This feature is NOT a scraping feature.

Do NOT modify:

- LimitlessTCG scraping
- Yuyutei scraping
- SNKRDUNK scraping
- Illustrator/artist sourcing
- Card image sourcing
- Set detection
- Card-code mapping
- Pricing collection
- Grading price sourcing
- Any existing card data acquisition logic

The feature only consumes the existing card data.

==================================================
25. DO NOT ALTER EXISTING DATABASE STRUCTURE
==================================================

Before making database changes, inspect whether the current Collection system already has everything needed.

If existing fields can support this feature:

USE THEM.

Do not create new tables or restructure the database unnecessarily.

Only add a database field or migration if it is genuinely required.

If a database change is required, make it minimal and backwards-compatible.

==================================================
26. DO NOT ALTER EXISTING NAVIGATION
==================================================

The existing application navigation must remain exactly the same.

Do not:

- Add a new page unnecessarily
- Move Collection
- Rename Collection
- Change menus
- Change tabs
- Change routes
- Change existing card-detail navigation

This feature should operate directly within the existing card listing.

==================================================
27. IMPLEMENTATION PROCESS
==================================================

Before writing code, inspect the existing application.

Identify:

1. Existing card-list component
2. Existing card component
3. Existing card database/model
4. Existing card unique identifier
5. Existing Collection component
6. Existing Collection service/API
7. Existing Collection database/model
8. Existing state-management approach
9. Existing navigation
10. Existing styling/design system

Then determine the smallest possible implementation.

Do not make assumptions.

Do not rewrite working code.

Do not refactor unrelated code.

Only modify the components/services required for this feature.

==================================================
28. VISUAL REQUIREMENT
==================================================

The final result should look like an extension of the existing application.

The attached screenshot represents the existing card-listing appearance.

Preserve its current visual identity.

The only noticeable additions should be:

- Selection control
- Selected-card visual state
- Dimming of unselected cards when selection is active
- Add to Collection action
- Small success/error feedback

Everything else should remain visually unchanged.

==================================================
29. EXAMPLE USER FLOW
==================================================

Initial state:

User opens the existing card list.

All cards appear normally.

User selects:

EB04-017

Result:

EB04-017 becomes focused/brighter.

All other cards become slightly dimmed.

User selects:

EB04-018

Result:

EB04-017 → focused
EB04-018 → focused
All other cards → slightly dimmed

User selects:

EB04-019

Result:

EB04-017 → focused
EB04-018 → focused
EB04-019 → focused
All other cards → slightly dimmed

User presses:

"Add to Collection"

System adds all three cards using the existing Collection system.

Then:

- Show "3 cards added to Collection"
- Clear selection
- Restore all cards to normal appearance
- Remove dimming
- Keep user on the current card-list page

==================================================
30. TESTING REQUIREMENTS
==================================================

After implementation, test all of the following.

TEST 1:
Select one card.

Expected:
Card becomes focused.
Other cards become slightly dimmed.

TEST 2:
Select multiple cards.

Expected:
All selected cards remain focused.
All unselected cards remain dimmed.

TEST 3:
Deselect a selected card.

Expected:
That card returns to normal/dimmed state depending on whether other cards remain selected.

TEST 4:
Deselect the final selected card.

Expected:
All cards return to their normal appearance.

TEST 5:
Select one card → Add to Collection.

Expected:
Correct existing card appears in Collection.

TEST 6:
Select multiple cards → Add to Collection.

Expected:
All selected cards are added correctly.

TEST 7:
Add a card that already exists in Collection.

Expected:
Existing duplicate/quantity behavior is preserved.

TEST 8:
Click/tap the normal card area.

Expected:
Existing card-details behavior still works.

TEST 9:
Click/tap the selection control.

Expected:
Only selection behavior occurs.

TEST 10:
Fail the Collection request.

Expected:
Selection remains active.
Cards remain selected.
Error is shown.
User can retry.

TEST 11:
Use the feature on mobile.

Expected:
Selection controls are easy to tap.
No important information is covered.
Dimming works correctly.

TEST 12:
Use the feature on desktop.

Expected:
Mouse interaction works correctly.
Existing card layout remains unchanged.

TEST 13:
Verify existing card prices.

Expected:
No pricing logic or displayed prices were changed.

TEST 14:
Verify existing card data.

Expected:
No card codes, images, sets, or metadata were changed.

TEST 15:
Verify existing scraping.

Expected:
No scraping behavior was modified.

==================================================
31. FINAL DEVELOPMENT RULE
==================================================

THIS IS A FEATURE ADDITION, NOT A REDESIGN.

The implementation should be as minimally invasive as possible.

Do not "improve" unrelated parts of the application.

Do not clean up unrelated code.

Do not refactor unrelated components.

Do not change existing designs.

Do not change existing workflows.

Do not change existing pricing.

Do not change existing scraping.

Do not change existing Collection behavior.

Only add:

1. Card selection
2. Multi-selection
3. Selected-card focus effect
4. Unselected-card dimming effect
5. Add to Collection action
6. Appropriate success/error feedback

Everything else must remain unchanged.

Before implementation, inspect the current codebase and identify exactly which existing components/files need to be touched.

After implementation, provide a concise summary of:
- Files modified
- What was added
- Why each file was modified
- Confirmation that existing application flow/design/scraping/pricing were not changed
- Tests performed
- Any issues discovered

Do not implement anything outside the scope of this feature.