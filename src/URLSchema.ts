import type { URLSchemaShapeMap } from "./types/URLSchemaShapeMap.ts";
import { match } from "./utils/match.ts";

export class URLSchema<S extends URLSchemaShapeMap> {
  _shape: S | null = null;
  constructor(schema: S | null) {
    this.shape = schema;
  }
  get shape() {
    return this._shape;
  }
  set shape(schema: S | null) {
    if (
      schema !== null &&
      Object.values(schema).some((entry) => !("~standard" in entry))
    )
      throw new TypeError(
        "Malformed URL schema. All entries should conform to the Standard Schema specification. See https://standardschema.dev/",
      );

    this._shape = schema;
  }
  /**
   * Checks whether `url` matches any entries in the schema.
   */
  test(url: string) {
    if (!this._shape) return true;

    for (let [urlPattern, urlSchema] of Object.entries(this._shape)) {
      if (match(url, urlPattern, urlSchema) !== null) return true;
    }

    return false;
  }
}
