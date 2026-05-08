# Tamagui Migration Plan

This file tracks the current Tamagui integration baseline, the completed migration surface, and the remaining intentional native React Native boundaries.

The current goal is not to replace every native React Native primitive. The goal is to make Tamagui the authoritative app styling layer for reusable text, layout, input, surfaces, theme tokens, and common pressable shells while preserving native primitives where they provide platform behavior.

## Current Baseline

- `Txt` has been removed. Text in `src/components` and `src/screens` should use `AppText`.
- `TxtInput` has been removed. Standard text inputs should use `InputFrame`.
- Existing Tamagui primitives include `AppText`, `Stack`, `XStack`, `YStack`, `ScreenFrame`, `Surface`, `ButtonSurface`, `PressableSurface`, `InputFrame`, `SeparatorLine`, `RadioCircle`, `ProgressTrack`, and `ProgressFill`.
- Keep imports routed through `@styles`; avoid broad Tamagui package imports from app screens/components.
- `src/styles/tamagui.config.ts` owns the Tamagui tokens, themes, font scale mapping, and `TamaguiCustomConfig` typing.
- The root `tamagui.config.ts` re-exports the style-layer config for Tamagui tooling.
- `index.ts` imports `./tamagui.config` before app startup.
- `ThemeProvider` mounts `TamaguiProvider` and the active Tamagui theme above the app tree in `src/context/Theme.tsx`.
- `app.json` has `userInterfaceStyle: "automatic"` and `newArchEnabled: true`.
- `package.json` is on the Tamagui 2 native floor: React Native `0.81.5`, React `19.1.0`, and TypeScript `5.9`.
- `@tamagui/web` and `react-dom` are kept as runtime graph dependencies for Tamagui. They do not mean eNuts is shipping a web target.

## Integration Scope

The app currently uses Tamagui core runtime primitives directly through the shared style layer. This matches the current Tamagui installation path where runtime use works without mandatory Metro or Babel compiler configuration.

Out of scope for this cleanup unless performance or tooling issues appear:

- Adding `@tamagui/babel-plugin`.
- Adding `@tamagui/metro-plugin`.
- Adding `tamagui.build.ts`.
- Replacing the direct `@tamagui/core` setup with the broader `tamagui` UI kit package.
- Reintroducing web support or Expo web scripts.

If the compiler path is added later, do it as a separate optimization task with fresh verification. Keep Reanimated plugin ordering and Expo startup behavior under review if a Babel config is introduced.

## Theme Provider Decision

Tamagui docs recommend setting the root theme through `defaultTheme` on `TamaguiProvider`. This app currently also wraps children in `TamaguiTheme` so the selected light/dark mode and highlight color can update from stored preferences at runtime.

Before changing this structure, verify:

- App startup and the early loading/blank path still have Tamagui context.
- Light, dark, and auto mode update correctly.
- Every highlight color in `themeColors` updates active tokens.
- Existing `useThemeContext()` consumers keep receiving the app preference state.

Do not remove the `TamaguiTheme` wrapper unless live preference changes are proven to work through `TamaguiProvider` alone.

## Migration Definition

The runtime migration is complete as of the May 4, 2026 pass when these conditions hold:

- App screens/components no longer import or render raw React Native `Text` for app copy.
- Reusable app inputs use `InputFrame`, except where a specialized component deliberately wraps a native input and documents why.
- Reusable layout/surface components use `Stack`, `XStack`, `YStack`, `ScreenFrame`, or `Surface`.
- Shared button, option, selector, copy, and dashboard action components use a shared Tamagui-driven pressable primitive.
- Theme colors used by migrated components come from Tamagui tokens or `useAppThemeTokens()`.
- Remaining raw `View`, `ScrollView`, `Modal`, `KeyboardAvoidingView`, `SafeAreaView`, `CameraView`, native `Switch`, and animated/gesture elements are intentional platform or behavior boundaries.
- iOS and Android export cleanly after the migrated surfaces are touched.

## Completed Migration Surface

### `src/components/AmountInput.tsx`

- Intentionally keeps a native `TextInput` for the actual amount entry.
- Keeps the forwarded `TextInput` ref contract used by payment screens.
- Keeps the Reanimated wrapper only for the shake animation.
- Uses `Stack`/`XStack` and `PressableSurface` for the row/container and currency toggle surface.
- Preserves fiat/sats formatting, compact mode, custom placeholder/error colors, `allowFontScaling={false}`, and currency toggle behavior.
- Do not replace this with generic `InputFrame`: the old design relies on a frameless, oversized, centered amount field rather than the standard app input shell.

### Shared Pressable Components

