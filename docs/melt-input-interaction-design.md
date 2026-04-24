# Melt Input Interaction Design

## Purpose

`MeltInput` is the cash-out entry point. It accepts either a BOLT11 invoice or a Lightning Address, lets the user choose the funding mint, prepares the melt operation through coco, and asks for final confirmation in a bottom sheet.

The current design intentionally keeps this as a single screen-owned flow. Navigation is only used for the final success screen. Intermediate states, mint selection, amount collection, operation preparation, cancellation, and confirmation are all coordinated by `src/screens/Payment/MeltInput.tsx`.

This document describes the new interaction model so the same baseline can be applied to send next.

## Design Goals

- Keep cash-out focused on one primary task at a time.
- Avoid live parsing while the user types.
- Keep keyboard behavior predictable.
- Avoid squeezing request entry, amount entry, and confirmation into one visible layout.
- Make the selected mint globally visible in the header, not buried in the form.
- Keep operation confirmation modal-driven, with the screen owning the modal and operation lifecycle.
- Preserve cancellation safety for prepared operations.

## Main Interaction Model

The screen has two entry steps:

- `request`: the user enters a BOLT11 invoice or Lightning Address.
- `amount`: the user has locked in a Lightning Address and must enter an amount.

The request input is not continuously interpreted. The user commits the input by pressing Continue or submitting the keyboard. At that point the screen classifies the input:

- Encoded LNURL: rejected with the existing invalid invoice prompt.
- Lightning Address: metadata is requested, the address is locked, and the screen transitions to amount entry.
- Otherwise: treated as a BOLT11 invoice and passed directly to melt preparation.

This removes the previous layout pressure caused by showing the request input and amount input together while the keyboard is open.

## Header And Mint Selection

The selected mint is part of the screen header through `MintHeaderSelector`.

The header selector owns:

- The compact mint button.
- The selected mint logo or fallback mint icon.
- The selected mint balance display.
- The mint selection bottom sheet.

The screen owns:

- The selected mint state.
- The `onMintSelect` callback.
- The `onOpen` callback used to blur active inputs before opening the sheet.

This is the desired pattern for payment entry screens. Mint selection should be available without consuming content area, and the current funding source should remain visible while the user enters or reviews payment data.

For send, the content-level `MintSelector` should be replaced with this same header selector pattern.

## Screen Layout

`MeltInput` uses `Screen` with:

- `withBackBtn`
- `withPadding`
- `withBottomInset={false}`
- `withKeyboard`
- `rightAction={<MintHeaderSelector />}`

The content is a `ScrollView` with a flexible content container and a bottom Continue action. The ScrollView is still important because the keyboard and smaller devices can constrain vertical space, but the design should not require scrolling for normal large-phone cases.

The request step shows one rounded input surface:

- Text input for invoice or Lightning Address.
- Paste icon button inside the same surface, aligned to the right.
- No helper text or payment type pill.

The amount step replaces the request surface with one compact Lightning Address panel:

- Header row with Lightning icon.
- Locked address text.
- Cancel action to return to request entry.
- Compact `AmountInput`.
- Optional min/max amount limits if the Lightning Address metadata provides them.

## Focus And Keyboard Rules

Keyboard behavior is part of the flow contract:

- Request input auto-focuses when the screen opens.
- Opening the mint selector blurs active inputs.
- Transitioning from request to amount blurs the request input.
- The amount input auto-focuses after it mounts.
- Cancelling the amount step blurs the amount input and dismisses the keyboard.
- Opening the confirmation modal blurs both inputs and dismisses the keyboard before presenting the sheet.

The key principle is that focus changes only at committed step boundaries or modal boundaries. Parsing should never steal focus while the user is typing.

## Continue Button Behavior

The Continue action is shared by both steps.

In `request`:

- Disabled while busy.
- Disabled when the trimmed input is empty.
- On press, classifies and handles the input.

In `amount`:

- Disabled while busy.
- Disabled until Lightning Address metadata exists.
- Disabled when the amount is empty or outside metadata min/max limits.
- On invalid amount submit, triggers the existing shake and vibration feedback.

The Continue action stays visually outside the input surfaces, near the bottom of the scroll content.

## Lightning Address Flow

Lightning Address is a two-step commit flow:

1. User enters the address in the request input.
2. User presses Continue.
3. Screen requests metadata with `requestLnAddressMetadata`.
4. On success, the screen stores:
   - `lnAddress`
   - `lnAddressMetadata`
   - empty `amountInput`
   - cleared amount error state
5. Screen switches to `amount`.
6. Amount input auto-focuses.
7. User enters amount and presses Continue.
8. Screen requests a BOLT11 invoice with `getInvoiceFromLnAddress`.
9. Screen prepares the melt with the returned invoice.
10. Confirmation modal opens.

Cancel from the amount step:

- Clears locked Lightning Address state.
- Clears metadata.
- Clears amount state and amount error.
- Returns to `request`.
- Does not auto-focus the request input.

The top back button follows the same step model. If the screen is in the amount step, back cancels the amount step instead of leaving the screen.

## BOLT11 Flow

