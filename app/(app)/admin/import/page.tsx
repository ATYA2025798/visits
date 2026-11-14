import { fmtDateTime } from "@/lib/format";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { ImportFlow } from "./ImportFlow";

export const metadata: Metadata = { title: "ملف الشهر" };


type Stats = {
  newLines: number;
  changedLines: number;
  missingFromFile: number;
  targets: number;
  logRows: number;
  problems: number;
};

export default async function ImportPage() {
  const me = await requirePermission("visits:view");
  const canImport = can(me, "subscribers:import");
  const [history, users] = await Promise.all([
    prisma.import.findMany({ orderBy: { createdAt: "desc" }, take: 24 }),
    prisma.user.findMany({ select: { id: true, displayName: true } }),
  ]);
  const names = new Map(users.map((u) => [u.id, u.displayName]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>ملف الشهر</h1>
          <p className="muted">
            ارفع ملف الزيارات الذي يرسله المسؤول. ستظهر معاينة كاملة قبل الحفظ، ولا تُحذف الخطوط؛ إذ يُعلَّم الخط غير الموجود في الملف فقط.
          </p>
        </div>
      </div>

      {canImport && <ImportFlow />}

      <div className="card">
        <div className="card-head">
          <h2>الملفات المرفوعة</h2>
        </div>
        {history.length === 0 ? (
          <div className="empty">لم يُرفع أي ملف حتى الآن.</div>
        ) : (
          <div className="table-wrap">
            <table className="table stack">
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>الملف</th>
                  <th>بواسطة وتاريخ الرفع</th>
                  <th>النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const s = h.stats as unknown as Stats;
                  return (
                    <tr key={h.id}>
                      <td className="cell-main">
                        <b className="ltr">{h.month}</b>
                      </td>
                      <td data-label="الملف" className="small">
                        <bdi>{h.fileName}</bdi>
                      </td>
                      <td data-label="بواسطة وتاريخ الرفع" className="small muted">
                        {names.get(h.importedById) ?? "—"} · {fmtDateTime(h.createdAt)}
                      </td>
                      <td data-label="النتيجة" className="small">
                        {s.newLines} جديد · {s.changedLines} تغيّر · {s.targets} زيارة للشهر · {s.logRows} بسجل الإدارة
                        {s.problems > 0 && <span className="muted"> · {s.problems} صف فيه مشكلة</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
