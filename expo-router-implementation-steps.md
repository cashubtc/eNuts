# Expo Router Implementation Steps

This document is the working execution plan for the Expo Router refactor.

Use it as the source of truth while implementing. Do not skip ahead unless the current step is complete or deliberately blocked.

Related documents:

- `expo-router-migration-plan.md`
- `expo-router-migration-issues.md`

## Working Rules

1. Keep each implementation slice small enough to verify before moving on.
2. Prefer route wrappers in `src/app/**` over moving screen files immediately.
3. Do not refactor unrelated business logic while changing navigation.
4. Prefer serializable route params. If that is not possible, stop and introduce a small flow-state mechanism explicitly.
5. Keep old navigation code in place until the replacement path is verified.
6. After each step, confirm the app still boots and the touched flow still works.

## Decision Baseline

These decisions are assumed unless changed later:

1. Use Expo Router with thin wrappers in `src/app/**` first.
2. Use direct route paths instead of nested `{ screen: ... }` navigation.
3. Replace operation-object route params with `operationId` lookup.
4. Leave broader payment-flow object cleanup until after the router shell is stable.

## Step 0: Preflight

Related issues:
`ER-09`, `ER-20`

Goal:
Start with a clean understanding of the live route surface before changing startup.

Tasks:

1. Freeze the canonical route list from the current live navigator tree.
2. Mark stale route names and dead callers as cleanup targets, not active requirements.
3. Confirm the target route tree to implement under `src/app/**`.

Deliverable:
One canonical route inventory for the migration.

Checkpoint:
There is no ambiguity about which routes must keep working in the first Router pass.

## Step 1: Install and wire Expo Router entry

Related issues:
`ER-01`

Goal:
Make Expo Router own app startup without breaking the current polyfills.

Tasks:

1. Add `expo-router` dependency.
2. Create a custom app entry file.
3. In that entry file, import:
   - `src/shim`
   - `message-port-polyfill`
   - `expo-router/entry` last
4. Update `package.json` `main` to the new entry file.
5. Add the `expo-router` plugin to `app.json`.
6. Add an app `scheme` to `app.json`.
7. Enable `experiments.typedRoutes` in `app.json`.

Deliverable:
The app boots through Expo Router entry instead of `registerRootComponent(App)`.

Checkpoint:
The app starts successfully and polyfill-dependent code still initializes.

Stop condition:
If startup breaks before any routing changes, fix entry/config before continuing.

## Step 2: Create the root Router layout and move bootstrap into it

Related issues:
`ER-02`, `ER-05`

Goal:
Move the existing app shell into `src/app/_layout.tsx`.

Tasks:

1. Create `src/app/_layout.tsx`.
2. Move provider composition from `src/components/App.tsx` into the root layout.
3. Move app initialization logic into the root layout or a shared helper used by it.
4. Preserve:
   - splash screen control
   - manager initialization
   - theme provider
   - prompt, bottom sheet, keyboard, safe area, menu, and modal providers
5. Replace the local `NavigationContainer` with Router-compatible theme wiring.
6. Render a blank/loading state until initialization completes.

Deliverable:
The app shell exists entirely under `src/app/_layout.tsx`.

Checkpoint:
The app boots to a blank/loading placeholder, then renders successfully with all providers active.

Stop condition:
If initialization order changes break manager setup, fix that before any route work.

## Step 3: Add root routes with wrappers only

Related issues:
`ER-03`, `ER-04`

Goal:
Recreate the top-level app routes in Expo Router with minimal logic changes.

Tasks:

1. Create root route files:
   - `src/app/index.tsx`
   - `src/app/onboarding.tsx`
   - `src/app/dashboard.tsx`
   - `src/app/qr-scanner.tsx`
2. Make each route file a thin wrapper around the existing screen component.
3. Implement `src/app/index.tsx` redirect logic using the existing onboarding decision.
4. Update onboarding completion to Router navigation.

Deliverable:
The app can reach onboarding, dashboard, and QR scanner through file-based routes.

Checkpoint:
Fresh-install and returning-user entry behavior matches the current app.

Stop condition:
If the app can boot but cannot route to dashboard/onboarding reliably, fix that before adding nested layouts.

## Step 4: Add nested folder layouts for stable sections

Related issues:
`ER-03`, `ER-19`

Goal:
Recreate the nested stack structure in Router form for the low-risk sections first.

Tasks:

1. Create layouts for:
   - `src/app/settings/_layout.tsx`
   - `src/app/mint/_layout.tsx`
   - `src/app/history/_layout.tsx`
   - `src/app/restore/_layout.tsx`
   - `src/app/payment/_layout.tsx`
