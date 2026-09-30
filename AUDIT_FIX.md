Now use the COMPLETE CARD DATA AUDIT you just performed to fix the problems you found.

This is now an IMPLEMENTATION TASK.

Your goal is to make the card database and scraping pipeline reliable, consistent, non-duplicated, and accurate.

The priority is:

1. Correct card identity
2. Complete Japanese card coverage
3. Correct card/set/image matching
4. Correct Yuyutei price matching
5. Correct handling of unavailable cards
6. Correct other pricing sources
7. Database consistency
8. Removal of redundant/irrelevant logic
9. Reliable update/scraping behavior
10. Clean and maintainable implementation

Do NOT redesign the entire application unnecessarily.

Preserve existing working features and UI unless a change is required to fix a confirmed problem.

==================================================
1. USE THE AUDIT AS THE SOURCE OF TRUTH
==================================================

Review the audit you just produced.

For every issue you identified, classify it as:

A. CONFIRMED BUG
B. REDUNDANT LOGIC
C. IRRELEVANT/UNUSED LOGIC
D. DATA INTEGRITY PROBLEM
E. PERFORMANCE PROBLEM
F. POTENTIAL BUG REQUIRING SAFE VALIDATION

Fix confirmed issues.

Remove redundant or irrelevant logic only after verifying that it is genuinely unused or duplicated.

Do not remove functionality simply because it looks unfamiliar or unnecessary.

Do not make assumptions.

==================================================
2. DO NOT BLINDLY REWRITE THE APPLICATION
==================================================

Before changing anything:

- Understand the existing implementation
- Identify dependencies
- Identify which components depend on the code
- Identify database dependencies
- Identify API dependencies
- Identify frontend dependencies

Make the smallest reasonable changes necessary to correct the architecture.

Avoid:

- Completely rewriting working scrapers
- Replacing working APIs unnecessarily
- Changing the entire database schema without need
- Rebuilding the frontend
- Changing UI design unnecessarily
- Removing features that are not related to the audit

==================================================
3. FIX THE CANONICAL CARD IDENTITY
==================================================

Implement a reliable canonical identity for every Japanese card.

The system must have ONE authoritative way to determine:

"What exact card is this?"

The identity must distinguish between:

- Set
- Card number
- Variant
- Parallel
- Alternate art
- Promo
- Other card variants where applicable

Do NOT use card name alone as the primary identity.

Do NOT use image URL as the primary identity.

Do NOT use a loosely matched search result as the identity.

If the existing database already has a suitable identifier, use it consistently rather than creating unnecessary new identifiers.

Document the final identity format in the code/comments where appropriate.

==================================================
4. FIX CARD MATCHING
==================================================

Every external source must be matched against the canonical card identity.

The general logic should be:

SOURCE CARD
↓
Normalize information
↓
Determine canonical identity
↓
Find exact matching database card
↓
Update that card

Never:

SOURCE CARD
↓
Similar name
↓
First result
↓
Assume it is the same card

Prevent:

- Same-name collisions
- Similar-name collisions
- Wrong-set matches
- Wrong-card-number matches
- Parallel/base-card confusion
- Promo/base-card confusion
- Alternate-art confusion

If an exact match cannot be established, do NOT guess.

Mark the record for review or leave the external source unavailable instead.

==================================================
5. FIX LIMITLESS CARD IMPORT
==================================================

Limitless should provide the initial card information.

Ensure that the importer correctly handles:

- Card number
- Set
- Card name
- Rarity
- Artist
- Image
- Variant
- Parallel information
- Other supported metadata

Prevent duplicate imports.

Implement proper upsert behavior:

IF CARD DOES NOT EXIST
→ CREATE

IF CARD EXISTS
→ UPDATE ONLY THE APPROPRIATE FIELDS

Do not create duplicate cards every time the scraper runs.

==================================================
6. FIX SET ASSIGNMENT
==================================================

Cards must remain associated with their correct canonical set.

Do not infer set incorrectly from an unrelated field.

Pay special attention to cards whose printed card number/code may not directly correspond to the page/set where the card is listed.

Do not move cards between sets simply because one source represents the card differently.

Preserve the canonical set relationship.

==================================================
7. FIX COMPLETE CARD COVERAGE
==================================================

