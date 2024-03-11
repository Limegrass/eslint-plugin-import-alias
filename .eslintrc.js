const config = {
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
        "plugin:@limegrass/import-alias/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "eslint-plugin-tsdoc", "import"],
    root: true,
    rules: {
        "import/no-default-export": "error",
        "tsdoc/syntax": "warn",
    },
    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts"],
        },
        "import/resolver": {
            typescript: {},
        },
    },
};

module.exports = config;