2. Create route wrappers for each existing screen in those groups.
3. Preserve screen options currently set in stack navigators.
4. Keep screen files in `src/screens/**` for now.

Deliverable:
The file-based route tree mirrors the current stack tree.

Checkpoint:
The main sections open via Expo Router paths and render the current screens.

## Step 5: Convert simple navigation calls first

Related issues:
`ER-06`, `ER-19`

Goal:
Replace the easiest imperative navigation calls before touching param-heavy flows.

Tasks:

1. Convert simple `goBack` calls to `router.back()` where possible.
2. Convert simple route pushes/replaces that do not carry complex params.
3. Replace nested navigator calls such as:
   - `navigate("Settings", { screen: ... })`
   - `navigate("Mint", { screen: ... })`
   - `navigate("History", { screen: ... })`
     with direct route paths.
4. Leave complex route params on the old screen prop model temporarily if necessary.

Suggested targets first:

- settings entry
- dashboard to simple routes
- mint home to mint add
- history index open/close

Deliverable:
The app uses Router navigation for the simplest paths first.

Checkpoint:
No behavior change in simple route transitions.

## Step 6: Keep low-level navigation hooks only where needed

Related issues:
`ER-08`

Goal:
Preserve critical flow guards while removing unnecessary dependency on screen props.

Tasks:

1. Identify screens that truly need `useNavigation()` for listeners.
2. Leave `beforeRemove` listeners in place for now on:
   - dashboard
   - processing
   - success
   - successScreen
   - recovering
   - processingError
3. Verify `useFocusEffect` behavior on:
   - invoice
   - QR scanner
   - animated QR hook

Deliverable:
Lifecycle-sensitive screens still work after route conversion.

Checkpoint:
Back-blocking and focus reset still behave correctly on touched flows.

## Step 7: Implement the mint invoice `operationId` refactor

Related issues:
`ER-13`

Goal:
Remove prepared mint operation objects from route params.

Tasks:

1. Change the prepare-and-navigate flow in `MintSelectAmount` to pass only `operationId`.
2. Update the route type and route wrapper for the invoice screen accordingly.
3. Update `Invoice` to look up the prepared operation using the ID.
4. Use the looked-up operation for:
   - QR display
   - amount display
   - finalization event matching
5. Add graceful fallback behavior if the operation cannot be found.

Deliverable:
The mint invoice route only carries `operationId`.

Checkpoint:
Creating an invoice, waiting for it to finalize, and navigating to success still works.

Stop condition:
If there is no reliable operation lookup API, pause and introduce a tiny session map deliberately.

## Step 8: Implement the melt confirmation `operationId` refactor

Related issues:
`ER-14`

Goal:
Remove prepared melt operation objects from route params.

Tasks:

1. Change both melt-entry callers to pass only `operationId`.
2. Update the melt confirmation route type and route wrapper.
3. Update `MeltConfirmation` to look up the prepared operation by ID.
4. Use the looked-up operation for:
   - amount display
   - fee display
   - execute call
   - success payload construction
5. Review whether `MeltLnAddress` still needs route metadata, and minimize it if possible.

Deliverable:
The melt confirmation route only carries `operationId`.

Checkpoint:
The LN payout flow still reaches confirmation and can execute successfully.

## Step 9: Convert history details to stable-key routing

Related issues:
`ER-11`

Goal:
Stop passing full `HistoryEntry` objects through the route layer.

Tasks:

1. Decide on the history detail key.
2. Update the history list/detail navigation to route by key.
3. Update the detail screen to rehydrate the entry from the key.
4. Add a not-found fallback if the entry cannot be resolved.

Deliverable:
History detail navigation no longer depends on a full entry object in params.

Checkpoint:
Opening history details from dashboard and history screens still works.

## Step 10: Fix the recovery flow handoff

Related issues:
`ER-12`

Goal:
Make the recovery flow Router-safe and correct the current mint-selection handoff.

Tasks:

1. Decide on the recovery flow state holder.
2. Store selected mint URLs from `SelectRecoveryMint` in that holder.
3. Store or derive the recovery seed outside the route params.
4. Update `Recover` and `Recovering` to consume that state without passing `Uint8Array` in params.
5. Verify the selected-mints choice actually reaches the recovery logic.

Deliverable:
Recovery state is not passed through route params and the user’s mint selection is preserved.

Checkpoint:
Selecting a subset of mints and completing recovery works as intended.

## Step 11: Convert mint details routing to a safe URL form

Related issues:
`ER-10`

Goal:
Make mint details routing safe for arbitrary mint URLs.

Tasks:

1. Choose the route form:
   - query param
   - encoded path segment
