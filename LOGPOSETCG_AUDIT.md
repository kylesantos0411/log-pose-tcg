I want you to perform a COMPLETE AUDIT of the card information scraping, matching, pricing, image, and database pipeline of my application.

Do NOT modify or fix any code yet.

Your task is to understand exactly how my application currently obtains, identifies, stores, matches, prices, and displays Japanese One Piece cards.

The main goal is to find and explain problems such as:

- Missing cards
- Cards assigned to the wrong set
- Cards assigned to the wrong card number
- Wrong card images
- Wrong card names
- Wrong rarity
- Wrong artist
- Wrong Japanese/English information
- Wrong Yuyutei price
- Price belonging to another card
- Card exists but is incorrectly marked unavailable
- Card exists on Yuyutei but the scraper cannot find it
- Duplicate cards
- Duplicate card IDs
- Different cards sharing the same identifier
- Cards appearing under the wrong set
- Cards appearing in multiple incorrect sets
- Incorrect pricing source matching
- Stale pricing
- Incorrect graded-card pricing
- Incorrect handling of unavailable cards
- Database records that are incomplete
- Scraping failures that silently produce incomplete data

The application must ultimately maintain a reliable database of Japanese One Piece cards.

==================================================
1. EXPECTED CARD DATA PIPELINE
==================================================

The intended pipeline is:

LIMITLESS TCG
        ↓
Initial Card Information
        ↓
Card Identification / Normalization
        ↓
Card Database
        ↓
YU YU TEI
        ↓
Japanese Market Price
        ↓
Other Pricing Sources
        ↓
Additional Market Prices
        ↓
Final Card Record
        ↓
Application Display

However, do NOT assume this is how the current code works.

First inspect the actual implementation and compare it against this intended flow.

Document where the current implementation differs.

==================================================
2. LIMITLESS TCG — PRIMARY CARD INFORMATION SOURCE
==================================================

Limitless TCG should provide the initial information used to identify the card.

Audit exactly what information is obtained from Limitless.

For every field determine:

- Source
- Scraping/API method
- Parser
- Database field
- Normalization logic
- Matching key

Check fields such as:

- Card ID
- Card number
- Set
- Set code
- Card name
- Card type
- Rarity
- Character
- Artist
- Image
- Color
- Cost
- Power
- Counter
- Attribute
- Traits
- Effect
- Alternate art information
- Parallel information
- Any other card metadata currently supported

Determine whether Limitless is being used only for initial card metadata or whether it is also being incorrectly treated as a pricing source.

==================================================
3. JAPANESE CARD IDENTIFICATION
==================================================

This is one of the most important parts of the audit.

Determine how the application uniquely identifies a Japanese card.

Find the actual identifier currently being used.

For example:

Set + Card Number

or:

Card ID

or:

Set Code + Card Number

or another combination.

Determine whether this identifier is actually reliable.

Check for cases where:

- Two cards can have the same identifier
- The same card has different identifiers between sources
- Japanese and English cards are being confused
- Parallel cards are being confused with base cards
- Alternate arts are being confused with the original
- Promo cards are being assigned to the wrong set
- A card's printed code differs from the set where it should appear
- One card appears in multiple sets
- A card is being matched using its name when it should use its card number
- A card is being matched using an incorrect set code

IMPORTANT:

The application's card identity must be based on a reliable canonical identity, not simply on card name or image URL.

Explain what the current canonical identity actually is.

==================================================
4. SET ASSIGNMENT
==================================================

Audit how cards are assigned to sets.

For example:

OP01
OP02
OP03
...
OP17
EB01
EB02
PRB
Promos
Starter Decks
etc.

Do not assume the current supported sets.

Discover all sets currently supported by the code/database.

Check whether:

- Cards are missing from sets
- Cards are assigned to the wrong set
- Cards are duplicated across sets
- Set codes are inconsistent
- Set names are inconsistent
- Set identifiers differ between tables
- Promo cards are handled incorrectly
- Alternate/parallel cards are handled incorrectly
- Card numbers are parsed incorrectly

IMPORTANT:

If a card's printed card code does not correspond directly to the set page where Limitless/Yuyutei lists it, determine how the application should handle this.

