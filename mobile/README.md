# TendX Mobile (Phase 3 scaffold)

React Native (Expo + expo-router) app that shares the **same API** as the TendX
web app (Build Spec section 6.9). No separate backend: it reads the existing
`GET /api/tenders` and `GET /api/dashboard/summary` endpoints.

## Screens
- **Home** — "Welcome back, {firstName}", "{n} new tenders match you", a
  high-match alert banner, and a "Matched for you" list (sector, match %, title,
  value, city, days left) with "See all".
- **Tenders** — the full matched-tender feed.
- **Bids / Settings** — placeholder tabs (full flows live on web for now).
- Bottom tab bar across all four.

## Run it
1. Start the web app so the API is live (from the repo root):
   ```
   npm run dev          # serves http://localhost:3000
   ```
2. Point the app at that API:
   ```
   cd mobile
   copy .env.example .env        # Windows  (cp on macOS/Linux)
   ```
   On a **physical phone** set `EXPO_PUBLIC_API_URL` to your machine's LAN IP
   (e.g. `http://192.168.1.20:3000`) since `localhost` resolves to the phone.
   The iOS simulator can use `localhost`; the Android emulator uses
   `http://10.0.2.2:3000`.
3. Install and start Expo:
   ```
   npm install
   npx expo start
   ```
   Press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with
   the Expo Go app on a device.

## Notes
- Brand tokens are mirrored in `lib/theme.ts` to match the web design system.
- The API client lives in `lib/api.ts` (base URL from `EXPO_PUBLIC_API_URL`).
- This is a Phase 3 scaffold: Home and Tenders are wired to live data; deeper
  flows (analyzer, bid pack, sourcing) follow in later phases.
