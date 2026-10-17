import { describe, expect, it } from "vitest";
import { entryToRawRow, valueToRaw } from "../src/adapter";
import { FakeValue, entry } from "./fixtures/entries";

describe("valueToRaw", () => {
  it("coerces scalars from their string form", () => {
    expect(valueToRaw(new FakeValue("65"))).toBe(65);
    expect(valueToRaw(new FakeValue("3.5"))).toBe(3.5);
    expect(valueToRaw(new FakeValue("true"))).toBe(true);
    expect(valueToRaw(new FakeValue("false"))).toBe(false);
    expect(valueToRaw(new FakeValue("2026-10-12"))).toBe("2026-10-12");
    expect(valueToRaw(new FakeValue("active"))).toBe("active");
    expect(valueToRaw(new FakeValue(""))).toBeUndefined();
    expect(valueToRaw(new FakeValue("   "))).toBeUndefined();
    expect(valueToRaw(new FakeValue("null"))).toBeUndefined();
    expect(valueToRaw(new FakeValue("undefined"))).toBeUndefined();
  });
});

describe("entryToRawRow", () => {
  it("maps note properties and uses the file basename", () => {
    const row = entryToRawRow(
      entry("Boathouse/Projects/Sea trial.md", {
        type: "project",
        status: "active",
        progress: 42,
        start: "2026-10-05",
      }),
    );
    expect(row.path).toBe("Boathouse/Projects/Sea trial.md");
    expect(row.name).toBe("Sea trial");
    expect(row.values).toMatchObject({
      type: "project",
      status: "active",
      progress: 42,
      start: "2026-10-05",
    });
  });

  it("omits properties that are not present", () => {
    const row = entryToRawRow(entry("Note.md", { type: "project" }));
    expect(Object.keys(row.values)).toEqual(["type"]);
  });
});