Ensure the database can contain the complete expected Japanese One Piece card catalog supported by the application.

For every supported set:

- Detect missing cards
- Detect duplicates
- Detect incomplete records
- Detect unexpected records

Do not silently skip cards.

If a card cannot be imported because required information is missing, log the reason.

The system should make it possible to identify:

MISSING
DUPLICATE
INCOMPLETE
VALID

records.

==================================================
8. FIX IMAGE MATCHING
==================================================

Images must belong to the exact card record.

Never select an image based only on:

- Similar name
- Search ranking
- First result
- Approximate text match

Prefer deterministic card identifiers.

Prevent:

- Wrong card image
- Wrong variant image
- English image replacing Japanese image
- Base image replacing parallel image
- Parallel image replacing base image

If the correct image cannot be confidently identified:

DO NOT assign a random image.

Mark the image as missing/unverified instead.

==================================================
9. FIX YUYUTEI MATCHING
==================================================

Yuyutei pricing must follow this flow:

CANONICAL CARD
↓
YUYUTEI SEARCH
↓
EXACT MATCH
↓
PRICE
↓
DATABASE

If exact matching fails:

CANONICAL CARD
↓
YUYUTEI SEARCH
↓
NO EXACT MATCH
↓
YUYUTEI PRICE = UNAVAILABLE

Never substitute:

- Similar card
- Same character
- Same name
- Different set
- Different card number
- Different variant
- Different rarity
- Different product

for the requested card.

The system must prefer NO PRICE over a WRONG PRICE.

==================================================
10. FIX YUYUTEI "UNAVAILABLE" LOGIC
==================================================

Implement a clear distinction between:

AVAILABLE
UNAVAILABLE
SCRAPE_ERROR
NOT_CHECKED

These states must not be treated as the same thing.

Example:

Yuyutei successfully checked + exact card not found
→ UNAVAILABLE

Yuyutei request timed out
→ SCRAPE_ERROR

Yuyutei parser broke
→ SCRAPE_ERROR

Yuyutei has exact card
→ AVAILABLE

Scraper has not checked yet
→ NOT_CHECKED

Never convert technical errors into UNAVAILABLE.

==================================================
11. FIX YUYUTEI PRICE SELECTION
==================================================

Ensure the price belongs to the exact matched card.

Verify:

- Card number
- Set
- Variant
- Product type
- Condition/type
- Relevant listing

Do not simply select the first search result.

Do not use stale data if the application claims to display current pricing.

Store enough metadata to identify where the price came from.

Where practical, store:

- Source
- Matched external ID/URL
- Price
- Currency
- Last checked timestamp
- Match status

==================================================
12. FIX OTHER PRICING SOURCES
==================================================

Audit every other pricing source already implemented.

For each:

- Keep it if it provides useful unique information.
- Fix it if the matching is incorrect.
- Remove it if it is genuinely unused, obsolete, duplicated, or irrelevant.
- Do not keep multiple implementations of the same pricing source.

Every pricing source must clearly belong to the correct card.

Do not let one source overwrite another source's data incorrectly.

Keep source-specific prices separate.

==================================================
13. FIX GRADED CARD PRICING
==================================================

Keep graded pricing separate from raw card pricing.

For example:

RAW
PSA 10
PSA 9
BGS 10
BGS 9.5
CGC 10

Do not allow graded pricing to overwrite the raw card price.

Ensure graded pricing uses the exact card identity.

If the existing implementation uses the designated grading-price source, preserve that source unless the audit identified a specific problem with it.

==================================================
14. FIX DATABASE DUPLICATES
==================================================

Find existing duplicate records before implementing the final logic.

Identify duplicates based on the canonical card identity.

Do not simply delete duplicates automatically.

Determine which record is authoritative.

Merge information where appropriate.

Preserve valid data.

Then enforce uniqueness where appropriate so the same card cannot be created again by future scraping.

IMPORTANT:

Do not destroy valid pricing, images, metadata, or user-related references.

Before deleting/merging anything, inspect dependencies.

==================================================
15. FIX DATABASE FIELD CONSISTENCY
==================================================

Ensure that each field has one clear meaning.

For example:

card_id
set_id
card_number
variant
name
image
artist
rarity
yuyutei_price
other_price
price_source
price_updated_at

