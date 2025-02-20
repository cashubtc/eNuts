import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jest from "eslint-plugin-jest";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import promise from "eslint-plugin-promise";
import deprecate from "eslint-plugin-deprecate";
import node from "eslint-plugin-node";
import _import from "eslint-plugin-import";
import getifyProperArrows from "@getify/eslint-plugin-proper-arrows";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import * as espree from "espree";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/node_modules",
        "**/dist",
        "**/build",
        "**/.expo",
        "**/.jest",
        "**/.vscode",
        "**/coverage",
        "**/patches",
        "**/report",
        "**/assets",
        "**/scripts",
        "scripts/dev",
        "scripts/**/*.*",
        "scripts/dev/*",
    ],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:promise/recommended",
    "plugin:import/typescript",
    "plugin:jest/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/jsx-runtime",
)), {
    plugins: {
        react: fixupPluginRules(react),
        "react-hooks": fixupPluginRules(reactHooks),
        jest: fixupPluginRules(jest),
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        "simple-import-sort": simpleImportSort,
        promise: fixupPluginRules(promise),
        deprecate,
        node,
        import: fixupPluginRules(_import),
        "@getify/proper-arrows": getifyProperArrows,
        jsdoc,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...jest.environments.globals.globals,
            __dirname: true,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly",
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            extraFileExtensions: [".json"],

            ecmaFeatures: {
                jsx: true,
                globalReturn: true,
                impliedStrict: true,
            },

            project: "tsconfig.json",
        },
    },

    settings: {
        react: {
            pragma: "React",
            version: "detect",
        },

        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },
    },

    rules: {
        "quote-props": ["warn", "as-needed"],
        "react/no-unescaped-entities": "warn",
        "no-dupe-class-members": 0,
        "simple-import-sort/imports": "warn",
        "simple-import-sort/exports": "warn",
        "import/first": "warn",
        "import/newline-after-import": "warn",
        "import/no-duplicates": "warn",

        "promise/always-return": ["warn", {
            ignoreLastCallback: true,
        }],

        "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

        "@typescript-eslint/array-type": ["warn", {
            default: "array",
        }],

        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/await-thenable": "warn",
        "@typescript-eslint/consistent-type-exports": "warn",

        "@typescript-eslint/restrict-template-expressions": ["warn", {
            allowNumber: true,
            allowBoolean: true,
            allowNullish: true,
        }],

        "@typescript-eslint/no-explicit-any": 0,
        "new-cap": 1,
        camelcase: 0,

        "@typescript-eslint/no-unused-vars": ["warn", {
            vars: "all",
            args: "all",
            ignoreRestSiblings: false,
            argsIgnorePattern: "^_",
        }],

        "prefer-promise-reject-errors": "warn",
        "no-await-in-loop": "warn",
        "no-return-await": "warn",
        "no-prototype-builtins": "warn",
        "no-empty": "warn",
        "arrow-body-style": ["warn", "as-needed"],
        "no-useless-return": "warn",
        "require-await": "warn",
        "prefer-arrow-callback": "warn",
        "no-var": "warn",
        "no-fallthrough": "warn",
        "no-extra-parens": ["warn", "functions"],
        "no-extra-semi": "warn",
        curly: "warn",
        eqeqeq: "warn",
        "no-else-return": "warn",
        "prefer-const": "warn",
        "no-console": 1,

        indent: ["warn", "tab", {
            SwitchCase: 1,
        }],

        quotes: ["warn", "single"],
        semi: ["warn", "never"],
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: ["**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs", "**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts"],

    rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/consistent-type-exports": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-implied-eval": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-base-to-string": "off",
        "@typescript-eslint/no-duplicate-type-constituents": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-unsafe-enum-comparison": "off",
    },
}, {
    files: ["**/*.json"],

    languageOptions: {
        parser: espree,
    },
}];