The card should remain associated with the correct canonical set rather than being incorrectly moved simply because of a mismatching code.

==================================================
5. COMPLETE CARD COVERAGE
==================================================

Determine whether the database actually contains ALL Japanese One Piece cards that the application is expected to support.

Create a coverage audit.

For every supported set, determine:

- Expected number of cards
- Number currently in database
- Missing cards
- Duplicate cards
- Unexpected cards
- Cards with incomplete information

Create a report similar to:

SET | EXPECTED | DATABASE | MISSING | DUPLICATE | INCOMPLETE

Do this for every supported set.

If an authoritative expected card count cannot be determined from the existing sources, explicitly say so instead of inventing one.

==================================================
6. CARD IMAGE MATCHING
==================================================

Audit how card images are obtained and matched.

This is a major source of bugs.

Trace:

Card
→ Image source
→ Image URL
→ Stored image
→ Database
→ Frontend
→ Displayed image

Determine:

- Where the image comes from
- Whether Limitless supplies it
- Whether another source supplies it
- How the image is linked to a card
- Whether image URLs are permanently stored
- Whether images are downloaded locally
- Whether image IDs are used
- Whether images are matched by name
- Whether images are matched by card number
- Whether images can become associated with another card

Check for:

- Wrong image
- Duplicate image
- Missing image
- Old image
- Base card image used for parallel
- Parallel image used for base card
- Japanese image replaced with English image
- Image belonging to another card with a similar name
- Broken image URLs

Determine whether the current image matching method is deterministic.

It should NEVER select an image merely because it has a similar card name.

==================================================
7. CARD NAME MATCHING
==================================================

Audit name normalization and matching.

Check differences such as:

- Japanese name
- English name
- Romanized name
- Special characters
- Punctuation
- Spaces
- Parentheses
- Alternate art naming
- Parallel naming
- Promo naming

Determine whether card names are being used as a primary identifier.

If names are currently used to match cards between sources, determine whether this can cause incorrect matches.

==================================================
8. YUYUTEI PRICE PIPELINE
==================================================

The intended behavior is:

Card identified
        ↓
Search Yuyutei
        ↓
Find exact corresponding Japanese card
        ↓
Retrieve latest relevant price
        ↓
Store/display price

If the exact card does not exist on Yuyutei:

Yuyutei
→ Card not found
→ Price = UNAVAILABLE

Do NOT substitute another card's price.

Do NOT use a similar card.

Do NOT use a previous card's price.

Do NOT use a price from a different set.

Do NOT use a price from a similarly named card.

Audit the actual implementation.

==================================================
9. YUYUTEI MATCHING
==================================================

Determine exactly how a card is matched to Yuyutei.

Check whether matching uses:

- Card number
- Set
- Card name
- Japanese name
- Image
- URL
- Internal Yuyutei ID
- Combination of fields

Identify the strongest available matching key.

The system must prioritize EXACT card identity.

For example:

Canonical Card:
OP17-001

Yuyutei:
OP17-001

→ MATCH

But:

Canonical Card:
OP17-001

Yuyutei:
OP16-001

→ NO MATCH

Even if the card names are similar.

Also test:

Same character
Different card number

Same name
Different set

Base card
Parallel card

Regular art
Alternate art

Promo
Set card

These must not be accidentally matched.

==================================================
10. YUYUTEI UNAVAILABLE LOGIC
==================================================

Audit what happens when Yuyutei does not have the card.

Expected behavior:

Card exists in database
+
Card cannot be found on Yuyutei
=
Yuyutei price: UNAVAILABLE

The card itself must NOT disappear.

The card must NOT be deleted.

The card must NOT inherit another card's price.

The card must NOT be treated as a failed card scrape.

Determine whether the current code follows this behavior.

==================================================
11. YUYUTEI PRICE CORRECTNESS
==================================================

For cards that ARE found on Yuyutei, determine whether the application retrieves the correct price.

Audit:

- Current price
- Previous price
- Regular card price
- Parallel price
- Foil price
- Alternate-art price
- Graded price
- Other variants

Determine exactly which Yuyutei price the application intends to display.

Check whether the scraper can accidentally select:

- First search result
- Similar card
- Wrong rarity
- Wrong variant
- Wrong set
- Wrong condition
- Wrong language
- Wrong product listing

