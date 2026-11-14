import { describe, expect, it } from "vitest";
import { fmtDate, fmtDateTime, fmtTime, fmtMonth, fmtMonthShort, fmtLongDate } from "@/lib/format";

describe("عرض التواريخ: يوم-شهر-سنة (11-9-2026)", () => {
  it("التاريخ بدون وقت (مخزن منتصف الليل UTC)", () => {
    expect(fmtDate(new Date(Date.UTC(2026, 8, 11)))).toBe("11-9-2026");
    expect(fmtDate(new Date(Date.UTC(2026, 10, 3)))).toBe("3-11-2026");
    expect(fmtDate(null)).toBe("—");
  });

  it("لحظة زمنية بتنعرض بتوقيت فلسطين", () => {
    // 23:30 UTC = 01:30 بتوقيت فلسطين (اليوم التالي)
    const t = new Date("2026-11-13T23:30:00Z");
    expect(fmtDate(t, { zoned: true })).toBe("14-11-2026");
    expect(fmtTime(t)).toBe("01:30");
    expect(fmtDateTime(t)).toBe("14-11-2026 01:30");
  });

  it("الشهر باسمه المعتمد (نوفمبر وليس تشرين الثاني)", () => {
    expect(fmtMonth("2026-11")).toBe("نوفمبر 2026");
    expect(fmtMonthShort("2026-09")).toBe("سبتمبر");
    expect(fmtLongDate(new Date("2026-11-11T10:00:00Z"))).toBe("الأربعاء 11 نوفمبر 2026");
  });

  it("أرقام لاتينية دايماً", () => {
    expect(fmtDateTime(new Date("2026-01-05T08:07:00Z"))).toMatch(/^[0-9: -]+$/);
  });
});

describe("fmtIsoDay", () => {
  it("نص ISO ← يوم-شهر-سنة", async () => {
    const { fmtIsoDay } = await import("@/lib/format");
    expect(fmtIsoDay("2026-11-05")).toBe("5-11-2026");
    expect(fmtIsoDay(null)).toBe("—");
    expect(fmtIsoDay("bad")).toBe("—");
  });
});
