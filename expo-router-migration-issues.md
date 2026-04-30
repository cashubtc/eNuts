# Expo Router Migration Issues

This checklist breaks the migration into discrete issues that can be handled one by one.

Recommended order:

1. ER-01
2. ER-02
3. ER-03
4. ER-04
5. ER-05
6. ER-06
7. ER-07
8. ER-08
9. ER-09
10. ER-10
11. ER-11
12. ER-12
13. ER-13
14. ER-14
15. ER-15
16. ER-16
17. ER-17
18. ER-18

## ER-01: Add Expo Router entry and app config

- [ ] Status: open

Why:
The app still boots through `index.ts` and `registerRootComponent`. Expo Router needs to own the entry point.

Files:
`package.json`
`index.ts`
`app.json`

Current problem:
`package.json` uses `"main": "index.ts"`.
`index.ts` imports shims and mounts `src/components/App`.
`app.json` does not yet declare the Expo Router plugin, a `scheme`, or typed routes.

Suggested fix:
Create a custom root entry file that preserves the current side effects:
`src/shim`
`message-port-polyfill`
Then import `expo-router/entry` last.
Update `package.json` to point `main` at that custom entry file.
Add the `expo-router` plugin to `app.json`.
Add an app `scheme`.
Enable `experiments.typedRoutes`.

Done when:
The app starts through Expo Router without losing the current polyfills.

## ER-02: Move root bootstrap into `src/app/_layout.tsx`

- [ ] Status: open

Why:
The current bootstrap logic lives in `src/components/App.tsx`, but Expo Router expects the root layout to be the top-level app shell.

Files:
`src/components/App.tsx`
`src/app/_layout.tsx`

Current problem:
`App.tsx` owns:
provider composition
splash screen coordination
theme wiring
manager initialization
onboarding flag calculation

Suggested fix:
Move the root provider tree and initialization flow into `src/app/_layout.tsx`.
Keep the current initialization order intact.
Render a blank/loading placeholder until the manager is ready.

Done when:
`RootApp` and the old `App` shell are no longer responsible for navigation startup.

## ER-03: Replace manual navigator files with file-based layouts

- [ ] Status: open

Why:
The app currently depends on React Navigation stack files instead of file-based routes.

Files:
`src/components/nav/Navigator.tsx`
`src/nav/SettingsNavigator.tsx`
`src/nav/MintNavigator.tsx`
`src/nav/RestoreNavigator.tsx`
`src/nav/HistoryNavigator.tsx`
`src/app/**`

Current problem:
All live routes are registered manually in stack components.

Suggested fix:
Create the `src/app/**` route tree and corresponding `_layout.tsx` files.
Start with thin route wrappers that re-export the current screens instead of moving screen files immediately.
Preserve existing stack options in the new layouts.

Done when:
The live route tree is represented in `src/app/**` and the old navigator files are unused.

## ER-04: Recreate onboarding entry logic with router redirects

- [ ] Status: open

Why:
The current initial route is chosen with `initialRouteName={shouldOnboard ? "onboarding" : "dashboard"}`.

Files:
`src/components/nav/Navigator.tsx`
`src/components/App.tsx`
`src/screens/Onboarding.tsx`
`src/app/index.tsx`

Current problem:
Expo Router does not use `initialRouteName` the same way for app startup.

Suggested fix:
Use `src/app/index.tsx` to redirect to `/onboarding` or `/dashboard` based on the existing `STORE_KEYS.explainer` check.
Update onboarding completion to use `router.replace("/dashboard")`.

Done when:
Fresh installs land on onboarding and returning users land on dashboard.

## ER-05: Replace `NavigationContainer` with router-compatible theme wiring

- [ ] Status: open

Why:
Expo Router manages the navigation container internally.

Files:
`src/components/App.tsx`
`src/styles/colors.ts`

Current problem:
`ThemedNavigationContainer` wraps the whole app in a manual `NavigationContainer`.

Suggested fix:
Remove the manual container.
Keep the theme object only where still needed through Expo Router-compatible wiring.
Verify there is no remaining dependency on `NavigationContainer` ownership.

Done when:
Theme behavior is preserved without a local `NavigationContainer`.

## ER-06: Replace screen-prop navigation types with Router hooks

- [ ] Status: open

Why:
Large parts of the app are typed against `RootStackParamList`, nested stack param lists, and `NativeStackScreenProps`.

