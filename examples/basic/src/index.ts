import { bar } from "./foo"; // error: import ./foo can be written as #src/foo
export * from "src/potato"; // error: import src/potato can be written as #src/potato

export const baz = bar + "baz";