Do not maintain multiple fields representing the same thing unless there is a specific reason.

If duplicate/legacy fields exist:

- Determine which is authoritative
- Update dependent code
- Migrate if necessary
- Remove obsolete usage only after confirming nothing depends on it

==================================================
16. FIX SCRAPER UPDATE LOGIC
==================================================

Repeated scraping must be safe.

Running the scraper:

1 time
10 times
100 times

should NOT create duplicate cards.

Use reliable upsert behavior.

For existing cards:

- Update changed metadata
- Update changed images only when appropriate
- Update prices
- Update timestamps
- Preserve data that should not be overwritten

Do not blindly replace the entire record.

==================================================
17. FIX SCRAPING ERROR HANDLING
==================================================

Every external source must distinguish:

SUCCESS
NOT_FOUND
SCRAPE_ERROR
TIMEOUT
RATE_LIMIT
INVALID_RESPONSE

Do not silently continue as though everything succeeded.

Do not overwrite valid existing data with null/empty data just because a request failed.

For example:

Existing Yuyutei price = ¥500

Yuyutei request temporarily fails

DO NOT automatically change:

¥500 → UNAVAILABLE

Instead retain the previous valid value and record the failed update appropriately, depending on the existing application design.

==================================================
18. FIX STALE DATA
==================================================

Make price freshness explicit.

Every externally sourced price should have a last-updated/last-checked timestamp where practical.

The UI should not imply that a price is current if the data is stale.

Do not unnecessarily scrape the same source repeatedly.

Use the application's existing caching strategy where appropriate.

==================================================
19. REMOVE REDUNDANT CODE
==================================================

Now inspect the entire card-data system for redundant implementations.

Look for:

- Duplicate scrapers
- Duplicate API functions
- Duplicate database functions
- Duplicate card matching logic
- Duplicate normalization functions
- Duplicate price parsers
- Duplicate image matching
- Old scraper versions
- Deprecated APIs
- Unused imports
- Unused fields
- Unused routes
- Dead code
- Old temporary workarounds
- Multiple functions doing the same thing

Before removing anything:

1. Search for all usages.
2. Determine whether it is actually redundant.
3. Identify dependencies.
4. Remove only when safe.

Do not remove code merely because it is not immediately obvious why it exists.

==================================================
20. REMOVE IRRELEVANT LOGIC
==================================================

Remove logic that has no meaningful relationship to the current card system ONLY if it is confirmed to be:

- Unused
- Deprecated
- Replaced
- Unreachable
- Duplicate
- Temporary development code

Do not remove legitimate functionality just because it is not part of the main scraping flow.

==================================================
21. CONSOLIDATE SOURCES OF TRUTH
==================================================

There should be one canonical card record.

Avoid having:

Frontend card data
+
Scraper card data
+
Yuyutei card data
+
Temporary card data
+
Another database record

all independently representing the same card.

External sources should enrich the canonical card record.

Conceptually:

CANONICAL CARD
├── Limitless metadata
├── Image
├── Yuyutei price
├── Other market prices
└── Graded prices

External sources provide information.

They should not create conflicting identities for the same card.

==================================================
22. FINAL CARD DATA FLOW
==================================================

After fixing the implementation, the intended flow should be approximately:

LIMITLESS
↓
Fetch card
↓
Normalize metadata
↓
Determine canonical card identity
↓
Validate card
↓
Check database
↓
Create OR update canonical card
↓
Validate image
↓
YUYUTEI
↓
Exact card match
├── Found → retrieve correct price
└── Not found → UNAVAILABLE
↓
Other pricing sources
↓
Exact matching
↓
Store source-specific prices
↓
Store timestamps/status
↓
Final data integrity validation
↓
Database
↓
API
↓
Frontend
↓
Correct card + correct image + correct prices

Do not deviate from this conceptual flow without a documented technical reason.

==================================================
23. VALIDATION AFTER FIXES
==================================================

After implementing fixes, do NOT assume the system works.

Perform validation.

Test:

- Normal card
- Similar-name cards
- Same character, different cards
- Different sets
- Parallel cards
- Alternate-art cards
- Promo cards
- Missing Yuyutei card
- Yuyutei scrape failure
- Other pricing source failure
- Missing image
- Duplicate scraping
- Existing card update
- New card insertion
- Price update
- Repeated scraping

