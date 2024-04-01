const config = {
    env: {
        es2021: true,
        node: true,
    },
    extends: ["plugin:@limegrass/import-alias/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "@limegrass/import-alias"],
    root: true,
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
