import { describe, expect, it } from "vitest";
import { toMindbodyLocal } from "./londonTime.ts";

describe("toMindbodyLocal", () => {
  it("formats a 10:30 London slot on a BST day", () => {
    expect(toMindbodyLocal("2026-10-14T09:30:00.000Z")).toBe("2026-10-14T10:30:00");
  });

  it("formats a 10:30 London slot on a GMT day", () => {
    expect(toMindbodyLocal("2026-11-04T10:30:00.000Z")).toBe("2026-11-04T10:30:00");
  });

  it("formats midnight London on a BST day without hour 24", () => {
    expect(toMindbodyLocal("2026-10-14T23:00:00.000Z")).toBe("2026-10-15T00:00:00");
  });
});
