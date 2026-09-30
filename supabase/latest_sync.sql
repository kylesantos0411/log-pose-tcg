-- LOG POSE TCG - Canonical Data Sync Script
-- Generated at: 2026-09-30T04:04:17.750Z
BEGIN;

-- 1. Upsert Game
INSERT INTO games (name) VALUES ('One Piece Card Game') ON CONFLICT (name) DO NOTHING;

-- 2. Upsert Sets
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-01', 'Romance Dawn', '2022-07-22'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-02', 'Paramount War', '2022-11-04'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-03', 'Pillars of Strength', '2023-02-11'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-04', 'Kingdoms of Intrigue', '2023-05-27'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-05', 'Awakening of the New Era', '2023-08-26'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-06', 'Flamboyant Fortunes', '2023-11-25'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-07', '500 Years in the Future', '2024-02-24'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-08', 'Two Legends', '2024-05-25'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-09', 'Emperors in the New World', '2024-08-31'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'OP-10', 'Royal Bloodlines', '2024-11-30'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'EB-01', 'Memorial Collection', '2024-01-27'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'EB-02', 'Anime 25th Collection', '2024-09-28'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'PRB-01', 'The Best Premium Booster', '2024-07-27'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'ST-01', 'Straw Hat Crew Starter Deck', '2022-07-08'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'ST-02', 'Worst Generation Starter Deck', '2022-07-08'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;
INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, 'PROMO', 'Promotional Cards', '2022-07-01'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 3. Upsert Canonical Cards
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-001_BASE_JP', id, 'OP01-001', 'Roronoa Zoro', 'ロロノア・ゾロ', 'L', 'Red', 'Leader', NULL, 5000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png?20220708', 'BASE', 'JP', false
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-001_PARALLEL_JP', id, 'OP01-001', 'Roronoa Zoro (Parallel)', 'ロロノア・ゾロ (パラレル)', 'L', 'Red', 'Leader', NULL, 5000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001_p1.png?20220708', 'PARALLEL', 'JP', true
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-016_BASE_JP', id, 'OP01-016', 'Nami', 'ナミ', 'R', 'Red', 'Character', 1, 2000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png?20220708', 'BASE', 'JP', false
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-016_PARALLEL_JP', id, 'OP01-016', 'Nami (Parallel)', 'ナミ (パラレル)', 'R', 'Red', 'Character', 1, 2000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016_p1.png?20220708', 'PARALLEL', 'JP', true
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-120_BASE_JP', id, 'OP01-120', 'Shanks', 'シャンクス', 'SEC', 'Red', 'Character', 9, 10000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png?20220708', 'BASE', 'JP', false
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP01_OP01-120_MANGA_JP', id, 'OP01-120', 'Shanks (Manga Super Parallel)', 'シャンクス (スーパーパラレル)', 'SEC', 'Red', 'Character', 9, 10000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120_p2.png?20220708', 'MANGA', 'JP', true
FROM sets WHERE set_code = 'OP-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP02_OP02-001_BASE_JP', id, 'OP02-001', 'Edward.Newgate', 'エドワード・ニューゲート', 'L', 'Red', 'Leader', NULL, 6000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png?20221104', 'BASE', 'JP', false
FROM sets WHERE set_code = 'OP-02'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP02_OP02-013_BASE_JP', id, 'OP02-013', 'Portgas.D.Ace', 'ポートガス・D・エース', 'SR', 'Red', 'Character', 7, 7000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013.png?20221104', 'BASE', 'JP', false
FROM sets WHERE set_code = 'OP-02'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP02_OP02-013_MANGA_JP', id, 'OP02-013', 'Portgas.D.Ace (Manga Super Parallel)', 'ポートガス・D・エース (スーパーパラレル)', 'SR', 'Red', 'Character', 7, 7000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013_p2.png?20221104', 'MANGA', 'JP', true
FROM sets WHERE set_code = 'OP-02'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_OP03_OP03-122_MANGA_JP', id, 'OP03-122', 'Sogeking (Manga Super Parallel)', 'そげキング (スーパーパラレル)', 'SEC', 'Yellow', 'Character', 7, 7000, 'https://en.onepiece-cardgame.com/images/cardlist/card/OP03-122_p2.png?20230211', 'MANGA', 'JP', true
FROM sets WHERE set_code = 'OP-03'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_EB01_EB01-006_MANGA_JP', id, 'EB01-006', 'Tony Tony.Chopper (Manga Super Parallel)', 'トニートニー・チョッパー (スーパーパラレル)', 'SEC', 'Red', 'Character', 5, 6000, 'https://en.onepiece-cardgame.com/images/cardlist/card/EB01-006_p2.png?20240127', 'MANGA', 'JP', true
FROM sets WHERE set_code = 'EB-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_PRB01_PRB01-001_BASE_JP', id, 'PRB01-001', 'Monkey.D.Luffy (The Best)', 'モンキー・D・ルフィ', 'P-L', 'Red', 'Leader', NULL, 5000, 'https://en.onepiece-cardgame.com/images/cardlist/card/PRB01-001.png?20240727', 'BASE', 'JP', false
FROM sets WHERE set_code = 'PRB-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_ST01_ST01-012_BASE_JP', id, 'ST01-012', 'Pacifista', 'パシフィスタ', 'C', 'Red', 'Character', 4, 6000, 'https://en.onepiece-cardgame.com/images/cardlist/card/ST01-012.png?20220708', 'BASE', 'JP', false
FROM sets WHERE set_code = 'ST-01'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();
INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  'OPT_PROMO_P-001_PROMO_JP', id, 'P-001', 'Monkey.D.Luffy (Promotion)', 'モンキー・D・ルフィ (プロモ)', 'P', 'Red', 'Character', 6, 7000, 'https://en.onepiece-cardgame.com/images/cardlist/card/P-001.png?20220701', 'PROMO', 'JP', true
FROM sets WHERE set_code = 'PROMO'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();

