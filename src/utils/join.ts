export function join(...args: string[]) {
  if (args.length === 0) return "";

  let nonEmptyArgs = args.filter(Boolean);
  let hasLeadingSlash = nonEmptyArgs[0]?.startsWith("/");

  let trailingPart = nonEmptyArgs.at(-1);
  let hasTrailingSlash = trailingPart?.endsWith("/") && trailingPart !== "/";

  let result = nonEmptyArgs
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");

  if (hasLeadingSlash) result = `/${result}`;
  if (hasTrailingSlash) result = `${result}/`;

  let head = result.match(/^(\w+:)?\/\//)?.[0] ?? "";
  let tail = result.slice(head.length);

  return `${head}${tail.replace(/\/+/g, "/")}`;
}
