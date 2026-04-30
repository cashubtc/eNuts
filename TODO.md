# TODO

## Typecheck cleanup

These are the best next targets because they block `npx tsc --noEmit` from being useful as a regression check.

- [x] Remove stale `selectMintToSwapTo` route.
  - Removed the unreachable route registration, route type, screen prop type, and screen file.

- [ ] Fix stale route types in `src/components/Empty.tsx`.
  - Current type references old routes: `"nostrReceive"` and `"qr scan"`.
  - Replace with a generic `NativeStackNavigationProp<RootStackParamList>` or a narrower current route type.

- [ ] Clean up payment overview residue in `src/screens/Payment/Send/CoinSelection.tsx`.
  - Remove the missing `_testmintUrl` import from `@consts`.
  - Check whether `url`, `scanned`, and `trustMintRef` are still needed.

- [ ] Fix utility module type errors in `src/util/index.ts`.
  - Import or remove the `IContact` dependency used by `uniqByIContacts`.
  - Fix `decodeLnInvoice`, which currently calls `decodeInvoice` without an import/provider.

- [ ] Fix environment typing in `src/consts/env.ts`.
  - TypeScript cannot resolve the `expo-constants` import from the root dependency graph.
  - Add declarations or remove direct global references for `__TEST__` and `jest`.

- [ ] Fix i18n key typing errors.
  - `src/components/MintSelectionSheet.tsx` has a union key call for `"selectMint" | "selectMints"` that does not satisfy the typed `t` overload.
  - `src/screens/Payment/Processing.tsx` has a similar dynamic key issue for processing status strings.

## Parser/payment follow-ups

- [ ] Add a QR chooser for unified requests with multiple supported candidates.
  - Current QR policy chooses by priority.
  - A chooser is better when a unified request contains both a Cashu payment request and a Lightning invoice.

- [ ] Implement Cashu payment request execution from QR.
  - QR currently recognizes `cashuPaymentRequest` candidates but shows an unsupported prompt.
  - NFC already extracts and executes Cashu payment requests through `manager.paymentRequests`.

- [ ] Add focused parser coverage once a test runner exists.
  - Direct Cashu token.
  - Direct Lightning invoice.
  - Lightning address.
  - LNURL.
  - Direct `creq...`.
  - `bitcoin:` with address plus `lightning=...`.
  - `bitcoin:` with `creq=...`.
  - `bitcoin:` with multiple supported fallbacks.

## Lower-priority cleanup

- [ ] Reduce noisy debug logging in `src/shim.ts`.
  - It logs crypto polyfill setup details on startup.

- [ ] Review `src/screens/Payment/MeltInput.tsx` for extraction opportunities.
  - The file is large and still owns request parsing, LNURL amount flow, mint selection, operation preparation, confirmation, cancellation, and success routing.
  - Do this after typecheck is cleaner, so behavior changes are easier to validate.

- [ ] Review broad `any` and modal backdrop types.
  - Several bottom-sheet components type backdrop props as `any`.
  - This is lower priority than the current typecheck blockers.
