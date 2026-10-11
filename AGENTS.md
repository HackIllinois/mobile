# AGENTS.md

Guidance for AI coding agents (and new contributors) working in the HackIllinois mobile app.

## Stack

- Expo SDK 54, React Native 0.81, React 19, TypeScript (strict). New Architecture is on.
- Routing: Expo Router (file-based). Data: TanStack React Query + Axios.
- Backend: Adonix, at `https://adonix.hackillinois.org`. API docs: `https://adonix.hackillinois.org/docs/json`.

## Commands

```bash
npm install            # install dependencies
npm start              # expo start (dev server)
npm run ios            # native build + run on iOS
npm run android        # native build + run on Android
npx tsc --noEmit       # type check
```

- There is no test suite and no lint script.
- `npx tsc --noEmit` already reports errors on `main`. Compare the error list before and after your change. Do not add new errors.
- `/ios` and `/android` are prebuild output and are git-ignored. Do not commit them.

## How the app starts

1. `package.json` `"main"` → `index.ts`, which only does `import "expo-router/entry"`.
2. `app/_layout.tsx` is the root shell: fonts, loading screen, onboarding, version gate, prefetch of events / shop items / profile, and the `QueryClientProvider`.
3. `app/index.tsx` redirects to `(tabs)/Home` if SecureStore has `jwt` or `isGuest`, else to `AuthScreen`.
4. `app/(tabs)/_layout.tsx` holds the tab bar. Tabs: Home, Event, Shop, Scan, Duels, Profile.

`App.tsx` and `MainScreen.tsx` are an old React Navigation setup. Nothing loads them. Do not add code there.

## Where code goes

| Folder | Put here |
|---|---|
| `app/` | Routes. The file path is the route. `(tabs)` is a route group (no URL segment). |
| `screens/` | Large screen bodies that a route renders (for example `Profile.tsx` → `ProfileScreen`). |
| `components/<feature>/` | UI parts, grouped by feature. Note: `point shop` and `qr scanner` have spaces in their names. |
| `lib/` | Data fetching (`fetchX.ts` = fetch function + `useX` React Query hook) and non-UI helpers. |
| `types/index.ts` | All shared types. Do not declare types inside `lib/` files. |
| `api.ts` | The single Axios client. Change it only to change behavior for every request. |
| `contexts/` | React context providers. |
| `modules/local-connection/` | Local Expo native module (Kotlin + Swift), used by Duels. |
| `plugins/` | Expo config plugins (run at build time, registered in `app.json`). |
| `assets/` | Images, SVGs, fonts, Lottie files. |

Avoid `src/`. It only holds `src/components/loading/LoadingScreen.tsx` (used) and `src/firebase/` (unused).

## Types

- Backend types are generated. Regenerate after backend changes:
  ```bash
  npx openapi-typescript https://adonix.hackillinois.org/docs/json -o types/generated-types.ts
  ```
- Never edit `types/generated-types.ts` by hand.
- For an API shape, add an alias in `types/index.ts`:
  `export type Event = components["schemas"]["Event"];`
  Check `components["schemas"]` before you write a type by hand.
- Hand-write a type only for data the API does not send (values the app computes). Extend the generated type with `&` when you add app-only fields.

## Data fetching

- New resource → new `lib/fetchX.ts` with a fetch function and a `useX` hook built on `useQuery`. Use the shared `queryClient` from `lib/queryClient.ts`.
- Use `api` from `api.ts` for backend calls. It adds `Authorization: Bearer <jwt>`, shows an error toast, and sends the user to login on an invalid or expired token (not for guests).
- `fetchEvents` and `fetchShopItems` use plain `fetch()` for public endpoints. They get no auth header and no toast.

## Auth and storage keys

- SecureStore: `jwt`, `isGuest`, `userRoles` (JSON array, for example `["STAFF"]`, `["GUEST"]`).
- AsyncStorage: `hasCompletedOnboarding`, `savedEvents`, `versionUpdateRequired`.
- Login: `app/AuthScreen.tsx` (Google / GitHub via Adonix, redirect `hackillinois://auth`). `app/auth.tsx` is the Android callback.
- Role checks: the Scan tab shows the staff scanner for `STAFF` or `ADMIN`. See also `hasNonProfileRole()` in `lib/fetchProfile.ts`.

## UI conventions

- Styles use `StyleSheet.create` in the same file. There is no UI component library.
- Max app width is 500 px: use `MAX_APP_WIDTH` / `getConstrainedWidth()` from `lib/layout.ts`.
- Fonts (loaded in `app/_layout.tsx`): `Tsukimi-Rounded-Bold`, `Jedi-Font`, `Montserrat-Bold`, `Montserrat-Bold-700`.
- SVGs import as components (`react-native-svg-transformer`, see `metro.config.js` and `declarations.d.ts`).
- Use `expo-haptics` on primary presses, to match existing screens.

## Known traps

- Two components are named `PointShop`. The live one is `app/(tabs)/Shop.tsx`. `screens/PointShop.tsx` is dead (only `App.tsx` imports it).
- `modules/local-connection/android/build/` contains build output that is tracked in git. Do not add more.
- `inspect.json/` is a folder that holds a copy of `eas.json`, not a JSON file.

## Commits and PRs

- Branch from `main`. Keep one topic per PR.
- In the PR description, say how you verified the change (for example the `tsc` comparison, or the screens you tested on device / simulator).
