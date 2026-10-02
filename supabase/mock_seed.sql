-- LOG POSE TCG - Canonical Japanese Seed Data
-- Aligned with Canonical Card Identity: {GAME}_{SET}_{CARD_NUMBER}_{VARIANT}_{LANGUAGE}

-- 1. Insert Game
INSERT INTO games (name) VALUES ('One Piece TCG') ON CONFLICT (name) DO NOTHING;

DO $$ 
DECLARE
    v_game_id UUID;
    v_set_op01_id UUID;
    v_set_op02_id UUID;
    v_set_op03_id UUID;
    v_set_eb01_id UUID;
    v_set_prb01_id UUID;
    v_set_st01_id UUID;
    v_set_promo_id UUID;
    v_card_id UUID;
BEGIN
    SELECT id INTO v_game_id FROM games WHERE name = 'One Piece TCG';

    -- 2. Insert Canonical Sets
    INSERT INTO sets (game_id, set_code, name, release_date) 
    VALUES 
        (v_game_id, 'OP-01', 'Romance Dawn', '2022-07-22'),
        (v_game_id, 'OP-02', 'Paramount War', '2022-11-04'),
        (v_game_id, 'OP-03', 'Pillars of Strength', '2023-02-11'),
        (v_game_id, 'EB-01', 'Memorial Collection', '2024-01-27'),
        (v_game_id, 'PRB-01', 'The Best Premium Booster', '2024-07-27'),
        (v_game_id, 'ST-01', 'Straw Hat Crew Starter Deck', '2022-07-08'),
        (v_game_id, 'PROMO', 'Promotional Cards', '2022-07-01')
    ON CONFLICT (game_id, set_code) DO UPDATE SET name = EXCLUDED.name, release_date = EXCLUDED.release_date;

    SELECT id INTO v_set_op01_id FROM sets WHERE set_code = 'OP-01' AND game_id = v_game_id;
    SELECT id INTO v_set_op02_id FROM sets WHERE set_code = 'OP-02' AND game_id = v_game_id;
    SELECT id INTO v_set_op03_id FROM sets WHERE set_code = 'OP-03' AND game_id = v_game_id;
    SELECT id INTO v_set_eb01_id FROM sets WHERE set_code = 'EB-01' AND game_id = v_game_id;
    SELECT id INTO v_set_prb01_id FROM sets WHERE set_code = 'PRB-01' AND game_id = v_game_id;
    SELECT id INTO v_set_st01_id FROM sets WHERE set_code = 'ST-01' AND game_id = v_game_id;
    SELECT id INTO v_set_promo_id FROM sets WHERE set_code = 'PROMO' AND game_id = v_game_id;

    -- 3. Upsert Canonical Japanese Cards
    -- OP01-001 Zoro (Leader - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-001_BASE_JP', v_set_op01_id, 'OP01-001', 'Roronoa Zoro', 'ロロノア・ゾロ', 'L', 'Red', 'Leader', NULL, 5000, NULL, 'Slash', '[DON!! x1] [Your Turn] All of your Characters gain +1000 power.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, image_url = EXCLUDED.image_url
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-001_BASE_JP', 'yuyutei', 280, 'JPY', 105.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-001 Zoro (Leader - Parallel Alt Art)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-001_PARALLEL_JP', v_set_op01_id, 'OP01-001', 'Roronoa Zoro (Parallel)', 'ロロノア・ゾロ (パラレル)', 'L', 'Red', 'Leader', NULL, 5000, NULL, 'Slash', '[DON!! x1] [Your Turn] All of your Characters gain +1000 power.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001_p1.png', 'PARALLEL', 'JP', true)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, image_url = EXCLUDED.image_url
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-001_PARALLEL_JP', 'yuyutei', 14800, 'JPY', 5550.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-002 Law (Leader - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-002_BASE_JP', v_set_op01_id, 'OP01-002', 'Trafalgar Law', 'トラファルガー・ロー', 'L', 'Red/Green', 'Leader', NULL, 5000, NULL, 'Slash', '[Activate: Main] [Once Per Turn] (2): Return 1 Character to hand; play 1 cost 5 or less Character.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-002.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-002_BASE_JP', 'yuyutei', 480, 'JPY', 180.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-003 Luffy (Leader - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-003_BASE_JP', v_set_op01_id, 'OP01-003', 'Monkey.D.Luffy', 'モンキー・D・ルフィ', 'L', 'Red', 'Leader', NULL, 5000, NULL, 'Strike', '[Activate: Main] [Once Per Turn] (4): Give up to 2 rested DON!! cards to Leader or Character.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-003_BASE_JP', 'yuyutei', 200, 'JPY', 75.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-025 Zoro (SR - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-025_BASE_JP', v_set_op01_id, 'OP01-025', 'Roronoa Zoro', 'ロロノア・ゾロ', 'SR', 'Red', 'Character', 3, 5000, NULL, 'Slash', '[Rush] (This card can attack on the turn in which it is played.)', 'Hashimoto Q', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-025_BASE_JP', 'yuyutei', 1480, 'JPY', 555.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-025 Zoro (SR - Parallel Alt Art)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-025_PARALLEL_JP', v_set_op01_id, 'OP01-025', 'Roronoa Zoro (Parallel)', 'ロロノア・ゾロ (パラレル)', 'SR', 'Red', 'Character', 3, 5000, NULL, 'Slash', '[Rush] (This card can attack on the turn in which it is played.)', 'Hashimoto Q', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-025_p1.png', 'PARALLEL', 'JP', true)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-025_PARALLEL_JP', 'yuyutei', 6980, 'JPY', 2617.50, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-120 Shanks (SEC - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-120_BASE_JP', v_set_op01_id, 'OP01-120', 'Shanks', 'シャンクス', 'SEC', 'Red', 'Character', 9, 10000, NULL, 'Slash', '[Rush]\n[When Attacking] Opponent cannot activate [Blocker] with 2000 or less power.', 'Manga', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-120_BASE_JP', 'yuyutei', 2480, 'JPY', 930.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP01-120 Shanks (SEC - Manga Super Parallel)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP01_OP01-120_MANGA_JP', v_set_op01_id, 'OP01-120', 'Shanks (Manga Super Parallel)', 'シャンクス (コミックパラレル)', 'SEC', 'Red', 'Character', 9, 10000, NULL, 'Slash', '[Rush]\n[When Attacking] Opponent cannot activate [Blocker] with 2000 or less power.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-120_p1.png', 'MANGA', 'JP', true)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    -- Manga Shanks Yuyutei Price
    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP01_OP01-120_MANGA_JP', 'yuyutei', 128000, 'JPY', 48000.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- Graded PSA 10 Shanks Manga (Demonstrating Graded Separation)
    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade)
    VALUES (v_card_id, 'OPT_OP01_OP01-120_MANGA_JP', 'snkrdunk', 215000, 'JPY', 80625.00, 'AVAILABLE', 'GEM-MT', true, 'PSA', '10')
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP02-001 Whitebeard (Leader - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP02_OP02-001_BASE_JP', v_set_op02_id, 'OP02-001', 'Edward.Newgate', 'エドワード・ニューゲート', 'L', 'Red', 'Leader', NULL, 6000, NULL, 'Special', 'At the end of your turn, trash 1 card from top of Life area.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP02_OP02-001_BASE_JP', 'yuyutei', 320, 'JPY', 120.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- OP02-004 Whitebeard (Character SR - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP02_OP02-004_BASE_JP', v_set_op02_id, 'OP02-004', 'Edward.Newgate', 'エドワード・ニューゲート', 'SR', 'Red', 'Character', 9, 10000, NULL, 'Special', '[On Play] Up to 1 Leader gains +2000 power until start of next turn.', 'Nijihayashi', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP02-004.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_OP02_OP02-004_BASE_JP', 'yuyutei', 980, 'JPY', 367.50, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- Card deliberately set as UNAVAILABLE to test unavailable handling
    -- OP02-005 Rare Promo (Simulating Out of Stock / Unlisted on Yuyutei)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_OP02_OP02-005_BASE_JP', v_set_op02_id, 'OP02-005', 'Curly.Dadan', 'カーリー・ダダン', 'UC', 'Red', 'Character', 2, 3000, 1000, 'Slash', '[On Play] Look at 5 cards from top of deck; reveal 1 cost 1 Red Character and add to hand.', 'Studio Log', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP02-005.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, notes)
    VALUES (v_card_id, 'OPT_OP02_OP02-005_BASE_JP', 'yuyutei', NULL, 'JPY', NULL, 'UNAVAILABLE', 'A', false, 'Not currently listed on Yuyutei stock')
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

    -- PRB01-001 Sanji (Leader - Base)
    INSERT INTO cards (canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, counter, attribute, effect, illustrator, image_url, variant_type, language, is_alternate_art)
    VALUES ('OPT_PRB01_PRB01-001_BASE_JP', v_set_prb01_id, 'PRB01-001', 'Sanji', 'サンジ', 'L', 'Red', 'Leader', NULL, 5000, NULL, 'Strike', '[Activate: Main] [Once Per Turn] Up to 1 of your Characters with a cost of 8 or less gains [Rush] during this turn.', 'Eiichiro Oda', 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/PRB01-001.png', 'BASE', 'JP', false)
    ON CONFLICT (set_id, card_number, variant_type, language) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, image_url = EXCLUDED.image_url
    RETURNING id INTO v_card_id;

    INSERT INTO card_prices (card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded)
    VALUES (v_card_id, 'OPT_PRB01_PRB01-001_BASE_JP', 'yuyutei', 200, 'JPY', 75.00, 'AVAILABLE', 'A', false)
    ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET price_raw = EXCLUDED.price_raw, price_php = EXCLUDED.price_php, status = EXCLUDED.status, last_checked_at = now();

END $$;
