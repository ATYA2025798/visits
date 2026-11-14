import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { demoPurged, isDemo } from "@/lib/demo-purge";
import { LegacyFlow } from "./LegacyFlow";
import { PurgeDemo } from "./PurgeDemo";

export const metadata: Metadata = { title: "نقل الزيارات القديمة" };

export default async function LegacyPage() {
  await requirePermission("legacy:import");
  const [legacyCount, purged] = await Promise.all([prisma.visit.count({ where: { source: "LEGACY" } }), demoPurged()]);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">دعم النظام</div>
          <h1>البيانات ونقل الزيارات القديمة</h1>
          <p className="muted">
            رفع ملف الإكسل الذي يحتوي على ورقة الزيارات القديمة (Sheet1) ونقلها إلى النظام. تظهر معاينة كاملة قبل
            الحفظ، ويمكن تكرار النقل بأمان دون تكرار الزيارات؛ إذ تُحدَّث الزيارة إذا صُحّحت في الملف.
          </p>
        </div>
      </div>
      {isDemo() && <PurgeDemo purged={purged} />}
      <LegacyFlow demo={isDemo() && !purged} legacyCount={legacyCount} />
    </>
  );
}
