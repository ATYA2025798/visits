import { NextResponse } from "next/server";
import { handler, apiRequire } from "@/lib/api";
import { analyzeLegacyFile } from "@/lib/import/legacy";
import { legacySummary, readLegacyUpload } from "@/lib/import/legacy-upload";

/** معاينة ملف الزيارات القديمة بدون حفظ (دعم النظام بس) */
export const POST = handler(async (req) => {
  await apiRequire(req, "legacy:import");
  const up = await readLegacyUpload(req);
  const plan = await analyzeLegacyFile(up.buffer, { today: new Date() });
  return NextResponse.json(legacySummary(plan));
});