- `src/components/Button.tsx`
- `src/components/Copy.tsx`
- `src/components/Option.tsx`
- `src/components/MintSelector.tsx`
- `src/components/MintHeaderSelector.tsx`
- `src/components/DashboardTopBar.tsx`
- `src/screens/DashboardActionSheet.tsx`

These now use `PressableSurface` from `@styles`. The primitive is defined once in `src/styles/tamagui.tsx` and exported through `src/styles/index.ts`, so screens/components do not import Tamagui directly.

### Screen-Local Layout Containers

Layout-only `View` containers in the following screens/components have been converted to `Stack`, `XStack`, or `YStack`:

- `src/screens/Onboarding.tsx`
- `src/screens/Dashboard.tsx`
- `src/screens/Mints/MintHomeScreen.tsx`
- `src/screens/Mints/MintSettingsScreen.tsx`
- `src/screens/Mints/AddMintScreen.tsx`
- `src/screens/Mints/components/MintItem.tsx`
- `src/screens/Mints/components/MetadataItem.tsx`
- `src/screens/Payment/MeltInput.tsx`
- `src/screens/Payment/MintSelectAmount.tsx`
- `src/screens/Payment/SendSelectAmount.tsx`
- `src/screens/Payment/Processing.tsx`
- `src/screens/Payment/ProcessingError.tsx`
- `src/screens/Payment/Success.tsx`
- `src/screens/Payment/SuccessScreen.tsx`
- `src/screens/Payment/Receive/Invoice.tsx`
- `src/screens/Payment/Send/EncodedToken.tsx`
- `src/screens/Payment/Send/CoinSelection.tsx`
- `src/screens/Restore/Recover.tsx`
- `src/screens/Restore/Recovering.tsx`
- `src/screens/Restore/SelectRecoveryMint.tsx`
- `src/screens/Settings/*.tsx`
- `src/screens/History/**/*.tsx`
- `src/screens/ErrorScreen/ErrorDetails.tsx`
- `src/components/modal/*.tsx`
- `src/components/Balance.tsx`
- `src/components/Logo.tsx`
- `src/components/MintSelectionSheet.tsx`
- `src/components/OverviewRow.tsx`
- `src/components/Toaster.tsx`
- `src/components/nav/TopNav.tsx`
- `src/components/nav/Navigator.tsx`

### Modal Surfaces

- `src/components/modal/index.tsx`
- `src/components/modal/ConfirmBottomSheet.tsx`
- `src/components/modal/ConfirmationModal.tsx`
- `src/components/modal/MeltConfirmationModal.tsx`
- `src/components/modal/NfcPaymentModal.tsx`
- `src/components/modal/OperationMintPanel.tsx`
- `src/components/modal/SendConfirmationModal.tsx`
- `src/components/modal/TrustMintBottomSheet.tsx`

Repeated modal panels and detail rows now use `Surface`/`Stack` where appropriate. `Modal`, `TrueSheet`, `KeyboardAvoidingView`, and gesture/backdrop primitives remain native because they provide platform behavior.

### QR and Camera UI

- `src/components/QR.tsx`
- `src/screens/QRScan/QrScannerScreen.tsx`
- `src/screens/QRScan/components/CameraPermission.tsx`

Static layout containers now use `Stack`. `CameraView`, QR library output, and focus-frame overlay pieces remain conservative because they are visually sensitive. Android emulator verification covered the permission prompt and live camera scanner state.

## Intentional Native Boundaries

### Gesture/Animation Heavy

- `src/components/SwipeButton.tsx` keeps a native `View` as the base for `Animated.createAnimatedComponent(View)`.
- `Animated.View` and `Animated.Text` remain native where gesture bounds, transforms, layout measurement, or animation timing depend on Reanimated/gesture-handler behavior.
- `src/components/AnimatedSpinner.tsx` keeps animated pieces native while static wrappers use Tamagui layout primitives.

### Native Platform Components

Keep these native unless a specific bug or design need appears:

- `GestureHandlerRootView`
- `KeyboardAvoidingView`
- `Modal`
- `TrueSheet`
- `CameraView`
- `SafeAreaView`
- `ScrollView`
- `FlatList`
- `Image`
- Native `Switch`
- QR library output
- Native text-input types used only for refs

## Verification Checklist