Verify:

CARD ID
SET
CARD NUMBER
VARIANT
NAME
IMAGE
YUYUTEI MATCH
YUYUTEI PRICE
OTHER PRICES
DATABASE RECORD

all correspond to the same exact card.

==================================================
24. DATABASE INTEGRITY CHECK
==================================================

After the code changes, run a safe integrity check.

Report:

Total cards
Total unique cards
Duplicates
Missing cards
Incomplete cards
Cards without images
Cards without Yuyutei price
Cards marked unavailable
Cards with scrape errors
Cards with suspicious matches

Do NOT automatically delete suspicious records.

Report them first.

==================================================
25. DO NOT FABRICATE MISSING DATA
==================================================

This is extremely important.

If an external source does not provide information:

DO NOT INVENT IT.

If Yuyutei cannot be confidently matched:

UNAVAILABLE / UNMATCHED

If image cannot be confidently matched:

MISSING / UNVERIFIED

If card metadata cannot be verified:

INCOMPLETE / NEEDS REVIEW

Accuracy is more important than filling every field.

==================================================
26. LOGGING
==================================================

Improve logging where necessary.

For every important scraping failure or matching problem, make it possible to understand:

Card
Source
Attempt
Result
Reason
Timestamp

For example:

OP17-001
Yuyutei
NOT_FOUND
No exact card match
2026-09-30

or:

OP17-001
Yuyutei
SCRAPE_ERROR
HTTP timeout
2026-09-30

Avoid noisy logging for normal successful operations.

==================================================
27. DO NOT CHANGE UNRELATED FEATURES
==================================================

Do not modify unrelated parts of the application.

Do not redesign:

- UI
- Navigation
- Authentication
- User profiles
- Collection UI
- Sales UI
- Other features

unless the audit showed that they directly depend on the broken card-data architecture.

If another issue is discovered outside this scope, document it instead of silently modifying it.

==================================================
28. BEFORE AND AFTER REPORT
==================================================

After implementation, provide:

# FIXES IMPLEMENTED

List every actual change.

For each:

Issue
→ Root cause
→ Fix
→ Files changed
→ Why the fix works

# REDUNDANT CODE REMOVED

List what was removed and why it was safe.

# IRRELEVANT CODE REMOVED

List what was removed and why it was no longer relevant.

# DATABASE CHANGES

List schema/migration/data-cleanup changes.

# SCRAPING CHANGES

List changes to:

Limitless
Yuyutei
Other pricing sources
Image retrieval

# MATCHING CHANGES

Explain the new canonical matching behavior.

# VALIDATION RESULTS

Show the tests performed and their results.

# REMAINING ISSUES

Anything that could not safely be fixed or requires manual verification.

==================================================
29. IMPORTANT SAFETY RULES
==================================================

Before deleting database records:

VERIFY DEPENDENCIES.

Before changing database fields:

SEARCH ALL REFERENCES.

Before removing functions:

SEARCH ALL CALLERS.

Before changing scraper behavior:

TRACE THE FULL DATA PIPELINE.

Before changing matching logic:

TEST AGAINST MULTIPLE CARD VARIANTS.

Before changing pricing:

VERIFY THE EXACT CARD IDENTITY.

Do not solve a missing-card problem by weakening matching requirements.

Do not solve a wrong-price problem by simply returning the first result.

Do not solve an image problem by selecting the closest image.

Do not solve duplicate records by blindly deleting records.

Do not hide errors by treating them as unavailable.

==================================================
30. FINAL REQUIREMENT
==================================================

The final result should have this principle:

BETTER TO HAVE:

Card exists
+
Price unavailable

than:

Card exists
+
WRONG PRICE

BETTER TO HAVE:

Card exists
+
Image unavailable

than:

Card exists
+
WRONG IMAGE

BETTER TO HAVE:

Card flagged for review

than:

Card incorrectly matched to another card.

The system must prioritize DATA ACCURACY over completeness when the two conflict.

Implement the fixes now, then run the validation and provide the complete before/after report.

Do not stop after fixing the first few bugs. Trace the entire card-data pipeline and ensure that the fixes do not create inconsistencies elsewhere. 