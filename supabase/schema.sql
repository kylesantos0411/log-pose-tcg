-- LOG POSE TCG - Supabase Schema for Phase 1 Core Mobile MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. GAMES (To support multi-TCG in the future, starting with One Piece)
CREATE TABLE games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Games are viewable by everyone." ON games FOR SELECT USING (true);
-- Only admins should insert/update, skipping for MVP since data will be seeded.

-- 3. SETS
CREATE TABLE sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    set_code TEXT NOT NULL,
    name TEXT NOT NULL,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(game_id, set_code)
);

-- Enable RLS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sets are viewable by everyone." ON sets FOR SELECT USING (true);

-- 4. CARDS
CREATE TABLE cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    canonical_id TEXT UNIQUE NOT NULL, -- Format: OPT_{SET}_{NUMBER}_{VARIANT}_{LANG}
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ja TEXT,
    rarity TEXT,
    color TEXT,
    type TEXT,
    cost INTEGER,
    power INTEGER,
    counter INTEGER,
    attribute TEXT,
    effect TEXT,
    trigger_effect TEXT,
    illustrator TEXT,
    image_url TEXT,
    variant_type TEXT DEFAULT 'BASE' NOT NULL, -- 'BASE', 'PARALLEL', 'MANGA', 'SP', 'SPECIAL', 'PROMO'
    language TEXT DEFAULT 'JP' NOT NULL, -- 'JP', 'EN'
    is_alternate_art BOOLEAN DEFAULT false NOT NULL,
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(set_id, card_number, variant_type, language)
);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards are viewable by everyone." ON cards FOR SELECT USING (true);

-- Indexes for card lookup performance
CREATE INDEX idx_cards_card_number ON cards(card_number);
CREATE INDEX idx_cards_set_id ON cards(set_id);
CREATE INDEX idx_cards_canonical_id ON cards(canonical_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_color ON cards(color);

-- 4b. CARD PRICES (Multi-source market pricing: Yuyutei, SNKRDUNK, Mercari, Graded)
CREATE TABLE card_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    canonical_id TEXT NOT NULL,
    source TEXT NOT NULL, -- 'yuyutei', 'snkrdunk', 'mercari', etc.
    price_raw NUMERIC(12, 2), -- Raw price in original currency
    currency TEXT DEFAULT 'JPY' NOT NULL, -- 'JPY', 'PHP', 'USD'
    price_php NUMERIC(12, 2), -- Converted reference price in Philippine Peso
    status TEXT DEFAULT 'NOT_CHECKED' NOT NULL CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'SCRAPE_ERROR', 'NOT_CHECKED')),
    condition TEXT DEFAULT 'A' NOT NULL, -- Yuyutei condition grade 'A' (NM), 'B' (LP), etc.
    is_graded BOOLEAN DEFAULT false NOT NULL,
    grading_company TEXT, -- 'PSA', 'BGS', 'CGC' (NULL if raw)
    grade TEXT, -- '10', '9.5', '9' (NULL if raw)
    external_url TEXT,
    external_id TEXT,
    notes TEXT,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(card_id, source, condition, is_graded, grade)
);

-- Enable RLS
ALTER TABLE card_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Card prices are viewable by everyone." ON card_prices FOR SELECT USING (true);

-- Indexes for pricing lookup
CREATE INDEX idx_card_prices_card_id ON card_prices(card_id);
CREATE INDEX idx_card_prices_canonical_id ON card_prices(canonical_id);
CREATE INDEX idx_card_prices_source_status ON card_prices(source, status);

-- 4c. VIEW: CARDS WITH LATEST YUYUTEI PRICING
CREATE OR REPLACE VIEW cards_with_pricing AS
SELECT 
    c.*,
    p.price_raw AS yuyutei_price_jpy,
    p.price_php AS yuyutei_price_php,
    p.status AS yuyutei_status,
    p.last_checked_at AS price_last_checked_at,
    s.set_code,
    s.name AS set_name
FROM cards c
LEFT JOIN sets s ON c.set_id = s.id
LEFT JOIN card_prices p ON c.id = p.card_id AND p.source = 'yuyutei' AND p.is_graded = false AND p.condition = 'A';


-- 5. COLLECTION ITEMS
CREATE TABLE collection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    condition TEXT DEFAULT 'Near Mint' NOT NULL,
    notes TEXT,
    purchase_price NUMERIC(10, 2),
    purchase_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own collection." ON collection_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own collection." ON collection_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collection items." ON collection_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collection items." ON collection_items FOR DELETE USING (auth.uid() = user_id);

-- 6. DECKS
CREATE TABLE decks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    leader_id UUID REFERENCES cards(id), -- Nullable initially, updated later
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public decks are viewable by everyone." ON decks FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own decks." ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own decks." ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decks." ON decks FOR DELETE USING (auth.uid() = user_id);

-- 7. DECK CARDS
CREATE TABLE deck_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0 AND quantity <= 4), -- Rule validation could be done here or in app
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(deck_id, card_id)
);

-- Enable RLS
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deck cards viewable if deck is viewable." ON deck_cards FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND (decks.is_public = true OR decks.user_id = auth.uid())
    )
);
CREATE POLICY "Users can insert cards into their decks." ON deck_cards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid())
);
CREATE POLICY "Users can update cards in their decks." ON deck_cards FOR UPDATE USING (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid())
);
CREATE POLICY "Users can delete cards from their decks." ON deck_cards FOR DELETE USING (
    EXISTS (SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid())
);

-- Function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed data for games and sets (Example)
INSERT INTO games (name) VALUES ('One Piece TCG');
