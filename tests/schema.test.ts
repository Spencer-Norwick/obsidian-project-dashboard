import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATTENTION_VALUES,
  MILESTONE_PROPERTY_NAMES,
  PRIORITY_VALUES,
  PROJECT_PROPERTY_NAMES,
  SCHEDULE_STATE_VALUES,
  STATUS_VALUES,
  TEMPLATE_ENTITY_TYPES,
  isAttention,
  isPriority,
  isScheduleState,
  isStatus,
} from "../src/schema";

const schemaDoc = readFileSync("docs/schema.md", "utf8");

describe("canonical schema", () => {
  it("documents every project property name", () => {
    for (const name of PROJECT_PROPERTY_NAMES) {
      expect(schemaDoc).toContain(`\`${name}\``);
    }
  });

  it("documents every milestone property name", () => {
    for (const name of MILESTONE_PROPERTY_NAMES) {
      expect(schemaDoc).toContain(`\`${name}\``);
    }
  });

  it("documents every allowed value for each enum", () => {
    for (const value of [
      ...STATUS_VALUES,
      ...ATTENTION_VALUES,
      ...SCHEDULE_STATE_VALUES,
      ...PRIORITY_VALUES,
    ]) {
      expect(schemaDoc).toContain(`\`${value}\``);
    }
  });

  it("documents the remaining entity types", () => {
    for (const entity of TEMPLATE_ENTITY_TYPES) {
      expect(schemaDoc.toLowerCase()).toContain(entity);
    }
  });

  it("validates enum membership case-sensitively", () => {
    expect(isStatus("active")).toBe(true);
    expect(isStatus("Active")).toBe(false);
    expect(isAttention("finish-first")).toBe(true);
    expect(isAttention("normal")).toBe(true);
    expect(isAttention("urgent")).toBe(false);
    expect(isScheduleState("proposed")).toBe(true);
    expect(isScheduleState("committed")).toBe(true);
    expect(isScheduleState("draft")).toBe(false);
    expect(isPriority("high")).toBe(true);
    expect(isPriority("urgent")).toBe(false);
  });
});
