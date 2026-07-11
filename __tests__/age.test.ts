import { isAtLeast16, isAtLeast18, ageInYears } from "@/lib/age";

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

describe("isAtLeast18", () => {
  const today = new Date("2026-07-10T00:00:00");

  it("is true on the exact day of the 18th birthday", () => {
    expect(isAtLeast18(new Date("2008-07-10"), today)).toBe(true);
  });

  it("is false the day before the 18th birthday", () => {
    expect(isAtLeast18(new Date("2008-07-11"), today)).toBe(false);
  });

  it("is false for a 16-year-old (who passes isAtLeast16 but not 18)", () => {
    const dob = new Date("2010-01-01");
    expect(isAtLeast16(dob, today)).toBe(true);
    expect(isAtLeast18(dob, today)).toBe(false);
  });

  it("is true for an adult well past 18", () => {
    expect(isAtLeast18(new Date("1990-01-01"), today)).toBe(true);
  });
});

describe("ageInYears", () => {
  const today = new Date("2026-07-10T00:00:00");

  it("counts completed years, not started ones", () => {
    expect(ageInYears(new Date("2010-07-11"), today)).toBe(15);
    expect(ageInYears(new Date("2010-07-10"), today)).toBe(16);
  });
});