Files:
`src/model/nav.ts`
`src/nav/navTypes.ts`
`src/screens/**`
`src/components/**`

Current problem:
Route access is tightly coupled to React Navigation screen props.

Suggested fix:
Convert screens incrementally to:
`useRouter()`
`useLocalSearchParams()`
`useNavigation()` only where low-level listeners are required
Delete old param-list types as each area migrates.

Done when:
Live screens no longer require React Navigation screen prop injection.

## ER-07: Audit custom deep-link intake alongside Expo Router

- [ ] Status: open

Why:
The app already consumes incoming URLs for Cashu tokens and invoices through `Linking`, while Expo Router also uses deep linking.

Files:
`src/context/Linking.tsx`
`src/screens/Payment/Send/CoinSelection.tsx`
`src/screens/Payment/Processing.tsx`
`app.json`

Current problem:
The app needs both:
route deep links for app navigation
raw external URL intake for token/invoice handling

Suggested fix:
Decide which incoming URLs should be treated as Expo Router routes and which should be treated as raw payloads.
Preserve the existing token/invoice capture behavior.
Verify the chosen `scheme` does not break current payment flows.

Done when:
Expo Router deep linking and Cashu/LNURL intake can coexist predictably.

## ER-08: Audit `beforeRemove` and focus-based navigation behavior

- [ ] Status: open

Why:
Several screens rely on navigation lifecycle hooks to block exits or restart focus-based behavior.

Files:
`src/components/nav/utils.ts`
`src/screens/Dashboard.tsx`
`src/screens/Payment/Processing.tsx`
`src/screens/Payment/ProcessingError.tsx`
`src/screens/Payment/Success.tsx`
`src/screens/Payment/SuccessScreen.tsx`
`src/screens/Restore/Recovering.tsx`
`src/screens/Payment/Receive/Invoice.tsx`
`src/screens/QRScan/QrScannerScreen.tsx`
`src/components/hooks/AnimatedQr.ts`

Current problem:
The app depends on:
`beforeRemove`
`useFocusEffect`
route stack history inspection

Suggested fix:
Keep low-level navigation listeners only where they are still necessary.
Re-test back behavior on dashboard, processing, success, and recovery flows.
Confirm `useFocusEffect` still behaves correctly after migration.

Done when:
Critical flows still prevent accidental exits and focus-driven screens still reset correctly.

## ER-09: Normalize route names and remove route inventory drift

- [ ] Status: open

Why:
The current nav model includes live routes, stale routes, and mixed naming styles.

Files:
`src/model/nav.ts`
`src/nav/navTypes.ts`
`src/components/nav/Navigator.tsx`
`src/screens/Mints/components/MintItem.tsx`
`src/components/Empty.tsx`
`src/screens/Payment/Send/SelectMintToSwapTo.tsx`

Current problem:
There is route drift between the type layer and the live navigator tree.
Examples:
`selectAmount`
`selectMint`
`selectTarget`
`mintmanagement`
`mint info`
`mint proofs`
`disclaimer`
`Seed`
`Mnemonic`
`Advanced settings`
`nostrReceive`
`qr scan`

Suggested fix:
Make a definitive list of live routes.
Delete stale route names and dead navigation code.
Normalize live route names to lowercase kebab-case in Expo Router.

Done when:
There is exactly one canonical route inventory.

## ER-10: Make the Mint details route safe for Expo Router params

- [ ] Status: open

Why:
The mint details screen is a good Router candidate, but its current param is a full `mintUrl`.

Files:
`src/screens/Mints/MintHomeScreen.tsx`
`src/screens/Mints/MintSettingsScreen.tsx`

Current problem:
A raw mint URL contains `://` and `/`, which is awkward as a path segment.

Suggested fix:
Do not use a plain `[mintUrl].tsx` segment with an unencoded URL.
Either:
use a query param like `/mint/details?mintUrl=...`
or encode/decode the value before routing.

Done when:
Mint details routing works for any valid mint URL.

## ER-11: Replace full `HistoryEntry` route params with a stable lookup key

- [ ] Status: open

Why:
History detail routing currently passes the entire history object through navigation.

Files:
`src/screens/History/components/LatestHistoryWrapper.tsx`
`src/screens/History/Details.tsx`
`src/nav/navTypes.ts`

Current problem:
`HistoryEntryDetails` consumes `route.params.entry`, which is not Router-friendly.

