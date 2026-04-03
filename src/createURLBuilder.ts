import type { BaselineURLComponents } from "./types/BaselineURLComponents.ts";
import type { UnpackedURLSchemaShape } from "./types/UnpackedURLSchemaShape.ts";
import { URLComponents } from "./types/URLComponents.ts";
import type { URLSchemaShapeMap } from "./types/URLSchemaShapeMap.ts";
import { URLSchema } from "./URLSchema.ts";
import { build } from "./utils/build.ts";
import { join } from "./utils/join.ts";
import { match } from "./utils/match.ts";

function createRelativeURLBuilder<S extends URLSchemaShapeMap | null>(
  base: string,
  schema: URLSchema<S> | S,
) {
  let normalizedSchema = schema instanceof URLSchema ? schema : new URLSchema(schema);

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
   * `createURLBuilder()` that produced this URL builder.
   * @param data - An optional parameter that contains path placeholder values
   * and query parameters (`{ params?, query? }`) matching the URL pattern
   * schema.
   */
  return <P extends keyof NonNullable<S>>(
    pattern: S extends null ? string : P,
    data?: S extends null
      ? URLComponents
      : UnpackedURLSchemaShape<NonNullable<S>[P]>,
  ) => {
    type URLShape = NonNullable<typeof data>;

    type MatchShape = S extends null
      ? {
        params: BaselineURLComponents["params"],
        query: BaselineURLComponents["query"],
        hash: string;
      }
      : {
        params: UnpackedURLSchemaShape<NonNullable<S>[P]> extends {
              params?: Record<string, unknown>;
            }
          ? UnpackedURLSchemaShape<NonNullable<S>[P]>["params"]
          : undefined;
        query: UnpackedURLSchemaShape<NonNullable<S>[P]> extends {
              query?: Record<string, unknown>;
            }
          ? UnpackedURLSchemaShape<NonNullable<S>[P]>["query"]
          : undefined;
        hash: string;
      };

    let compiledURL = build(join(base, String(pattern)), data);
    let urlSchema = (normalizedSchema.shape as S)?.[pattern] as S extends null
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
  };
}

type CreateURLSchemaResult<S extends URLSchemaShapeMap | null> = ReturnType<
  typeof createRelativeURLBuilder<S>
>;

/**
 * Returns a URL builder. Providing the `schema` parameter is provided is
 * a way to make the URL builder type-safe.
 *
 * Pass an optional `base` URL as the first parameter to rebase the schema
 * onto the given URL. `base` acts as a prefix, or a replacement to the
 * leading `"/"`, to URLs in the schema.
 */
export function createURLBuilder(
  schema?: URLSchema<null> | null,
): CreateURLSchemaResult<null>;

export function createURLBuilder<S extends URLSchemaShapeMap>(
  schema: URLSchema<S> | S,
): CreateURLSchemaResult<S>;

export function createURLBuilder(
  base: string,
  schema?: URLSchema<null> | null,
): CreateURLSchemaResult<null>;

export function createURLBuilder<S extends URLSchemaShapeMap>(
  base: string,
  schema: URLSchema<S> | S,
): CreateURLSchemaResult<S>;

export function createURLBuilder<S extends URLSchemaShapeMap>(
  base?: string | URLSchema<S> | S,
  schema?: URLSchema<S> | S,
) {
  if (typeof base !== "string") return createRelativeURLBuilder("", base ?? null);

  return createRelativeURLBuilder(base, schema ?? null);
}
