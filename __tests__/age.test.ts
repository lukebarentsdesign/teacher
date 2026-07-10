import { isAtLeast16 } from "@/lib/age";

describe("isAtLeast16", () => {
  const today = new Date("2026-07-10T00:00:00");

  it("is true when the 16th birthday was earlier this year", () => {
    expect(isAtLeast16(new Date("2010-01-01"), today)).toBe(true);
  });

  it("is true on the exact day of the 16th birthday", () => {
    expect(isAtLeast16(new Date("2010-07-10"), today)).toBe(true);
  });

  it("is false the day before the 16th birthday", () => {
    expect(isAtLeast16(new Date("2010-07-11"), today)).toBe(false);
  });

  it("is false when the birthday hasn't happened yet this year", () => {
    expect(isAtLeast16(new Date("2010-12-25"), today)).toBe(false);
  });

  it("is false for a much younger student", () => {
    expect(isAtLeast16(new Date("2018-01-01"), today)).toBe(false);
  });

  it("is true for an adult well past 16", () => {
    expect(isAtLeast16(new Date("1990-01-01"), today)).toBe(true);
  });
});
