import type { URLComponents } from "../types/URLComponents.ts";
import type { URLSchemaShape } from "../types/URLSchemaShape.ts";

function isEmpty(x: unknown) {
  return (
    x === null ||
    x === undefined ||
    (typeof x === "object" && Object.keys(x).length === 0)
  );
}

function removeEmptyEntries(x: Record<string, unknown>) {
  let result: Record<string, unknown> = {};

  for (let [k, v] of Object.entries(x)) {
    if (!isEmpty(v)) result[k] = v;
  }

  return result;
}

export function parseObject(
  value: URLComponents,
  schema: URLSchemaShape | undefined,
) {
  let adjustedValue = removeEmptyEntries(value) as URLComponents;

  if (!schema) return adjustedValue;

  let result = schema["~standard"].validate(adjustedValue);

  if (result instanceof Promise || result.issues) return null;

  return result.value;
}
