import { describe, expect, it } from "vitest";
import { reviveDates } from "../utils/dateReviver";

describe("reviveDates", () => {
  it("converts ISO date strings into Date objects", () => {
    const input = {
      createdAt: "2025-01-15T10:00:00.000Z",
      nested: { updatedAt: "2025-02-01T00:00:00.000Z" },
    };
    const output = reviveDates(input);
    expect(output.createdAt).toBeInstanceOf(Date);
    expect(output.nested.updatedAt).toBeInstanceOf(Date);
  });
});