BOLT11 is a direct prepare flow:

1. User enters or pastes an invoice.
2. User presses Continue or submits the keyboard.
3. Screen calls `prepare` through `useMeltOperation`.
4. Prepared operation and mint are stored locally.
5. Inputs are blurred and the keyboard is dismissed.
6. Confirmation modal opens.

The same `prepareMelt` helper is used by BOLT11 and Lightning Address after Lightning Address resolves into an invoice.

## Confirmation Modal

The confirmation modal is owned by `MeltInput`.

The modal receives:

- The current or prepared operation.
- The prepared mint.
- Loading state from the melt operation hook.
- Confirm, cancel, and back-to-dashboard callbacks.

The shared `ConfirmationModal` uses a dynamic bottom sheet capped at 90% of the current window height. This allows information-heavy melt confirmation content to scroll inside the sheet instead of extending into unsafe top areas.

Before the sheet is presented, `MeltInput` explicitly:

- Blurs the request input.
- Blurs the amount input.
- Dismisses the keyboard.

## Operation Lifecycle And Cancellation

`MeltInput` stores a locally prepared operation so the modal can render immediately after `prepare`.

Cancellation is guarded by:

- `canCancelPreparedOperation`
- `operationLoading`
- `hasCancelledRef`

When a prepared operation exists and navigation attempts to remove the screen, `beforeRemove` prevents the navigation until `cancel()` succeeds. This prevents prepared melt operations from being abandoned silently.

If modal cancellation fails, the confirmation modal is re-presented.

When a current operation finalizes:

- The modal closes without firing cancel.
- Prepared operation and mint state are cleared.
- The success screen is opened with melt amount, fee, change, and mint name.

## Error And Loading Handling

There are two loading sources:

- Local loading for metadata lookup and invoice preparation.
- Operation loading from coco for prepare, execute, and cancel state.

The screen treats either as busy. Busy state disables Continue and shows the loading icon in the button.

Errors are surfaced through the existing prompt:

- Known errors use their message.
- Unknown input and Lightning Address failures use the invalid invoice prompt.
- Amount validation uses shake and vibration instead of a prompt.

## Component Contracts

### `MintHeaderSelector`

Use this for payment screens that operate from one selected mint.

Expected responsibilities:

- Show selected mint logo or fallback icon.
- Show selected mint balance, respecting privacy settings.
- Own and present `MintSelectionSheet`.
- Call `onOpen` before presenting so the parent can blur inputs.
- Return the selected mint through `onMintSelect`.

### `AmountInput`

`AmountInput` remains the shared numeric input.

The compact variant is intended for embedded step panels where vertical space matters:

- Smaller vertical padding.
- Smaller primary amount typography.
- Smaller suffix and fiat equivalent typography.

Use `compact` when the amount input is one part of a larger flow panel. Keep the default size for amount-first screens unless the full send screen adopts the denser layout.

### `ConfirmationModal`

Use this for operation confirmation sheets.

Expected behavior:

- Dynamic bottom-sheet sizing.
- Maximum dynamic content size of 90% of screen height.
- Scrollable content.
- Confirm and cancel actions inside the sheet.
- Dismiss behavior controlled by loading and `dismissible`.

The screen should dismiss the keyboard before presenting the modal.

## Send Refactor Baseline

Send currently starts directly with amount entry and keeps mint selection inside the content. To align it with the melt baseline:

- Move selected mint display and selection into `MintHeaderSelector`.
- Let `SendSelectAmount` own selected mint state and pass `rightAction` to `Screen`.
- Remove the content-level `MintSelector`.
- Keep amount entry as the primary content because send does not need request classification.
- Use the same modal ownership pattern: screen prepares operation, stores prepared operation, and presents `SendConfirmationModal`.
- Dismiss the amount keyboard before presenting `SendConfirmationModal`.
- Consider using the compact amount input only if the send layout gains additional in-screen context; otherwise keep the full-size amount input.
- Keep cancellation safe when a prepared send operation exists. The current `useCancelSendOnUnmount` covers unmount, but the modal cancel and navigation behavior should be checked against the melt pattern.

The send flow does not need the two-step `request` / `amount` state machine, but it should share the same header, keyboard, modal, and operation lifecycle principles.

## Acceptance Checklist

For melt:

- Request input is visible on initial screen.
- Paste is an icon inside the request input surface.
- Lightning Address parsing happens only after Continue or keyboard submit.
- Lightning Address amount step replaces request input instead of stacking below it.
- Amount input auto-focuses after the amount step appears.
- Cancel from amount step restores request input.
- Header back from amount step restores request input.
- Mint selector is opened from the header and blurs active inputs.
- Confirmation modal opens after keyboard dismissal.
- Confirmation modal height is capped and scrolls when content is tall.
- Prepared operations are cancelled before leaving the screen.

For send migration:

- Selected mint appears in the header with logo and balance.
- Mint selection sheet is owned by the header selector.
- Amount keyboard is dismissed before confirmation opens.
- Confirmation remains modal-owned by the screen, not navigation-owned.
- Existing send cancellation behavior is preserved or strengthened.
