# Tamagui Migration Backlog

This file tracks remaining old React Native UI patterns that should be migrated toward the Tamagui-driven primitives in `src/styles/tamagui.tsx`.

## Current Baseline

- `Txt` has been removed. Text in `src/components` and `src/screens` should use `AppText`.
- `TxtInput` has been removed. Standard text inputs should use `InputFrame`.
- Existing Tamagui primitives include `AppText`, `Stack`, `XStack`, `YStack`, `ScreenFrame`, `Surface`, `ButtonSurface`, `InputFrame`, `SeparatorLine`, `RadioCircle`, `ProgressTrack`, and `ProgressFill`.
- Keep imports routed through `@styles`; avoid broad Tamagui package imports from app screens/components.

## High Priority

### `src/components/AmountInput.tsx`

- Still uses raw `TextInput`, `View`, `Pressable`, and `Animated.View`.
- This is the main input component still outside `InputFrame`.
- Migration is not a simple find/replace because it owns fiat/sats formatting, forwarded refs, shake animation, compact mode, custom placeholder/error colors, `allowFontScaling={false}`, and currency toggle interactions.
- Suggested approach:
  - Use `InputFrame` for the actual input.
  - Keep the Reanimated wrapper only where needed for shake animation.
  - Move the outer row/container layout to `Stack`/`XStack`.
  - Preserve the current forwarded `TextInput` ref contract used by payment screens.

### Shared Pressable Components

- `src/components/Button.tsx`
- `src/components/Copy.tsx`
- `src/components/Option.tsx`
- `src/components/MintSelector.tsx`
- `src/components/MintHeaderSelector.tsx`
- `src/components/DashboardTopBar.tsx`
- `src/screens/DashboardActionSheet.tsx`

These still rely on `TouchableOpacity` for interaction. Some already use Tamagui surfaces inside the touch target, but the pressable shell is still React Native.

Suggested approach:

- Add a shared Tamagui-driven pressable primitive, for example `PressableSurface` or `TouchableStack`, in `src/styles/tamagui.tsx`.
- Style it from `Stack` or a supported React Native pressable base.
- Migrate icon buttons, text buttons, dashboard actions, row options, mint selectors, and sheet options to that primitive.
- Keep accessibility props and existing `testID`s unchanged.

## Medium Priority

### Screen-Local Layout Containers

Many screens still use raw `View` with `StyleSheet.create` for layout-only containers.

Good candidates:

- `src/screens/Dashboard.tsx`
- `src/screens/Mints/MintHomeScreen.tsx`
- `src/screens/Mints/MintSettingsScreen.tsx`
- `src/screens/Mints/AddMintScreen.tsx`
- `src/screens/Payment/MeltInput.tsx`
- `src/screens/Payment/Success.tsx`
- `src/screens/Payment/SuccessScreen.tsx`
- `src/screens/Restore/Recover.tsx`
- `src/screens/Restore/Recovering.tsx`
- `src/screens/Restore/SelectRecoveryMint.tsx`
- `src/screens/Settings/*.tsx`
- `src/components/modal/*.tsx`

Suggested approach:

- Convert layout-only `View` nodes to `Stack`, `XStack`, or `YStack`.
- Move repeated card/panel styles to `Surface` variants only where the shape repeats.
- Do not convert every single `View` mechanically; leave camera overlays, animation wrappers, or platform-specific containers until their behavior is verified.

### Modal Surfaces

- `src/components/modal/index.tsx`
- `src/components/modal/ConfirmBottomSheet.tsx`
- `src/components/modal/ConfirmationModal.tsx`
- `src/components/modal/MeltConfirmationModal.tsx`
- `src/components/modal/NfcPaymentModal.tsx`
- `src/components/modal/OperationMintPanel.tsx`
- `src/components/modal/SendConfirmationModal.tsx`
- `src/components/modal/TrustMintBottomSheet.tsx`

Suggested approach:

- Standardize repeated modal panels on `Surface`/`Stack`.
- Keep `Modal`, `TrueSheet`, `KeyboardAvoidingView`, and gesture/backdrop primitives native where they provide platform behavior.
- Extract repeated row/detail styles only after the panel migration is stable.

### QR and Camera UI

- `src/components/QR.tsx`
- `src/screens/QRScan/QrScannerScreen.tsx`
- `src/screens/QRScan/components/CameraPermission.tsx`

Suggested approach:

- Convert static layout containers to `Stack`.
- Keep `CameraView`, QR library output, and focus-frame overlay pieces conservative because they are visually sensitive.
- Verify on device/emulator after changes, especially camera framing and animated QR progress.

## Low Priority / Needs Care

### `src/components/SwipeButton.tsx`

- Uses gesture-handler and Reanimated heavily.
- Has raw `View`, `Animated.View`, and `Animated.Text`.
- Migration should be separate because gesture bounds, animation transforms, and layout measurements can regress easily.
- Consider only moving static outer wrappers to `Stack`; keep animated elements native unless Tamagui interop is proven.

### `src/components/AnimatedSpinner.tsx`

- Uses Reanimated and absolutely positioned dots.
- Can use `Stack` for static containers, but this is low-value unless spinner styling is being changed.

### `src/components/Toggle.tsx`

- Uses native `Switch`.
- Leave native unless there is a concrete design reason to build a Tamagui switch replacement.

### Native/System Containers

Keep these native unless a specific bug or design need appears:

- `GestureHandlerRootView`
- `KeyboardAvoidingView`
- `Modal`
- `CameraView`
- `SafeAreaView`
- `ScrollView`
- `Animated.View` / `Animated.Text` in gesture-heavy components

## Suggested Migration Order

1. Add a shared Tamagui-driven pressable primitive and migrate shared pressable components.
2. Migrate `AmountInput` to `InputFrame` with focused visual testing.
3. Convert shared modal/detail row layout to `Stack`/`Surface`.
4. Convert screen-local layout containers opportunistically when touching those screens.
5. Handle animated/gesture-heavy components only with device verification.

## Verification Checklist

- `rg -n "Txt|TxtInput" src` should only match unrelated names such as `TxtButton` if that component still exists.
- `rg -n "import \\{[^}]*\\bText\\b[^}]*\\} from \"react-native\"|<Text\\b|</Text>" src/components src/screens` should stay empty.
- `git diff --check`
- `npx prettier --check <changed files>`
- `npx tsc --noEmit` for signal, while accounting for current baseline TypeScript errors unrelated to Tamagui migration.
- For visual/interaction changes, verify on Android emulator or device, especially amount input, QR scan, NFC modal, and swipe confirmation.