- `rg -n "<Txt\\b|</Txt>|<TxtInput\\b|import .*\\bTxt\\b|from \\\"@comps/Txt|from \\\"\\./Txt" src/components src/screens src/styles` should stay empty.
- `rg -n "Txt|TxtInput" src` should only match unrelated names such as `TxtButton`, prop names, or style names.
- `rg -n "import \\{[^}]*\\bText\\b[^}]*\\} from \"react-native\"|<Text\\b|</Text>" src/components src/screens` should stay empty.
- `rg -n "from \\\"tamagui\\\"|from '@tamagui|from \\\"@tamagui" src` should only match the shared style/theme layer unless there is a documented exception.
- `npm ls @tamagui/core @tamagui/web react-dom --depth=0`
- `npx @tamagui/cli check`
- `npx expo export --platform ios`
- `npx expo export --platform android`
- `git diff --check`
- `npx prettier --check <changed files>`
- `npx tsc --noEmit` for signal, while accounting for current baseline TypeScript errors unrelated to Tamagui migration.
- For visual/interaction changes, verify on Android emulator or device, especially amount input, QR scan, NFC modal, and swipe confirmation.
- For theme changes, verify light mode, dark mode, auto mode, and every highlight color.
- For pressable changes, verify disabled states, loading states, accessibility labels/roles, hit targets, and `testID`s.

## May 4, 2026 Verification Status

- `rg -n "<Txt\\b|</Txt>|<TxtInput\\b|import .*\\bTxt\\b|from \\\"@comps/Txt|from \\\"\\./Txt" src/components src/screens src/styles`: no matches.
- `rg -n "Txt|TxtInput" src`: only unrelated style names, props, `TxtButton`, and test ID strings.
- `rg -n "import \\{[^}]*\\bText\\b[^}]*\\} from \"react-native\"|<Text\\b|</Text>" src/components src/screens`: no rendered raw React Native text; remaining hits are `type TextInput` refs.
- `rg -n "TouchableOpacity|\\bPressable\\b|<TextInput\\b|import \\{[^}]*\\bTextInput\\b[^}]*\\}" src/components src/screens`: no rendered raw pressables or inputs; remaining hits are `type TextInput` refs.
- `rg -n "import \\{[^}]*\\bView\\b[^}]*\\} from \"react-native\"|<View\\b|</View>" src/components src/screens`: only `src/components/SwipeButton.tsx` for `Animated.createAnimatedComponent(View)`.
- `rg -n "from \\\"tamagui\\\"|from '@tamagui|from \\\"@tamagui" src`: only `src/styles/tamagui.tsx`, `src/styles/tamagui.config.ts`, and `src/context/Theme.tsx`.
- `npm ls @tamagui/core @tamagui/web react-dom --depth=0`: passes with `@tamagui/core@2.0.0-rc.41`, `@tamagui/web@2.0.0-rc.41`, and `react-dom@19.1.0`.
- `npx @tamagui/cli check`: passes.
- `npx expo export --platform ios`: passes with existing package export warnings.
- `npx expo export --platform android`: passes with existing package export warnings.
- `env JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew :app:assembleDebug` in `android/`: passes.
- Android emulator smoke verification passed for dashboard rendering, send action sheet including the NFC option, `Send Ecash` amount entry, send confirmation, generated Cashu-token QR screen, QR scanner permission and live camera view, display settings, dark mode, and return to auto mode.
- `SwipeButton` was code-inspected after migration: only the static outer wrapper moved to `Stack`; the gesture detector, animated native base, animated text, and native measurement-sensitive pieces remain unchanged.
- `git diff --check`: passes.
- `npx prettier --check src/components src/screens src/styles/tamagui.tsx src/styles/index.ts TAMA_MIGRATION.md`: passes.
- `npx tsc --noEmit`: still reports only the known non-Tamagui baseline errors listed below.

## Current Known Non-Tamagui Typecheck Noise

As of this migration pass, `npx tsc --noEmit` still reports baseline errors unrelated to Tamagui cleanup, including:

- Navigation route keys in `src/components/Empty.tsx`.
- Missing `expo-constants` types/module in `src/consts/env.ts`.
- Test global references in `src/consts/env.ts`.
- Timer typing in `src/context/Prompt.tsx`.
- i18n key typing in `src/screens/Payment/Processing.tsx`.
- Missing `_testmintUrl` export in `src/screens/Payment/Send/CoinSelection.tsx`.
- Missing `@scure/bip39/wordlists/english` module typing in `src/services/SeedService.ts`.
- Missing `IContact` and `decodeInvoice` symbols in `src/util/index.ts`.

Do not treat those as proof a Tamagui-local migration failed unless a touched file introduced a new error.

## External References

- Tamagui installation: https://tamagui.dev/docs/intro/installation
- Tamagui Expo guide: https://tamagui.dev/docs/guides/expo
- Tamagui Metro guide: https://tamagui.dev/docs/guides/metro
