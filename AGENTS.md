# AGENTS.md — eNuts

## Overview

- Expo + React Native app written in TypeScript.
- `strict` TypeScript enabled in `tsconfig.json`.
- Entry is `index.ts`; app config in `app.json`.
- Source lives in `src/` with components, screens, services, context, storage, util.
- Styling uses `react-native-size-matters` and shared `@styles` theme helpers.
- i18n uses `react-i18next` with translations in `assets/translations`.

## Commands

### Install

- `npm install`

### Run (Expo)

- `npm run start` (Expo dev server)
- `npm run android` (run Android device/emulator)
- `npm run ios` (run iOS simulator)
- `npm run web` (run web)

### Formatting

- `npm run format` (Prettier, repo-wide)

### Build (EAS)

- `npx eas build --profile development`
- `npx eas build --profile preview`
- `npx eas build --profile production`
- Profiles are defined in `eas.json`; requires EAS auth.

### Linting

- No lint script configured in `package.json`.
- If adding lint, keep it opt-in and align with Prettier.

### Tests

- No test runner configured in `package.json`.
- No single-test command available yet.
- If you introduce Jest later, use `npx jest path/to/test -t "name"` (convention only).

## Project layout

- `src/components/` reusable UI components and hooks.
- `src/screens/` screen-level components and flows.
- `src/context/` React context providers and hooks.
- `src/services/` app services (seed, NFC, exchange rates).
- `src/storage/` persistence and database helpers.
- `src/styles/` theme colors and globals.
- `src/util/` shared utilities.
- `assets/` images, lottie, translations.

## Imports and modules

- Prefer path aliases from `tsconfig.json` (`@src`, `@comps`, `@styles`, `@model`, etc.).
- Keep alias imports grouped together at the top.
- Follow with external packages, then relative imports.
- Use `import type` for type-only imports.
- Avoid unused imports; rely on TypeScript to catch issues.

## Formatting and structure

- Prettier settings: semicolons, double quotes, `printWidth: 100`, trailing commas.
- Indentation is 2 spaces; no tabs.
- Keep JSX props each on new line when long.
- Keep objects and arrays trailing commas for easier diffs.
- Prefer `const` and `function` declarations over `let`.
- Avoid inline comments unless requested.

## Types and naming

- Use TypeScript everywhere; avoid `any` unless unavoidable.
- Prefer `interface` for props and object shapes; prefix with `I` (e.g., `IButtonProps`).
- Use `type` for unions/utility types; prefix with `T` for nav props (e.g., `TDisplaySettingsPageProps`).
- Component names are `PascalCase`; hooks are `useCamelCase`.
- Constants are `SCREAMING_SNAKE_CASE` in `consts/`.
- File names are `PascalCase` for components, `camelCase` for utilities.

## Components and styling

- Components generally use `export default function ComponentName(...)`.
- Use `useThemeContext` for theme colors and highlight selection.
- Prefer `globals(...)` and `@styles` helpers over hard-coded values.
- Size spacing with `s()` / `ScaledSheet` from `react-native-size-matters`.
- Use `TouchableOpacity` with `accessibilityRole="button"` where appropriate.
- Include `testID` attributes when there is an existing pattern.

## State and context

- Context providers live in `src/context/` and are exported as hooks.
- Keep derived values memoized (`useMemo`) when depending on theme or context.
- Persist preferences via `@src/storage` helpers.
- Avoid side effects in render; use `useEffect`.

## Error handling and logging

- Use `try/catch` for async boundaries; log errors via `l` from `@log`.
- Return `null`/fallback values when a feature can gracefully degrade.
- Throw errors in services only for unrecoverable state (e.g., missing mnemonic).
- Avoid swallowing errors without logging.

## i18n and strings

- Use `useTranslation` and `NS` namespaces for UI strings.
- Add translations to `assets/translations/*.json` when new keys are introduced.
- Keep user-visible strings out of services/utilities where possible.

## Data and storage

- Sensitive data uses `expo-secure-store` abstractions in `src/storage`.
- Keep data models in `src/model/` and re-export via `@model`.
- Prefer typed storage accessors over raw `SecureStore` calls.

## Networking

- Use `fetch` with typed responses where possible.
- Validate input strings before network calls (e.g., LNURL parsing).
- Handle `.onion` domains via `http` when required.

## Navigation

- Navigation types live in `src/model/nav.ts` and `src/nav/navTypes.ts`.
- Screen components should accept typed nav props.

## Testing notes

- There are currently no test files or test scripts.
- If you add tests, keep them colocated with features or in a `__tests__` folder.
- Prefer deterministic tests and avoid network calls; mock where needed.

## Formatting quick check

- Run `npm run format` before submitting changes.
- If format changes are large, scope to touched files when possible.

## Cursor/Copilot rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If added later, follow them as higher priority.

## PR hygiene (if contributing)

- Keep commits focused and small.
- Avoid unrelated refactors during feature work.
- Note any missing tests in PR description.

## Common pitfalls

- Don’t hard-code colors; use theme helpers.
- Don’t bypass `SecureStore` for secrets.
- Ensure `await` is used for async storage calls.
- Avoid using `any` to silence type errors.

## File references

- `package.json` for scripts.
- `.prettierrc` for formatting.
- `tsconfig.json` for path aliases and strict mode.
- `app.json` and `eas.json` for Expo/EAS config.

## Notes for agents

- Respect existing patterns and naming.
- Keep changes minimal and localized.
- Ask before adding new dependencies.
- Avoid writing new docs unless requested.
- Use `edit` tool for modifications.
- Re-run formatting after structural refactors.
- Update translation files for any new UI string.
- Ensure navigation types stay in sync.
- Keep sample data localized to dev builds.
