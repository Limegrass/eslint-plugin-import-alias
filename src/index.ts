import { importAliasRule } from "#src/rules/import-alias";
import { type ESLint } from "eslint";

export const rules = {
    "import-alias": importAliasRule,
};

export const configs: Record<string, ESLint.ConfigData> = {
    recommended: {
        plugins: ["@limegrass/import-alias"],
        rules: {
            "@limegrass/import-alias/import-alias": [
                "error",
                {
                    isAllowBaseUrlResolvedImport: false,
                },
            ],
        },
    },
};