Trace the exact selector/parser used.

==================================================
12. OTHER PRICING SOURCES
==================================================

After Yuyutei, audit every other pricing source currently implemented.

Document:

Source
↓
Search key
↓
Matching logic
↓
Price retrieved
↓
Database field
↓
Frontend display

For each source determine whether it is:

- Exact match
- Approximate match
- Name-based match
- Number-based match
- Set-based match

Identify sources that may produce incorrect prices because they are matching the wrong card.

==================================================
13. GRADED CARD PRICING
==================================================

If the application has PSA/BGS/CGC or other graded card pricing, audit this separately.

Determine:

- How the card is identified
- How grading company is identified
- How grade is identified
- How the price is obtained
- How it is stored
- How it is displayed

For example:

PSA 10
PSA 9
BGS 10
BGS 9.5
CGC 10

Make sure a graded price cannot accidentally become the raw-card price.

Also determine whether graded pricing is sourced separately from raw pricing.

==================================================
14. DATABASE SCHEMA AUDIT
==================================================

Inspect the database structure for cards.

Document all card-related tables/collections and fields.

Determine the canonical card record.

Identify:

- Primary key
- External IDs
- Card number
- Set ID
- Set name
- Card name
- Image URL
- Artist
- Rarity
- Pricing fields
- Pricing source
- Last updated time
- Scraping status
- Availability status
- Variant information

Look for:

- Duplicate identifiers
- Duplicate cards
- Missing unique constraints
- Incorrect relationships
- Conflicting fields
- Multiple sources of truth
- Fields storing different meanings
- Old/deprecated fields
- Prices stored without source
- Prices stored without timestamps
- Images stored without card identity

==================================================
15. SCRAPING PIPELINE
==================================================

Trace the actual scraping process from beginning to end.

Document:

START
↓
Fetch Limitless
↓
Parse cards
↓
Normalize cards
↓
Check existing database
↓
Create/update card
↓
Find Yuyutei
↓
Match exact card
↓
Retrieve price
↓
Store price
↓
Other pricing sources
↓
Store additional prices
↓
Final database record

Identify exactly where each step occurs in the code.

For every step provide:

FILE
FUNCTION
INPUT
OUTPUT
DATABASE OPERATION

==================================================
16. UPDATE VS CREATE LOGIC
==================================================

This is important.

Determine what happens when the scraper encounters a card that already exists.

Does it:

- Create another record?
- Update the existing record?
- Merge data?
- Overwrite fields?
- Preserve old data?
- Replace images?
- Replace prices?
- Update only changed fields?

Check whether repeated scraping can create duplicates.

Also determine what happens when:

- Card metadata changes
- Image changes
- Price changes
- Card becomes unavailable on Yuyutei
- Card becomes available on Yuyutei
- A new variant appears

==================================================
17. SCRAPING FAILURE HANDLING
==================================================

Check what happens when:

- Limitless fails
- Yuyutei fails
- Other pricing source fails
- Network timeout
- HTML structure changes
- Rate limit occurs
- Card cannot be found
- Image cannot be downloaded
- Parser cannot identify card
- Database write fails

Distinguish:

SCRAPE FAILED

from:

CARD DOES NOT EXIST ON SOURCE

These are NOT the same thing.

For example:

Yuyutei request failed
≠
Card unavailable on Yuyutei

Do not allow technical scraping failures to automatically become "Unavailable."

==================================================
18. CACHE AND STALE DATA
==================================================

Determine whether card information and prices are cached.

Check:

- Cache duration
- Last updated timestamp
- Refresh behavior
- Manual refresh
- Automatic refresh
- Whether old prices remain after a failed scrape

Look for situations where the application displays an outdated price while appearing to show a current price.

==================================================
19. FRONTEND DISPLAY VERIFICATION
==================================================

Trace:

Database
→ API
→ Frontend
→ Card component

Verify that the frontend is displaying the correct database record.

Check:

- Card name
- Set
- Card number
- Image
- Rarity
- Artist
- Raw price
- Yuyutei price
- Other prices
- Graded prices
- Availability

Look for frontend bugs where the backend has correct information but the UI displays the wrong information.

