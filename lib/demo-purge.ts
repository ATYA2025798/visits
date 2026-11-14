/**
 * تنظيف لمرة واحدة: النسخة المنشورة بدأت كنسخة عرض فيها بيانات وهمية (خطوط T-… وزياراتها،
 * حالات VPN، البطاقات، ملفات أشهر تجريبية). عند أول إقلاع للنسخة الرسمية بتنحذف،
 * وبينحفظ إنها انحذفت فما بيتكرر الحذف أبداً (حتى ما يلمس بيانات حقيقية لاحقاً).
 * سجل العمليات وسجل عرض كلمات السر ما بينحذفوا (append-only).
 */
import { prisma as defaultPrisma, type Db } from "./db";
import { withAudit } from "./audit";

export const DEMO_CLEANED_KEY = "demo.purged";

export async function removeSeededDemoData(db: Db = defaultPrisma) {
  if (await db.setting.findUnique({ where: { key: DEMO_CLEANED_KEY } })) return null;
  const fakeLines = await db.line.findMany({ where: { code: { startsWith: "T-" } }, select: { id: true } });
  const seededImports = await db.import.count({ where: { fileSha256: { startsWith: "demo-" } } });
  const markDone = () =>
    db.setting.create({ data: { key: DEMO_CLEANED_KEY, value: { at: new Date().toISOString() } } });
  if (!fakeLines.length && !seededImports) {
    await markDone();
    return null;
  }
  return withAudit(
    null,
    async (tx, audit) => {
      const lineIds = fakeLines.map((l) => l.id);
      const visitIds = (
        await tx.visit.findMany({
          where: { source: "APP", OR: [{ lineId: { in: lineIds } }, { lineCodeKey: { startsWith: "T" } }] },
          select: { id: true },
        })
      ).map((v) => v.id);
      await tx.attachment.deleteMany({ where: { entityId: { in: visitIds } } });
      const visits = await tx.visit.deleteMany({ where: { id: { in: visitIds } } });
      // كل حالات VPN والبطاقات بنسخة العرض كانت وهمية
      const vpn = await tx.vpnCase.deleteMany({});
      const cards = await tx.cardPurchase.deleteMany({});
      await tx.monthTarget.deleteMany({ where: { lineId: { in: lineIds } } });
      await tx.import.deleteMany({ where: { fileSha256: { startsWith: "demo-" } } });
      const lines = await tx.line.deleteMany({ where: { id: { in: lineIds } } });
      await tx.setting.create({ data: { key: DEMO_CLEANED_KEY, value: { at: new Date().toISOString() } } });
      audit.event(
        "DELETE",
        "Demo",
        "cleanup",
        `حذف بيانات نسخة العرض: ${visits.count} زيارة، ${lines.count} خط، ${vpn.count} حالة VPN، ${cards.count} بطاقة`,
      );
      return { visits: visits.count, lines: lines.count, vpn: vpn.count, cards: cards.count };
    },
    db,
    { timeout: 120_000 },
  );
}