Suggested fix:
Introduce a stable history detail key.
Route to that key instead of passing the whole object.
Look up the entry again from store, manager state, or a small session cache.

Done when:
History details can open without passing a full `HistoryEntry` through route params.

## ER-12: Fix the recovery flow state handoff

- [ ] Status: open

Why:
The recovery flow currently depends on non-serializable route state and also appears to drop the selected mint list.

Files:
`src/screens/Restore/SelectRecoveryMint.tsx`
`src/screens/Restore/Recover.tsx`
`src/screens/Restore/Recovering.tsx`
`src/nav/navTypes.ts`

Current problem:
`Recovering` expects `{ bip39seed: Uint8Array; mintUrls: string[] }`.
`Recover` passes a `Uint8Array` through navigation.
`SelectRecoveryMint` tracks `selectedMints` locally but does not forward them to `Recover`, and `Recover` later uses all known mints instead.

Suggested fix:
Move recovery state into a small ephemeral store or context.
Persist the chosen mint URLs there.
Persist the generated seed there as well.
Route to the next screen with a lightweight key or no payload at all.

Done when:
The selected mint list is preserved and the recovery flow no longer depends on `Uint8Array` route params.

## ER-13: Refactor the mint invoice flow to pass `operationId` instead of operation objects

- [ ] Status: open

Why:
The receive flow passes a prepared mint operation object directly into the invoice screen.

Files:
`src/screens/Payment/MintSelectAmount.tsx`
`src/screens/Payment/Receive/Invoice.tsx`
`src/model/nav.ts`

Current problem:
`MintSelectAmount` navigates with `{ mintUrl, operation }`.
`Invoice` currently reads `operation.id`, `operation.amount`, and `operation.request` directly from route params.

Suggested fix:
After `manager.ops.mint.prepare(...)`, pass only `operationId` in navigation.
Update `Invoice` to look up the operation by ID on the destination screen.
Use that looked-up operation for:
displaying the request QR
displaying the amount
matching manager finalization events

Done when:
The invoice route only carries `operationId`, and the destination screen resolves the operation from that ID.

## ER-14: Refactor the melt confirmation flow to pass `operationId` instead of operation objects

- [ ] Status: open

Why:
The LN payout flow currently passes prepared operations and metadata-rich payloads between screens.

Files:
`src/screens/Payment/MeltInput.tsx`
`src/screens/Payment/MeltLnAddress.tsx`
`src/screens/Payment/MeltConfirmation.tsx`
`src/model/nav.ts`

Current problem:
`MeltInput` and `MeltLnAddress` navigate with a prepared `operation` object.
`MeltConfirmation` currently reads the full operation from route params.
`MeltLnAddress` also passes metadata that should be reviewed separately.

Suggested fix:
After `manager.ops.melt.prepare(...)`, pass only `operationId` to `MeltConfirmation`.
Update `MeltConfirmation` to look up the prepared operation by ID on the destination screen.
Use the looked-up operation for:
displaying amount and fee reserve
executing the melt
building the success payload
Keep metadata out of route params unless the destination screen truly needs it; if it does, prefer recomputing or separately serializing only the minimal fields needed.

Done when:
The melt confirmation route only carries `operationId`, and the destination screen resolves the operation from that ID.

## ER-15: Refactor the encoded token screen to stop passing `Token` objects in params

- [ ] Status: open

Why:
The send flow currently passes a full Cashu `Token` object into the token display screen.

Files:
`src/screens/Payment/SendSelectAmount.tsx`
`src/screens/Payment/Send/EncodedToken.tsx`
`src/model/nav.ts`

Current problem:
`SendSelectAmount` navigates with `{ token }`.

Suggested fix:
Store the generated token in ephemeral flow state.
Navigate with a simple key.
Load the token again in `EncodedToken` from that key.

Done when:
The encoded token route only requires a serializable identifier.

## ER-16: Refactor the coin selection and processing flows to stop passing rich domain objects

- [ ] Status: open

Why:
These routes currently pass domain objects that are not a good fit for Router params.

Files:
`src/screens/Payment/Send/CoinSelection.tsx`
`src/screens/Payment/Processing.tsx`
`src/model/nav.ts`
`src/screens/Payment/Send/SelectMintToSwapTo.tsx`

Current problem:
The active param types include values like:
`IMintUrl`
`ITokenInfo`
`IProofSelection[]`
`targetMint`
`remainingMints`

