import { bar } from "./foo"; // error: import ./foo can be written as #src/foo

export const baz = bar + "baz";
