import { join } from "url-shape-join";
import type { BaselineURLComponents } from "./types/BaselineURLComponents.ts";
import type { UnpackedURLSchema } from "./types/UnpackedURLSchema.ts";
import type { URLSchemaMap } from "./types/URLSchemaMap.ts";
import { build } from "./utils/build.ts";
import { match } from "./utils/match.ts";

function createRelativeURLSchema<S extends URLSchemaMap | null>(
  base: string,
  schema: S,
) {
  if (
    schema !== null &&
    Object.values(schema).some((entry) => !("~standard" in entry))
  )
    throw new TypeError(
      "Malformed URL schema. All entries should conform to the Standard Schema specification. See https://standardschema.dev/",
    );

  return {
    /**
     * A type-aware URL builder. Returns a URL pattern object with filled
     * out parameters or without, which can be converted to a URL string
     * either by reading its `href` property, by calling its `toString()`
     * method or by coercing it to a string.
     *
     * @example
     * ```js
     * url("/sections/:id", { params: { id: 10 } }).href // "/sections/10"
     * url("/sections/:id", { params: { id: 10 } }).toString() // "/sections/10"
     * String(url("/sections/:id", { params: { id: 10 } })) // "/sections/10"
     * ```
     *
     * @param pattern - A URL pattern, one of the keys of the schema passed to
     * `createURLSchema()` that produced this URL builder.
     * @param data - An optional parameter that contains path placeholder values
     * and query parameters (`{ params?, query? }`) matching the URL pattern
     * schema.
     */
    url: <P extends keyof S>(
      pattern: S extends null ? string : P,
      data?: S extends null
        ? BaselineURLComponents
        : UnpackedURLSchema<NonNullable<S>[P]>,
    ) => {
      type URLShape = NonNullable<typeof data>;

      type MatchShape = {
        params: S extends null
          ? BaselineURLComponents["params"]
          : UnpackedURLSchema<NonNullable<S>[P]> extends {
                params?: Record<string, unknown>;
              }
            ? UnpackedURLSchema<NonNullable<S>[P]>["params"]
            : undefined;
        query: S extends null
          ? BaselineURLComponents["query"]
          : UnpackedURLSchema<NonNullable<S>[P]> extends {
                query?: Record<string, unknown>;
              }
            ? UnpackedURLSchema<NonNullable<S>[P]>["query"]
            : undefined;
        hash: string;
      };

      let compiledURL = build(join(base, String(pattern)), data);
      let urlSchema = (schema as S)?.[pattern] as S extends null
        ? undefined
        : NonNullable<S>[P];

      return {
        _pattern: pattern,
        _schema: urlSchema,
        href: compiledURL,
        /**
         * Parses the `url` parameter based on the URL pattern and the
         * schema this URL pattern originates from.
         */
        exec: (url: string) => {
          return match(url, compiledURL, urlSchema) as MatchShape | null;
        },
        /**
         * Returns a URL string by filling out the URL pattern parameters
         * from `input`.
         */
        compile: (input: URLShape | null | undefined) =>
          build(join(base, String(pattern)), input),
        toString: () => compiledURL,
      };
    },
    /**
     * Checks whether `url` matches any entries in the schema passed to
     * `createURLSchema()` that produced this URL validator.
     */
    validate: (url: string) => {
      if (!schema) return true;

      for (let [urlPattern, urlSchema] of Object.entries(schema)) {
        if (match(url, urlPattern, urlSchema) !== null) return true;
      }

      return false;
    },
  };
}

type CreateURLSchemaResult<S extends URLSchemaMap | null> = ReturnType<
  typeof createRelativeURLSchema<S>
>;

/**
 * Returns the functions to build and validate URLs in a type-safe manner
 * based on the given schema.
 *
 * Pass an optional `base` URL as the first parameter to rebase the schema
 * onto the given URL. `base` acts as a prefix, or a replacement to the
 * leading `"/"`, to URLs in the schema.
 */
export function createURLSchema<S extends URLSchemaMap | null>(
  schema: S,
): CreateURLSchemaResult<S>;

export function createURLSchema<S extends URLSchemaMap | null>(
  base: string,
  schema: S,
): CreateURLSchemaResult<S>;

export function createURLSchema<S extends URLSchemaMap | null>(
  base: S | string,
  schema?: S,
) {
  if (typeof base !== "string") return createRelativeURLSchema("", base);

  if (typeof schema === "undefined") throw new TypeError("Missing URL schema");

  return createRelativeURLSchema(base, schema);
}
