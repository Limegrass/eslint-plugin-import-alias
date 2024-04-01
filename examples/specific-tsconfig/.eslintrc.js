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
                // `"./configs/tsconfig.preferred.json"` also works
                aliasConfigPath: `${__dirname}/configs/tsconfig.preferred.json`,
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
