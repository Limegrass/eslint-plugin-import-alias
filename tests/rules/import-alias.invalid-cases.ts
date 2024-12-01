import { ImportAliasOptions } from "#src/rules/import-alias";
import { RuleTester } from "eslint";
import {
    formatCode,
    FORMAT_STRING,
    IMPORTED_MODULE_NAME,
} from "#root/tests/rules/import-alias.config";

type InvalidTestCaseParams = {
    description: string;
    sourceFilePath: string;
    import: {
        input: string;
        output?: string;
    };
    options?: [Partial<ImportAliasOptions>];
    only?: true;
};

/** These configurations are based on the test setup in the import-alias.config test file */
export function getInvalidTestCaseParams(
    fileSystemPath: string,
    optionsOverrides: Partial<ImportAliasOptions>,
): InvalidTestCaseParams[] {
    const baseParams: InvalidTestCaseParams[] = [
        {
            description: "unaliased sibling import from aliased path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `./${IMPORTED_MODULE_NAME}`,
                output: `#sub-directory/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "unaliased parent import from aliased path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "aliased but has more specific import",
            sourceFilePath: "src/code.ts",
            import: {
                input: `#src/sub-directory/${IMPORTED_MODULE_NAME}`,
                output: `#sub-directory/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "unaliased sub-directory import",
            sourceFilePath: "src/code.ts",
            import: {
                input: `./sub-directory/${IMPORTED_MODULE_NAME}`,
                output: `#sub-directory/${IMPORTED_MODULE_NAME}`,
            },
        },

        {
            description: "global relative override insufficient depth",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
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
            description: "path relative override insufficient depth",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
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
            description: "pattern relative override insufficient depth",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: "code.ts$",
                            depth: 0,
                        },
                    ],
                },
            ],
        },

        {
            description: "source code file not in configured override path",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            path: "unknown",
                            depth: 1,
                        },
                    ],
                },
            ],
        },

        {
            description: "source code file not in configured override pattern",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: "unknown$",
                            depth: 1,
                        },
                    ],
                },
            ],
        },

        {
            description: "user filesystem is not used in match",
            sourceFilePath: "src/sub-directory/code.ts",
            import: {
                input: `../${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    relativeImportOverrides: [
                        {
                            pattern: fileSystemPath,
                            depth: 1,
                        },
                    ],
                },
            ],
        },

        {
            description: "baseUrl resolved module import when not allowed",
            sourceFilePath: "src/code.ts",
            import: {
                input: `src/sub-directory/${IMPORTED_MODULE_NAME}`,
                output: `#sub-directory/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    isAllowBaseUrlResolvedImport: false,
                },
            ],
        },

        {
            description:
                "baseUrl resolved module import when not allowed for existing file",
            sourceFilePath: "src/code.ts",
            import: {
                input: `known/${IMPORTED_MODULE_NAME}`,
                // output: NONE - user must add entry to TSConfig
            },
            options: [
                {
                    isAllowBaseUrlResolvedImport: false,
                },
            ],
        },

        {
            description:
                "isAllowBaseUrlResolvedImport is not hampered by relativeImportOverrides",
            sourceFilePath: "src/code.ts",
            import: {
                input: `src/${IMPORTED_MODULE_NAME}`,
                output: `#src/${IMPORTED_MODULE_NAME}`,
            },
            options: [
                {
                    isAllowBaseUrlResolvedImport: false,
                    relativeImportOverrides: [
                        {
                            path: ".",
                            depth: 0,
                        },
                    ],
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

export function generateInvalidTestCase(
    testCaseKind: keyof typeof FORMAT_STRING,
    params: InvalidTestCaseParams,
): RuleTester.InvalidTestCase {
    const inputCode = formatCode(
        FORMAT_STRING[testCaseKind],
        params.import.input,
    );
    const outputCode = formatCode(
        FORMAT_STRING[testCaseKind],
        // RuleTester appears to default to the input string
        // only if output is explicitly not set (and NOT undefined).
        // This mimicks that behavior.
        params.import.output ?? params.import.input,
    );

    const testCase: RuleTester.InvalidTestCase = {
        code: inputCode,
        errors: 1,
        filename: params.sourceFilePath,
        name: `${params.description} [${inputCode}]`,
        options: params.options,
        output: outputCode !== inputCode ? outputCode : null,
    };

    if (params.only) {
        testCase.only = params.only;
    }

    return testCase;
}
