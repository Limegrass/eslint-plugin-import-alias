import path from "node:path";
import { fileURLToPath } from "node:url";
import globals from "globals";
import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const config = defineConfig([
    ...fixupConfigRules(
        compat.extends("plugin:@limegrass/import-alias/recommended"),
    ),
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },

        settings: {
            "import/parsers": {
                "@typescript-eslint/parser": [".ts"],
            },
            "import/resolver": {
                typescript: {},
            },
        },
    },
]);

export default config;
