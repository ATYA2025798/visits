import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { LegacyFlow } from "./LegacyFlow";

export const metadata: Metadata = { title: "نقل الزيارات القديمة" };

export default async function LegacyPage() {
  await requirePermission("legacy:import");
  const legacyCount = await prisma.visit.count({ where: { source: "LEGACY" } });
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">دعم النظام</div>
          <h1>نقل الزيارات القديمة</h1>
          <p className="muted">
            رفع ملف الإكسل الذي يحتوي على ورقة الزيارات القديمة (Sheet1) ونقلها إلى النظام. تظهر معاينة كاملة قبل
            الحفظ، ويمكن تكرار النقل بأمان دون تكرار الزيارات؛ إذ تُحدَّث الزيارة إذا صُحّحت في الملف.
          </p>
        </div>
      </div>
      <LegacyFlow legacyCount={legacyCount} />
    </>
  );
}
