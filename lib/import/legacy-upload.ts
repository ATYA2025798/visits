/** رفع ملف الزيارات القديمة (multipart) */
import type { NextRequest } from "next/server";
import { ApiError } from "../errors";
import { MAX_UPLOAD_BYTES } from "./upload";
import type { LegacyPlan } from "./legacy";

export async function readLegacyUpload(req: NextRequest) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 100_000) throw new ApiError(413, "حجم الملف يتجاوز 15 ميغابايت");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "تعذّرت معالجة الطلب");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "اختر ملف الزيارات القديمة");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "حجم الملف يتجاوز 15 ميغابايت");
  if (!/\.xlsx$/i.test(file.name)) throw new ApiError(400, "يجب أن يكون الملف بصيغة إكسل (.xlsx)");
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
  };
}

/** ملخص المعاينة للواجهة */
export function legacySummary(plan: LegacyPlan) {
  const recs = new Map<string, number>();
  for (const v of plan.visits) recs.set(v.recommendation ?? "بدون توصية", (recs.get(v.recommendation ?? "بدون توصية") ?? 0) + 1);
  const dates = plan.visits.map((v) => v.visitedOn).filter((d): d is Date => !!d).map((d) => d.getTime());
  return {
    sheet: plan.sheet,
    summary: plan.summary,
    duplicateNumbers: plan.duplicateNumbers.length,
    from: dates.length ? new Date(Math.min(...dates)).toISOString() : null,
    to: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    recommendations: [...recs.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    unknownValues: plan.unknownValues.slice(0, 50),
  };
}
