import globals from "globals";
import tseslint from "typescript-eslint";
import * as importAlias from "@limegrass/eslint-plugin-import-alias";

const config = [
    {
        files: ["**/*.ts"],

        plugins: {
            "@typescript-eslint": tseslint.plugin,
            "@limegrass/import-alias": importAlias,
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

        rules: {
            "@limegrass/import-alias/import-alias": [
                "error",
                {
                    isAllowBaseUrlResolvedImport: false,
                },
            ],
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
];

export default config;
