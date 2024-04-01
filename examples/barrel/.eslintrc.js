const config = {
    env: {
        es2021: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "@limegrass/import-alias"],
    root: true,
    rules: {
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                relativeImportOverrides: [
                    {
                        pattern: "[\\/]index\\.[jt]sx?$",
                        depth: 0,
                    },
                ],
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
};

module.exports = config;
