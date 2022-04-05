import { sync as findUpSync } from "find-up";
import micromatch from "micromatch";
import { dirname, join as joinPath } from "path";
import { ConfigLoaderResult, loadConfig } from "tsconfig-paths";

type AliasConfig = {
    alias: string;
    path: {
        /** Glob values using absolute paths */
        absolute: string;
    };
};

function loadAliasConfigs(
    cwd: string,
    aliasConfigPath?: string
): AliasConfig[] | Error {
    const configFilePath = findUpSync(
        [aliasConfigPath, "tsconfig.json", "jsconfig.json"].filter(
            Boolean
        ) as string[],
        { cwd }
    );

    if (!configFilePath) {
        return new Error(
            "cannot find TSConfig or JSConfig, try assigning aliasConfigPath"
        );
    }

    let config: ConfigLoaderResult;
    try {
        config = loadConfig(configFilePath);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return new Error(
                `SyntaxError in TSConfig/JSConfig: ${error.message}`
            );
        }
        throw error;
    }

    if (config.resultType !== "success") {
        return new Error(
            `validate tsconfig or jsconfig provided and ensure compilerOptions.baseUrl is set: ${config.message}`
        );
    }

    const configDir = dirname(configFilePath);
    const projectBaseDir = joinPath(configDir, config.baseUrl);

    return Object.entries(config.paths).reduce(
        (configs, [aliasGlob, aliasPaths]) => {
            aliasPaths.forEach((aliasPath) => {
                const relativePathBase = micromatch.scan(aliasPath).base;
                configs.push({
                    alias: micromatch.scan(aliasGlob).base,
                    path: {
                        absolute: joinPath(projectBaseDir, relativePathBase),
                    },
                });
            });
            return configs;
        },
        [] as AliasConfig[]
    );
}

export { AliasConfig, loadAliasConfigs };
