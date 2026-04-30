# Expo Router Migration Plan

## Goal

Migrate the app from manual React Navigation stacks to Expo Router with the smallest safe refactor first, then clean up the flows that currently depend on non-serializable navigation params.

## Target Route Tree

```text
src/app/
  _layout.tsx
  index.tsx
  onboarding.tsx
  dashboard.tsx
  qr-scanner.tsx

  settings/
    _layout.tsx
    index.tsx
    display.tsx
    language.tsx
    currency.tsx
    nfc.tsx
    view-mnemonic.tsx

  mint/
    _layout.tsx
    index.tsx
    add.tsx
    [mintUrl].tsx

  history/
    _layout.tsx
    index.tsx
    [entryId].tsx

  restore/
    _layout.tsx
    index.tsx
    recover.tsx
    recovering.tsx

  payment/
    _layout.tsx
    send-select-amount.tsx
    mint-select-amount.tsx
    melt-input.tsx
    melt-ln-address.tsx
    melt-confirmation.tsx
    processing.tsx
    processing-error.tsx
    mint-invoice.tsx
    encoded-token.tsx
    success.tsx
    success-screen.tsx
    select-mint-to-swap-to.tsx
    coin-selection.tsx
```

Notes:

- `index.tsx` should choose between onboarding and dashboard.
- Nested stacks map naturally to folder `_layout.tsx` files.
- Route names should be normalized to lowercase kebab-case.

## Phase 1: Router Scaffolding

1. Add Expo Router dependency and config.
2. Change entry from `index.ts` / `src/components/App.tsx` to Expo Router entry.
3. Add the `expo-router` plugin to `app.json`.
4. Create `src/app/_layout.tsx`.
5. Move root providers and app initialization from `src/components/App.tsx` into the root layout.
6. Replace `NavigationContainer` usage with Router-managed navigation plus React Navigation `ThemeProvider`.

Expected output:

- The app boots through Expo Router.
- No screen behavior changes yet beyond the routing shell.

## Phase 2: Mechanical Route Migration

1. Replace `Navigator.tsx` and nested stack components with folder layouts.
2. Re-export or move existing screens into `src/app/**`.
3. Preserve screen options in layout files:
   - `headerShown: false`
   - `animation`
   - `gestureEnabled`
   - `navigationBarColor`
4. Preserve onboarding entry behavior with redirect logic in `src/app/index.tsx`.

Expected output:

- Existing screens are reachable through file-based routes.
- Root and nested stacks behave roughly the same.

## Phase 3: Navigation API Migration

1. Replace screen props `{ navigation, route }` with Expo Router hooks where possible.
2. Migrate imperative calls:
   - `navigation.navigate(...)` to `router.navigate(...)` or `router.push(...)`
   - `navigation.replace(...)` to `router.replace(...)`
   - `navigation.goBack()` to `router.back()`
3. For screens that still need low-level navigation events, keep `useNavigation()` from Expo Router.

Expected output:

- Screens stop depending on React Navigation screen prop injection.
- Route typing starts shifting away from `RootStackParamList`.

## Phase 4: Param Refactor Hotspots

This is the main migration risk.

Expo Router works best when route params are simple serializable values. The current app passes rich in-memory objects between screens.

### Current high-risk flows

- `MintSelectAmount -> mintInvoice` passes `operation`
- `MeltInput` / `MeltLnAddress -> MeltConfirmation` passes `operation` and metadata objects
- `SendSelectAmount -> encodedToken` passes a token object
- `Recover -> Recovering` passes `Uint8Array`
- `History list -> details` passes a full `HistoryEntry`

### Recommended refactor pattern

- `history/[entryId].tsx`
  Use a stable ID or re-query from store/context instead of passing the full `entry` object.
- `mint/[mintUrl].tsx`
  Keep this string-param based route; it already fits Expo Router well.
- `restore/recovering.tsx`
  Do not pass `Uint8Array` in route params. Persist temporary recovery input in context, store, or an ephemeral session map.
- `payment/mint-invoice.tsx`
  Do not pass prepared operation objects through the route. Either prepare on the destination screen or save the prepared operation in ephemeral state keyed by an ID.
- `payment/melt-confirmation.tsx`
  Same as above.
- `payment/encoded-token.tsx`
  Prefer storing the generated token in ephemeral state and navigating by an ID.

Expected output:

- Routes only use simple params like strings, numbers, and booleans.
- Flow screens become Router-compatible and more deep-link-safe.

## Phase 5: Type Migration

1. Remove dependence on `src/model/nav.ts` and `src/nav/navTypes.ts`.
2. Replace screen prop types with:
   - `useLocalSearchParams`
   - Router typed hrefs
   - local prop interfaces for non-route props
3. Keep a small temporary compatibility layer only if needed during migration, then delete it.

Expected output:

- Navigation typing becomes route-string based instead of stack-param-list based.
- Dead route names disappear.

## Phase 6: Back-Blocking And Flow Guards

The current app uses `beforeRemove` listeners in a few screens to block accidental exits, including:

- dashboard
- processing
- success
- recovering

Plan:

1. Audit each `beforeRemove` usage.
2. Keep low-level `useNavigation().addListener("beforeRemove", ...)` where still needed.
3. Replace with simpler route structure or redirect logic where possible.

Expected output:

- No regression in protected or critical flows.
- Back behavior stays intentional.

## Phase 7: Cleanup

1. Delete:
   - `src/components/nav/Navigator.tsx`
   - `src/nav/SettingsNavigator.tsx`
   - `src/nav/MintNavigator.tsx`
   - `src/nav/RestoreNavigator.tsx`
   - `src/nav/HistoryNavigator.tsx`
2. Remove unused React Navigation types and imports.
3. Remove stale route names from `src/model/nav.ts` and `src/components/Empty.tsx`.
4. Normalize route naming.

## Risk List

### Highest risk

- Passing non-serializable objects in params
- Recovery flow using `Uint8Array`
- Operation-preparation flows that assume in-memory handoff between screens

### Medium risk

- `beforeRemove` behavior changes
- onboarding redirect logic
- theme/provider bootstrapping during root layout migration

### Low risk

- nested stack structure
- settings, mint, history, and restore route mapping
- mint details route keyed by `mintUrl`

## Decisions To Make Early

1. Choose a temporary state strategy for flow objects:
   - context
   - store
   - small in-memory session map
2. Decide whether to physically move screen files into `src/app` or keep screens in `src/screens` and create thin route wrappers.
3. Decide whether to do a compatibility-first migration or a cleanup-first migration.

Recommendation:

1. Use thin `src/app/**` wrappers first.
2. Use a small ephemeral flow-state store for non-serializable objects.
3. Convert high-risk flows one by one after the router shell is live.

## Recommended Execution Order

1. Router install, config, and root layout.
2. File-based stacks for dashboard, settings, mint, history, and restore.
3. Simple string-param routes first.
4. History details refactor.
5. Recovery flow refactor.
6. Mint and melt operation flow refactors.
7. Success, processing, and back-blocking audit.
8. Delete the old nav layer and old nav types.

## Definition Of Done

- App boots via Expo Router.
- Onboarding and dashboard entry works.
- All current screens are reachable.
- No route depends on non-serializable params.
- No remaining imports from old navigator files.
- Critical back-blocked flows still behave correctly.

## Next Step

Turn this into a route-by-route issue list, starting with the non-serializable param flows.