Suggested fix:
Introduce a payment flow store keyed by flow ID.
Route between coin selection and processing using that ID.
Only keep small flags or IDs in the URL layer.

Done when:
The payment pipeline no longer depends on rich domain objects in route params.

## ER-17: Simplify `processingError` route params

- [ ] Status: open

Why:
The error route is close to safe already, but its type model still includes more context than it should.

Files:
`src/model/nav.ts`
`src/screens/Payment/Processing.tsx`
`src/screens/Payment/ProcessingError.tsx`

Current problem:
`processingError` still allows `mint?: IMintUrl` in the param model even though the screen mainly needs `errorMsg` and a little display context.

Suggested fix:
Reduce the route payload to the minimum the screen really needs.
Prefer simple primitives like:
`errorMsg`
`scan`
`source`

Done when:
The error route only carries simple UI state.

## ER-18: Consolidate the duplicate success screens

- [ ] Status: open

Why:
The app currently has both `success` and `successScreen`, with overlapping responsibilities.

Files:
`src/components/nav/Navigator.tsx`
`src/screens/Payment/Success.tsx`
`src/screens/Payment/SuccessScreen.tsx`
callers in payment and scanner flows

Current problem:
Two different success routes increase migration complexity and keep two param models alive.

Suggested fix:
Choose one canonical success route.
Move all callers to it.
Delete the other screen and its route type.

Done when:
There is exactly one success screen and one success param model.

## ER-19: Rewrite nested-stack route callers to direct Router paths

- [ ] Status: open

Why:
Several screens currently navigate into nested stacks by parent route name plus `{ screen: ... }` params.

Files:
`src/screens/Dashboard.tsx`
`src/screens/Settings/index.tsx`
`src/components/Balance.tsx`
`src/screens/History/components/LatestHistoryWrapper.tsx`
`src/screens/Mints/MintHomeScreen.tsx`

Current problem:
Current calls include patterns like:
`navigation.navigate("Settings", { screen: "SettingsMain" })`
`navigation.navigate("Mint", { screen: "MintHome" })`
`navigation.navigate("History", { screen: "HistoryEntryDetails", params: ... })`

Suggested fix:
Replace each nested navigator jump with a direct route path.
Examples:
`/settings`
`/mint`
`/history`

Done when:
No screen depends on nested-stack `{ screen: ... }` navigation patterns.

## ER-20: Resolve dead or unreachable payment and mint routes before migration cleanup

- [ ] Status: open

Why:
Some screens and route types appear to reference routes that are not part of the live navigator tree.

Files:
`src/model/nav.ts`
`src/screens/Mints/components/MintItem.tsx`
`src/screens/Payment/Send/SelectMintToSwapTo.tsx`
`src/components/Empty.tsx`

Current problem:
Examples:
`MintItem` navigates to `mintmanagement`
`SelectMintToSwapTo` navigates to `selectAmount`
`Empty` references `nostrReceive` and `qr scan`

Suggested fix:
Confirm which of these routes are dead code versus partially migrated code.
Delete dead paths.
Re-point any still-needed flows to live routes.

Done when:
There are no remaining references to routes that do not exist in the live app.

## ER-21: Remove the old nav type layer after migration

- [ ] Status: open

Why:
The old nav model will become a maintenance trap once Expo Router is in place.

Files:
`src/model/nav.ts`
`src/nav/navTypes.ts`
all imports from those files

Current problem:
Many screens and components import route prop types from the old stack model.

Suggested fix:
Delete these files only after all live screens have been converted.
Replace them with local interfaces and Router-based param access.

Done when:
`src/model/nav.ts` and `src/nav/navTypes.ts` are gone or reduced to non-navigation domain types only.

## ER-22: Delete the manual navigation layer and related helpers

- [ ] Status: open

Why:
Once the Router migration is complete, the manual stack layer should disappear entirely.

Files:
`src/components/nav/Navigator.tsx`
`src/nav/SettingsNavigator.tsx`
`src/nav/MintNavigator.tsx`
`src/nav/RestoreNavigator.tsx`
`src/nav/HistoryNavigator.tsx`
`src/components/nav/utils.ts`

Current problem:
The migration is not complete until the old nav layer is actually removed.

Suggested fix:
Delete the old navigator files and any helper code that only exists to support them.
Retain only the minimal low-level navigation code still required by Expo Router.

Done when:
The app navigates entirely through `src/app/**` and no manual navigator files remain.
