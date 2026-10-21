# AGENTS.md

Guidance for AI coding agents (and new contributors) working in the HackIllinois mobile app.

## Overview

- Expo + React Native app, written in TypeScript (strict).
- Routing uses Expo Router: screens are files under `app/`.
- Data comes from the HackIllinois backend (Adonix). Fetching and caching use React Query.

## Commands

```bash
npm install          # install dependencies
npm start            # start the Expo dev server
npm run ios          # build and run on iOS
npm run android      # build and run on Android
npx tsc --noEmit     # type check
```

There is no test suite or lint script. Before you open a PR, run the type check and make sure your change adds no new errors.

## Conventions

- **Types:** put shared types in `types/`. Backend types are generated from the Adonix OpenAPI spec (see the comment in `types/index.ts`). Use a generated type when one exists, and do not edit the generated file by hand. Write a type by hand only for data the app makes itself.
- **Backend calls:** use the shared client in `api.ts`. It adds the auth token and handles errors in one place.
- **Data fetching:** put fetch functions and React Query hooks in `lib/`.
- **UI:** keep screens in `app/` (and `screens/` for large ones). Keep reusable parts in `components/`, grouped by feature.
- **Styling:** follow the existing look. Match the fonts, colors, and `StyleSheet` patterns in nearby files.
- Do not commit generated native folders (`/ios`, `/android`) or build output.

## Before you change code

- Read the nearby files first, and follow their patterns.
- The codebase changes often. Check the current code. Do not trust this file for file names or details.

## Pull requests

- Branch from `main`, and keep one topic per PR.
- In the PR description, say how you checked the change (type check, and the screens you tested on a device or simulator).