2. Update mint details navigation to use that form.
3. Update the mint details screen to decode/read the route input.

Deliverable:
Mint details routing works for any valid mint URL.

Checkpoint:
Mints with normal HTTPS URLs and any trailing path content still open correctly.

## Step 12: Refactor the encoded token route

Related issues:
`ER-15`

Goal:
Stop passing `Token` objects through route params.

Tasks:

1. Decide whether the token can be serialized safely enough for a query param.
2. If not, introduce a small flow-state holder keyed by ID.
3. Update the send flow and encoded token screen to use the new route payload.

Deliverable:
The encoded token route uses only simple route data.

Checkpoint:
Creating and viewing a sendable token still works.

## Step 13: Refactor the broader payment flow objects

Related issues:
`ER-16`, `ER-17`

Goal:
Remove the remaining rich objects from coin-selection, processing, and error routes.

Tasks:

1. Identify the minimum state required across:
   - select-mint-to-swap-to
   - coin-selection
   - processing
   - processing-error
2. Introduce a payment flow state holder if needed.
3. Route by flow ID and small primitives only.
4. Simplify `processingError` to minimal UI params.

Deliverable:
The payment pipeline no longer depends on non-serializable route params.

Checkpoint:
Send, melt, and swap-related flows still work end to end.

## Step 14: Consolidate success handling

Related issues:
`ER-18`

Goal:
Reduce the migration surface by choosing one success screen.

Tasks:

1. Compare `Success.tsx` and `SuccessScreen.tsx` responsibilities.
2. Choose the canonical screen.
3. Move callers to that screen.
4. Delete the duplicate route and dead param model.

Deliverable:
One success route remains.

Checkpoint:
All current success-entry points still land on the intended UI.

## Step 15: Finish screen-level Router API migration

Related issues:
`ER-06`

Goal:
Replace the remaining screen-prop route access with Router hooks.

Tasks:

1. Convert remaining screens from `{ navigation, route }` props to Router hooks.
2. Keep `useNavigation()` only where event listeners still require it.
3. Remove route-prop dependency from reusable components where possible.

Deliverable:
Live screens access routing through Expo Router-first APIs.

Checkpoint:
No touched screen still depends on old screen-prop typing unless explicitly deferred.

## Step 16: Clean up route drift and dead paths

Related issues:
`ER-09`, `ER-20`

Goal:
Delete dead route names and references after the live replacements exist.

Tasks:

1. Remove stale route names from the nav type layer.
2. Remove dead callers such as:
   - `mintmanagement`
   - `selectAmount`
   - `nostrReceive`
   - `qr scan`
3. Normalize any remaining route names to the Router naming scheme.

Deliverable:
Only live Router-backed route names remain.

Checkpoint:
Searches no longer show callers to removed routes.

## Step 17: Remove the old nav type files

Related issues:
`ER-21`

Goal:
Delete the obsolete React Navigation param-list model.

Tasks:

1. Remove imports from `src/model/nav.ts` and `src/nav/navTypes.ts` as screens are converted.
2. Delete those files once nothing live depends on them.
3. Replace any remaining shared types with local interfaces or non-navigation domain types.

Deliverable:
The old nav typing layer is gone.

Checkpoint:
No live import path points at the old nav type files.

## Step 18: Remove the old manual navigation layer

Related issues:
`ER-22`

Goal:
Delete the old navigator implementation completely.

Tasks:

1. Remove:
   - `src/components/nav/Navigator.tsx`
   - `src/nav/SettingsNavigator.tsx`
   - `src/nav/MintNavigator.tsx`
   - `src/nav/RestoreNavigator.tsx`
   - `src/nav/HistoryNavigator.tsx`
2. Remove any helper code that only existed for the manual stack layer.
3. Keep only the minimum low-level navigation code still needed by Router-based listeners.

Deliverable:
The app navigates entirely through Expo Router.

Checkpoint:
No manual navigator file remains in live use.

## Final Verification Pass

Run through these flows after Step 18:

1. cold start to onboarding and dashboard
2. dashboard to settings, mint, history, restore, send, melt, scan
3. mint add
4. mint invoice creation and success transition
5. melt input to confirmation to success
6. QR scan to melt or claim paths
7. history details
8. recovery with selected mints
9. success and processing back behavior
10. deep-link intake behavior for payment payloads

## If Blocked

If a step is blocked, do not keep patching around it blindly.

Instead:

1. write down the exact blocker
2. decide whether it is a lookup problem, a route-shape problem, or a state-handoff problem
3. add a targeted sub-step to this document or the issue list
4. resume from the last verified checkpoint
