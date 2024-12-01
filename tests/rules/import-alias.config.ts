import type path from "path";

export const IMPORTED_MODULE_NAME = "imported-module";
export const UNKNOWN_MODULE_PATH = "unknown-module";

export function formatCode(format: string, importModuleName: string) {
    return format.replace("{import_module_name}", importModuleName);
}

export const CUSTOM_CALL_EXPRESSION_FUNCTION = "custom" as const;

/** @see {@link formatCode} */
export const FORMAT_STRING = {
    ExportAllDecalaration: `export * from "{import_module_name}";`,
    ExportNamedDecalaration: `export { Foo } from "{import_module_name}";`,
    ImportDeclaration: `import { Foo } from "{import_module_name}";`,
    RequireCallExpression: `require("{import_module_name}");`,
    JestMockCallExpression: `jest.mock("{import_module_name}");`,
    CustomCallExpression: `${CUSTOM_CALL_EXPRESSION_FUNCTION}("{import_module_name}");`,
} as const;

export function mockReaddir(filepath: string) {
    if (filepath.includes(UNKNOWN_MODULE_PATH)) {
        return undefined;
    }

    return [`${IMPORTED_MODULE_NAME}.ts`];
}

export function getMockAliasConfig(
    pathModule: typeof path,
    platform: "win32" | "posix",
    projectDir: string,
) {
    return [
        {
            alias: "#src",
            path: {
                absolute: pathModule[platform].join(projectDir, "src"),
            },
        },
        {
            alias: "#src-alt-alias",
            path: {
                absolute: pathModule[platform].join(projectDir, "src"),
            },
        },
        {
            alias: "#sub-directory",
            path: {
                absolute: pathModule[platform].join(
                    projectDir,
                    "src",
                    "sub-directory",
                ),
            },
        },
    ];
}
