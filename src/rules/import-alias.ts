import { AliasConfig, loadAliasConfigs } from "#src/alias-config";
import { AST, Rule } from "eslint";
import type {
    ExportAllDeclaration,
    ExportNamedDeclaration,
    ImportDeclaration,
} from "estree";
import { existsSync } from "fs-extra";
import type { JSONSchema4 } from "json-schema";
import { dirname, join as joinPath, resolve } from "path";
import slash from "slash";

function getAliasSuggestion(
    importModuleName: string,
    aliasConfigs: AliasConfig[],
    absoluteDir: string
) {
    const currentAliasConfig: AliasConfig | undefined = aliasConfigs.find(
        ({ alias }) => {
            const [baseModulePath] = importModuleName.split("/");
            return baseModulePath === alias;
        }
    );

    let absoluteModulePath: string | undefined = undefined;
    if (importModuleName.trim().charAt(0) === ".") {
        absoluteModulePath = joinPath(absoluteDir, importModuleName);
    } else if (currentAliasConfig) {
        absoluteModulePath = importModuleName.replace(
            currentAliasConfig.alias,
            currentAliasConfig.path.absolute
        );
    }

    if (absoluteModulePath) {
        const bestAliasConfig = getBestAliasConfig(
            aliasConfigs,
            currentAliasConfig,
            absoluteModulePath
        );

        if (bestAliasConfig && bestAliasConfig !== currentAliasConfig) {
            return slash(
                absoluteModulePath.replace(
                    bestAliasConfig.path.absolute,
                    bestAliasConfig.alias
                )
            );
        }
    }
}

function getBestAliasConfig(
    aliasConfigs: AliasConfig[],
    currentAlias: AliasConfig | undefined,
    absoluteModulePath: string
) {
    const importPathParts = absoluteModulePath.split("/");
    return aliasConfigs.reduce((currentBest, potentialAlias) => {
        const aliasPathParts = potentialAlias.path.absolute.split("/");
        const isValidAlias = aliasPathParts.reduce(
            (isValid, aliasPathPart, index) => {
                return isValid && importPathParts[index] === aliasPathPart;
            },
            true
        );
        const isMoreSpecificAlias =
            !currentBest ||
            potentialAlias.path.absolute.length >
                currentBest.path.absolute.length;
        return isValidAlias && isMoreSpecificAlias
            ? potentialAlias
            : currentBest;
    }, currentAlias);
}
type ImportAliasOptions = {
    aliasConfigPath?: string;
    // TODO: A fuller solution might need a property for the position, but not sure if needed
    aliasImportFunctions: string[];
};

/**
 * This should match the type definition of ImportAliasOptions
 */
const schemaProperties: Record<keyof ImportAliasOptions, JSONSchema4> = {
    aliasConfigPath: {
        description: "Alternative path to look for a TSConfig/JSConfig",
        type: "string",
    },
    aliasImportFunctions: {
        type: "array",
        description:
            "Function names which supports aliases as its first function." +
            " Examples are `require` and `mock` for `jest.mock`." +
            " Please submit an issue if position parameters needs support",
        items: {
            type: "string",
        },
        default: ["require", "mock"],
    },
};

const importAliasRule: Rule.RuleModule = {
    meta: {
        docs: {
            description:
                "Suggests shortest matching alias in TSConfig/JSConfig",
            category: "Suggestions",
            recommended: true,
            url: "https://github.com/limegrass/eslint-plugin-import-alias/blob/HEAD/docs/rules/import-alias.md",
            suggestion: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: schemaProperties,
            },
        ],
        type: "suggestion",
    },

    create: (context: Rule.RuleContext) => {
        const cwd = context.getCwd();
        const {
            aliasConfigPath,
            aliasImportFunctions = schemaProperties.aliasImportFunctions
                .default as string[],
        }: ImportAliasOptions = context.options[0] || {}; // No idea what the other array values are

        const aliasesResult = loadAliasConfigs(cwd, aliasConfigPath);
        if ("message" in aliasesResult) {
            return {
                Program: (node) => {
                    context.report({ node, message: aliasesResult.message });
                },
            };
        }

        const filepath = resolve(context.getFilename());

        if (!existsSync(filepath)) {
            return {
                Program: (node) => {
                    context.report({
                        node,
                        message:
                            "a filepath must be provided, try with --stdin-filename, " +
                            "call eslint on a file, " +
                            "or save your buffer as a file and restart eslint in your editor.",
                    });
                },
            };
        }

        const absoluteDir = dirname(filepath);
        const getReportDescriptor = (
            [moduleStart, moduleEnd]: [number, number],
            importModuleName: string
        ) => {
            // preserve user quote style
            const quotelessRange: AST.Range = [moduleStart + 1, moduleEnd - 1];

            const aliasSuggestion = getAliasSuggestion(
                importModuleName,
                aliasesResult,
                absoluteDir
            );

            return aliasSuggestion
                ? {
                      message: `import ${importModuleName} can be written as ${aliasSuggestion}`,
                      fix: (fixer: Rule.RuleFixer) => {
                          return fixer.replaceTextRange(
                              quotelessRange,
                              aliasSuggestion
                          );
                      },
                  }
                : undefined;
        };

        const aliasModuleDeclarations = (
            node:
                | ImportDeclaration
                | ExportAllDeclaration
                | ExportNamedDeclaration
        ) => {
            if (node.source?.range && typeof node.source.value === "string") {
                const suggestion = getReportDescriptor(
                    node.source.range,
                    node.source.value
                );

                if (suggestion) {
                    context.report({ node, ...suggestion });
                }
            }
        };

        return {
            CallExpression: (node) => {
                const identifierNode =
                    node.callee.type === "MemberExpression"
                        ? node.callee.property
                        : node.callee;

                if (
                    identifierNode.type === "Identifier" &&
                    aliasImportFunctions.includes(identifierNode.name) &&
                    node.arguments.length
                ) {
                    const [importNameNode] = node.arguments;
                    if (
                        importNameNode.range &&
                        "value" in importNameNode &&
                        typeof importNameNode.value === "string"
                    ) {
                        const suggestion = getReportDescriptor(
                            importNameNode.range,
                            importNameNode.value
                        );

                        if (suggestion) {
                            context.report({ node, ...suggestion });
                        }
                    }
                }
            },
            ExportAllDeclaration: aliasModuleDeclarations,
            ExportNamedDeclaration: aliasModuleDeclarations,
            ImportDeclaration: aliasModuleDeclarations,
        };
    },
};

export { importAliasRule };