-- 4. Upsert Market Prices
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-001_BASE_JP', 'yuyutei', 280, 'JPY', 111.3, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10001', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-001_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-001_PARALLEL_JP', 'yuyutei', 4800, 'JPY', 1907.93, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10002', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-001_PARALLEL_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-016_BASE_JP', 'yuyutei', 680, 'JPY', 270.29, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10016', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-016_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-016_PARALLEL_JP', 'yuyutei', 14800, 'JPY', 5882.78, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10017', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-016_PARALLEL_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-120_BASE_JP', 'yuyutei', 1200, 'JPY', 476.98, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10120', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-120_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-120_MANGA_JP', 'yuyutei', 198000, 'JPY', 78702.03, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op01/10121', now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-120_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP02_OP02-001_BASE_JP', 'yuyutei', 180, 'JPY', 71.55, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op02/10001', now()
FROM cards WHERE canonical_id = 'OPT_OP02_OP02-001_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP02_OP02-013_BASE_JP', 'yuyutei', 380, 'JPY', 151.04, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op02/10013', now()
FROM cards WHERE canonical_id = 'OPT_OP02_OP02-013_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP02_OP02-013_MANGA_JP', 'yuyutei', 168000, 'JPY', 66777.48, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op02/10014', now()
FROM cards WHERE canonical_id = 'OPT_OP02_OP02-013_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP03_OP03-122_MANGA_JP', 'yuyutei', 79800, 'JPY', 31719.3, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/op03/10123', now()
FROM cards WHERE canonical_id = 'OPT_OP03_OP03-122_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_EB01_EB01-006_MANGA_JP', 'yuyutei', 88000, 'JPY', 34978.68, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/eb01/10007', now()
FROM cards WHERE canonical_id = 'OPT_EB01_EB01-006_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_PRB01_PRB01-001_BASE_JP', 'yuyutei', 200, 'JPY', 79.5, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/prb01/10001', now()
FROM cards WHERE canonical_id = 'OPT_PRB01_PRB01-001_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_ST01_ST01-012_BASE_JP', 'yuyutei', 30, 'JPY', 11.92, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/st01/10012', now()
FROM cards WHERE canonical_id = 'OPT_ST01_ST01-012_BASE_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_PROMO_P-001_PROMO_JP', 'yuyutei', 1500, 'JPY', 596.23, 'AVAILABLE', 'A', false, NULL, NULL, 'https://yuyu-tei.jp/sell/opc/card/promo/10001', now()
FROM cards WHERE canonical_id = 'OPT_PROMO_P-001_PROMO_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-120_MANGA_JP', 'snkrdunk', 340000, 'JPY', 127500, 'AVAILABLE', 'GRADED_PSA_10', true, 'PSA', '10', NULL, now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-120_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP02_OP02-013_MANGA_JP', 'snkrdunk', 280000, 'JPY', 105000, 'AVAILABLE', 'GRADED_PSA_10', true, 'PSA', '10', NULL, now()
FROM cards WHERE canonical_id = 'OPT_OP02_OP02-013_MANGA_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();
INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, 'OPT_OP01_OP01-016_PARALLEL_JP', 'snkrdunk', 25000, 'JPY', 9375, 'AVAILABLE', 'GRADED_BGS_9.5', true, 'BGS', '9.5', NULL, now()
FROM cards WHERE canonical_id = 'OPT_OP01_OP01-016_PARALLEL_JP'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();

COMMIT;