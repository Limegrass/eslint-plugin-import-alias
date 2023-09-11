# import-alias/import-alias: Encourage use of defined aliases

## Rule Details

Given the following `tsconfig.json`

```jsonc
{
    // ...
    "compilerOptions": {
        // ...
        "paths": {
            "#src/*": ["src/*"],
            "#rules/*": ["src/rules/*"]
        }
    }
}
```

### Valid

```ts
import { Potato } from "#src/potato";
import { garbage } from "#rules/garbage";
import { Foo } from "external-module";

require("#src/potato");
jest.mock("#rules/garbage");
```

### Invalid

Given a file in `./src`

```ts
import { Potato } from "./potato"; // relative paths are not okay
import { garbage } from "#src/rules/garbage"; // import can be shortened

require("./potato");
jest.mock("#src/rules/garbage");
```

## Configuration

To add new functions which takes a single string parameter,
you can define your own functions that are considered import functions.
For example, defining the following in .eslintrc will check the first
parameter of a function named `potato` for aliasing.

```jsonc
{
    // ...
    "rules": {
        // ...
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                "aliasImportFunctions": ["require", "mock", "potato"]
            }
        ]
    }
}
```

This was based off an assumption that custom mock functions will take a similar
parameter to `require` or `jest.mock`, but please submit an issue detailing
your usage if this does not serve your needs.

### Enabling relative import overrides

It is possible to allow relative imports for some paths if desires through configuring
a `relativeImportOverrides` configuration parameter on the rule. Each configuration requires
a path and a depth to be specified, where a depth of `0` allows imports of sibling modules,
a depth of `1` allows imports from siblings of the parent module, and so on.

The follow example would allow sibling imports for the entire project.

```jsonc
{
    // ...
    "rules": {
        // ...
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                "relativeImportOverrides": [{ "path": ".", "depth": 0 }]
            }
        ]
    }
}
```

With a configuration like `{ path: "src/foo", depth: 0 }`

1. Relative paths can be used in `./src/foo`.
2. Relative paths can be used in `./src/foo/bar`.
3. Relative paths can NOT be used in `./src`.

With a configuration like `{ path: "src", depth: 0 }`

1. Relative paths can be used in `./src/foo`.
2. Relative paths can be used in `./src/bar/baz`.
3. Relative paths can be used in `./src`.

In `./src/foo` with `path: "src"`

1. `import "./bar"` for `./src/bar` when `depth` \>= `0`.
2. `import "./bar/baz"` when `depth` \>= `0`.
3. `import "../bar"` when `depth` \>= `1`.
