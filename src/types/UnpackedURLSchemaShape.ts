import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { URLSchemaShape } from "./URLSchemaShape.ts";

export type UnpackedURLSchemaShape<S extends URLSchemaShape> =
  StandardSchemaV1.InferOutput<S>;
