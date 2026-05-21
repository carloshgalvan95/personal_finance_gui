const DATE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "date",
  "startDate",
  "endDate",
  "targetDate",
  "purchaseDate",
  "lastUpdated",
]);

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

function reviveValue(key: string, value: unknown): unknown {
  if (
    typeof value === "string" &&
    DATE_FIELDS.has(key) &&
    ISO_DATE_RE.test(value)
  ) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  if (Array.isArray(value)) {
    return value.map((item) => reviveDeep(item));
  }
  if (value !== null && typeof value === "object") {
    return reviveDeep(value as Record<string, unknown>);
  }
  return value;
}

function reviveDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => reviveDeep(item)) as T;
  }
  if (input !== null && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      out[key] = reviveValue(key, val);
    }
    return out as T;
  }
  return input;
}

/** JSON.parse reviver for use inside LocalStorageService. */
export function jsonDateReviver(key: string, value: unknown): unknown {
  return reviveValue(key, value);
}

/** Re-apply date revival to data already parsed from JSON. */
export function reviveDates<T>(data: T): T {
  return reviveDeep(data);
}
