import { match as matchParams } from "path-to-regexp";
import { QuasiURL } from "quasiurl";
import type { URLSchemaShape } from "../types/URLSchemaShape.ts";
import { parseObject } from "./parseObject.ts";

export function match(
  url: string,
  pattern: string,
  urlSchema?: URLSchemaShape | null | undefined,
) {
  let { origin, pathname, search, hash } = new QuasiURL(url);
  let { origin: patternOrigin, pathname: patternPathname } = new QuasiURL(
    pattern,
  );

  if (origin !== patternOrigin) return null;

  let query = Object.fromEntries(new URLSearchParams(search));

  if (url === pattern) return { query, hash };
  if (urlSchema === null) return null;

  let matchPattern = matchParams(patternPathname);
  let paramsMatch = matchPattern(pathname);

  if (paramsMatch === false) return null;

  let params = paramsMatch.params;
  let parseResult = parseObject({ params, query }, urlSchema);

  if (parseResult === null) return null;

  return { ...parseResult, hash };
}
