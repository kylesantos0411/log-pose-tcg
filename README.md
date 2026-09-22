# 🧭 LOG POSE TCG (One Piece Card Game Companion & Price Tracker)

> **The modern, clean collection manager and market tracker for Japanese One Piece Card Game collectors.**  
> Developed by **Kyle Santos** • Fan-made application.

---

## 🌟 Key Highlights & Features

- 🎴 **100% Japanese One Piece Database:** 4,511+ official cards and 60 sets indexed directly from Bandai, including Alternate Arts, Manga Rares, SPs, Promo Packs, and Tournament Winner prizes.
- 📱 **Clean Mobile Experience:** Asymmetrical bento grid, 3-column pure card art grid, and collapsible filter drawer matching native iOS & Android guidelines.
- 📲 **Progressive Web App (PWA):** Installs directly to your home screen via Safari or Chrome with native standalone status bar and dark squircle branding.
- 📷 **AI Card Lens Scanner:** Camera viewfinder with instant card recognition and official Bandai database matching.
- 👥 **Pirate Community & Friends:**
  - Personalized **Collector Tags** (e.g. `PIRATE-KYLE-7721`) and tournament QR codes.
  - Interactive friend showcase binders with real-time valuations.
  - **Trade Radar:** Automated fair-trade matchmaker that cross-references your wishlist with your friends' trade duplicates.
- ☕ **Voluntary Community Support:** 100% ad-free and subscription-free. Supported purely through voluntary coffee tips for server maintenance.

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kylesantos0411/log-pose-tcg.git
   cd log-pose-tcg
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 1-Click Deployment to Vercel

This repository is optimized for deployment on [Vercel](https://vercel.com):

1. Import this repository into Vercel.
2. Framework Preset: **Next.js**.
3. Build Command: `npm run build` (auto-generates Prisma client and static routes).
4. Click **Deploy** — your live app will be accessible worldwide on HTTPS with PWA installation ready!

---

## 📄 License & Disclaimer

*LOG POSE TCG is an unofficial fan-made project developed by Kyle Santos. All One Piece Card Game imagery and trademarks are © Eiichiro Oda / Shueisha, Toei Animation, and Bandai Co., Ltd.*
