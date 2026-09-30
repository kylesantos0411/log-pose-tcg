# LOG POSE TCG

LOG POSE TCG is a mobile-only Flutter MVP for TCG collectors and players. It includes the Phase 1 foundation from `LOGPOSETCG_PLAN.md`: app identity, authentication flow screens, mobile bottom navigation, card database/search, card details, collection, deck builder, and profile.

## Run

Install Flutter, then run:

```powershell
flutter pub get
flutter run
```

Optional Supabase config can be passed at build time:

```powershell
flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

The app uses realistic local demo data until a backend is connected.

## Backend

Supabase SQL is in `supabase/schema.sql`, with development seed data in `supabase/seed.sql`.
