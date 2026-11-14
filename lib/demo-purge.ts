/**
 * نسخة العرض: حذف البيانات الوهمية (خطوط T-… وزياراتها، حالات VPN، البطاقات، ملفات الأشهر التجريبية)
 * قبل نقل بيانات حقيقية. بعد الحذف ما بترجع البيانات الوهمية مع إعادة التشغيل.
 * السجلات اللي ما بتنحذف (سجل العمليات وسجل عرض كلمات السر) بتضل متل ما هي.
 */
import { prisma as defaultPrisma, type Db, type Tx } from "./db";
import { withAudit } from "./audit";
import { ApiError } from "./errors";

export const DEMO_PURGED_KEY = "demo.purged";

export const isDemo = () => process.env.DEMO_MODE === "true";

export async function demoPurged(db: Db | Tx = defaultPrisma): Promise<boolean> {
  return !!(await db.setting.findUnique({ where: { key: DEMO_PURGED_KEY } }));
}

export async function purgeDemoData(actorId: string, db: Db = defaultPrisma) {
  if (!isDemo()) throw new ApiError(400, "حذف البيانات الوهمية متاح في النسخة التجريبية فقط");
  return withAudit(
    actorId,
    async (tx, audit) => {
      const fakeLines = await tx.line.findMany({ where: { code: { startsWith: "T-" } }, select: { id: true } });
      const lineIds = fakeLines.map((l) => l.id);
      const fakeVisit = {
        source: "APP" as const,
        OR: [{ lineId: { in: lineIds } }, { lineCodeKey: { startsWith: "T" } }],
      };
      const visitIds = (await tx.visit.findMany({ where: fakeVisit, select: { id: true } })).map((v) => v.id);
      await tx.attachment.deleteMany({ where: { entityId: { in: visitIds } } });
      const visits = await tx.visit.deleteMany({ where: { id: { in: visitIds } } });
      const vpn = await tx.vpnCase.deleteMany({});
      const cards = await tx.cardPurchase.deleteMany({});
      await tx.monthTarget.deleteMany({ where: { lineId: { in: lineIds } } });
      await tx.import.deleteMany({ where: { fileSha256: { startsWith: "demo-" } } });
      const lines = await tx.line.deleteMany({ where: { id: { in: lineIds } } });
      await tx.setting.upsert({
        where: { key: DEMO_PURGED_KEY },
        create: { key: DEMO_PURGED_KEY, value: { at: new Date().toISOString() } },
        update: { value: { at: new Date().toISOString() } },
      });
      audit.event(
        "DELETE",
        "Demo",
        "purge",
        `حذف البيانات الوهمية: ${visits.count} زيارة، ${lines.count} خط، ${vpn.count} حالة VPN، ${cards.count} بطاقة`,
      );
      return { visits: visits.count, lines: lines.count, vpn: vpn.count, cards: cards.count };
    },
    db,
    { timeout: 120_000 },
  );
}