==================================================
20. CARD DATA INTEGRITY TEST CASES
==================================================

Create test cases for problematic situations.

At minimum test:

1. Normal card
2. Card missing from Yuyutei
3. Card with similar name to another card
4. Same character, different card number
5. Same name, different set
6. Parallel card
7. Alternate-art card
8. Promo card
9. Card with unusual characters
10. Card with missing image
11. Card with changed price
12. New card added to a set
13. Duplicate scrape
14. Failed Yuyutei request
15. Failed Limitless request
16. Temporary network failure
17. Wrong/missing external ID
18. Card present in database but missing from source
19. Card present on Yuyutei but missing from database
20. Card whose printed code differs from the set page where it is listed

For each test case explain the expected behavior and whether the current implementation satisfies it.

==================================================
21. FIND THE ROOT CAUSE OF EXISTING BUGS
==================================================

Do not simply say:

"Some cards are missing."

Find WHY.

For every issue determine:

Problem
→ Code responsible
→ Data involved
→ Incorrect assumption
→ Result

Example:

Wrong Yuyutei price
↓
Name-based search
↓
Two cards have similar names
↓
Scraper selects first result
↓
Price from different card
↓
Incorrect database price

I want root causes, not symptoms.

==================================================
22. CREATE A CARD DATA LINEAGE REPORT
==================================================

For one example card, trace the complete lineage:

Limitless card
↓
Canonical card ID
↓
Database record
↓
Yuyutei search
↓
Yuyutei matched product
↓
Yuyutei price
↓
Other pricing sources
↓
Final database record
↓
API response
↓
Frontend card
↓
Displayed image and prices

Then repeat this concept for problematic cards where possible.

==================================================
23. FINAL REPORT

Return the audit using this structure:

# 1. Current Card Data Architecture

Explain how the current system actually works.

# 2. Intended Card Data Architecture

Explain how the system SHOULD work based on the requirements above.

# 3. Limitless → Database Flow

# 4. Database → Yuyutei Flow

# 5. Yuyutei → Price Flow

# 6. Other Pricing Sources Flow

# 7. Image Flow

# 8. Card Identity / Matching Flow

# 9. Complete Card Scraping Flow

# 10. Card Coverage Report

Show missing/duplicate/incomplete cards by set.

# 11. Confirmed Bugs

For each:

BUG ID
TITLE
SEVERITY
ROOT CAUSE
FILES
FUNCTIONS
CURRENT BEHAVIOR
EXPECTED BEHAVIOR
IMPACT

# 12. Potential Bugs

Things that require additional testing.

# 13. Redundant Logic

Duplicate or unnecessary scraping/matching/database operations.

# 14. Data Integrity Problems

Anything that can cause wrong or inconsistent card records.

# 15. Pricing Problems

Everything related to incorrect, missing, stale, or mismatched prices.

# 16. Image Problems

Everything related to wrong or missing images.

# 17. Missing Card Problems

Everything that can cause cards to disappear or never enter the database.

# 18. Recommended Canonical Card Identity

Explain what fields should uniquely identify a card and why.

# 19. Recommended Scraping Flow

Provide the corrected ideal flow WITHOUT implementing it.

For example:

LIMITLESS
↓
Normalize
↓
Canonical Identity
↓
Validate
↓
Upsert Card
↓
Image Validation
↓
YUYUTEI Exact Match
↓
Price OR Unavailable
↓
Other Pricing Sources
↓
Validate Pricing
↓
Save
↓
Final Integrity Check

Adapt this to the actual application.

# 20. Verification Checklist

Create a checklist I can use to verify the database after the eventual fixes.

IMPORTANT:

DO NOT MODIFY THE CODE.

DO NOT FIX ANYTHING.

DO NOT DELETE ANY DATA.

DO NOT RE-SCRAPE THE ENTIRE DATABASE.

DO NOT CHANGE THE DATABASE SCHEMA.

This is an investigation only.

I want to understand exactly why missing cards, wrong prices, wrong images, incorrect set assignments, and mismatched card records are happening before any code changes are made.

If you discover a problem, trace it back to the root cause and show me the exact flow that produces it.

The priority is DATA CORRECTNESS and CARD IDENTITY, not code style or optimization.