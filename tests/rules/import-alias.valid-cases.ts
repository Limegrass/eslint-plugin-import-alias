import { ImportAliasOptions } from "#src/rules/import-alias";
import { RuleTester } from "eslint";
import {
    formatCode,
    FORMAT_STRING,
    IMPORTED_MODULE_NAME,
    UNKNOWN_MODULE_PATH,
} from "#root/tests/rules/import-alias.config";

type ValidTestCaseParams = {
    description: string;
    sourceFilePath: string;
    import: {
        input: string;
    };
    options?: [Partial<ImportAliasOptions>];
    only?: true;
};

/** These configurations are based on the test setup in the import-alias.config test file */
export function getValidTestCaseParams(
    optionsOverrides: Partial<ImportAliasOptions>
): ValidTestCaseParams[] {
    const baseParams: ValidTestCaseParams[] = [
        {
            description: "aliased source import",
            sourceFilePath: "src/code.ts",
            import: {
                input: `#src/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "aliased sub-directory import",
            sourceFilePath: "src/code.ts",
            import: {
                input: `#sub-directory/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "multiple aliases for one import path accepted",
            sourceFilePath: "src/code.ts",
            import: {
                input: `#src-alt-alias/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "unaliased directory with partial name match",
            sourceFilePath: "src/code.ts",
            import: {
                input: `../src-unaliased/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "depth 0 relative module path with override for all",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: ".",
                            depth: 0,
                        },
                    ],
                },
            ],
        },
        {
            description:
                "depth 0 relative module path with override for given path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "src",
                            depth: 0,
                        },
                    ],
                },
            ],
        },
        {
            description: "depth 1 relative module path with override for all",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: ".",
                            depth: 1,
                        },
                    ],
                },
            ],
        },
        {
            description:
                "depth 1 relative module path with override for given path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "src",
                            depth: 1,
                        },
                    ],
                },
            ],
        },

        {
            description: "depth 0 relative module path with override for all",
            sourceFilePath: "src/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: `code.ts$`,
                            depth: 0,
                        },
                    ],
                },
            ],
        },
        {
            description:
                "depth 0 relative module path with override for given pattern",
            sourceFilePath: "src/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: `code.ts$`,
                            depth: 0,
                        },
                    ],
                },
            ],
        },
        {
            description: "depth 1 relative module path with override for all",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: `code.ts$`,
                            depth: 1,
                        },
                    ],
                },
            ],
        },
        {
            description:
                "depth 1 relative module path with override for given pattern",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: `code.ts$`,
                            depth: 1,
                        },
                    ],
                },
            ],
        },

        {
            description: "pattern and path override resolves matching path",
            sourceFilePath: "src/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "src",
                            depth: 0,
                        },
                        {
                            pattern: "bad-pattern$",
                            depth: 0,
                        },
                    ],
                },
            ],
        },
        {
            description: "pattern and path override resolves matching pattern",
            sourceFilePath: "src/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "bad-path",
                            depth: 0,
                        },
                        {
                            pattern: `code.ts$`,
                            depth: 0,
                        },
                    ],
                },
            ],
        },

        {
            description:
                "depth and path override resolves higher depth pattern",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "src",
                            depth: 0,
                        },
                        {
                            pattern: `code.ts$`,
                            depth: 1,
                        },
                    ],
                },
            ],
        },
        {
            description: "depth and path override resolves higher depth path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "src",
                            depth: 1,
                        },
                        {
                            pattern: `code.ts$`,
                            depth: 0,
                        },
                    ],
                },
            ],
        },

        {
            description: "absolute import by baseUrl resolved import",
            sourceFilePath: "src/code.ts",
            import: {
                input: `src/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "unknown import with !isAllowBaseUrlResolvedImport",
            sourceFilePath: "src/code.ts",
            import: {
                input: `${UNKNOWN_MODULE_PATH}`,
            },
            options: [
                {
                    isAllowBaseUrlResolvedImport: false,
                },
            ],
        },
    ];

    return baseParams.map((params) => ({
        ...params,
        options: [
            {
                ...((params.options && params.options[0]) || {}),
                ...optionsOverrides,
            },
        ],
    }));
}

export function generateValidTestCase(
    testCaseKind: keyof typeof FORMAT_STRING,
    params: ValidTestCaseParams
): RuleTester.ValidTestCase {
    const code = formatCode(FORMAT_STRING[testCaseKind], params.import.input);

    return {
        code,
        name: `${params.description} [${code}]`,
        filename: params.sourceFilePath,
        options: params.options,
        only: params.only,
    };
}
