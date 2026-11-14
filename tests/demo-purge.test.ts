import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { purgeDemoData, demoPurged } from "@/lib/demo-purge";
import { prisma, resetDb, makeUser } from "./helpers";

describe("حذف البيانات الوهمية (النسخة التجريبية)", () => {
  beforeEach(resetDb);
  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  it("مرفوض خارج النسخة التجريبية", async () => {
    const u = await makeUser("sup");
    await expect(purgeDemoData(u.id)).rejects.toMatchObject({ status: 400 });
  });

  it("يحذف خطوط T- وزياراتها ويُبقي الزيارات المنقولة من الإكسل", async () => {
    process.env.DEMO_MODE = "true";
    const u = await makeUser("sup");
    const fake = await prisma.line.create({ data: { code: "T-1000-001", codeKey: "T1000001", accountKey: "T1000" } });
    await prisma.visit.create({ data: { number: 1, source: "APP", lineId: fake.id, lineCode: fake.code, lineCodeKey: fake.codeKey, ownerId: u.id } });
    await prisma.visit.create({ data: { number: 2, source: "LEGACY", lineCode: "G-1-1", lineCodeKey: "G7000001", legacyKey: "k1" } });
    const r = await purgeDemoData(u.id);
    expect(r).toMatchObject({ visits: 1, lines: 1 });
    expect(await prisma.visit.count()).toBe(1);
    expect(await demoPurged()).toBe(true);
  });
});
