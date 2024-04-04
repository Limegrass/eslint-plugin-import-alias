import micromatch from "micromatch";
import { dirname, isAbsolute, join as joinPath } from "path";
import {
    ConfigLoaderResult,
    ConfigLoaderSuccessResult,
    loadConfig,
} from "tsconfig-paths";

type AliasConfig = {
    alias: string;
    path: {
        /** Glob values using absolute paths */
        absolute: string;
    };
};

function loadTsconfig(
    eslintConfigPath: string,
    aliasConfigPath: string | undefined,
    codeFilePath: string
) {
    let config: ConfigLoaderResult;
    try {
        if (aliasConfigPath) {
            if (isAbsolute(aliasConfigPath)) {
                config = loadConfig(aliasConfigPath);
            } else {
                config = loadConfig(
                    joinPath(eslintConfigPath, aliasConfigPath)
                );
            }
        } else {
            config = loadConfig(dirname(codeFilePath));
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(
                `SyntaxError in TSConfig/JSConfig: ${error.message}`
            );
        }
        throw error;
    }

    if (config.resultType !== "success") {
        throw new Error(
            `validate tsconfig or jsconfig provided and ensure compilerOptions.baseUrl is set: ${config.message}`
        );
    }

    return config;
}

function loadAliasConfigs(
    config: ConfigLoaderSuccessResult,
    projectBaseDir: string
): AliasConfig[] {
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

export { AliasConfig, loadAliasConfigs, loadTsconfig };
