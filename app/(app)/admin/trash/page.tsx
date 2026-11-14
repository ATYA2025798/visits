import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/authz";
import { listVisits } from "@/lib/visit-list";
import { fmtDay } from "@/components/visit-ui";
import { RestoreVisitButton } from "@/components/VisitActions";

export const metadata: Metadata = { title: "سلة المحذوفات" };

export default async function TrashPage() {
  const me = await requirePermission("visits:view");
  const { rows, total } = await listVisits({ deleted: true }, { pageSize: 200 });
  return (
    <>
      <div className="page-head">
        <div>
          <h1>سلة المحذوفات</h1>
          <p className="muted">لا تُمسح الزيارات المحذوفة نهائياً، ويمكن استرجاعها، وتُسجَّل كل عملية حذف واسترجاع في السجل.</p>
        </div>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">سلة المحذوفات فارغة.</div>
        ) : (
          <div className="table-wrap">
            <table className="table stack">
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td className="cell-main">
                      <a href={`/visits/${v.id}`} className="ltr">
                        {v.lineCode ?? "حالة خاصة"}
                      </a>{" "}
                      {v.accountName}
                    </td>
                    <td data-label="التاريخ" className="small">
                      {fmtDay(v.visitedOn)}
                    </td>
                    <td data-label="الخط" className="ltr">
                      {v.lineCode ?? "—"}
                    </td>
                    <td className="cell-actions">
                      {can(me, "visits:delete") && <RestoreVisitButton visitId={v.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pager small muted">{total} زيارة محذوفة</div>
      </div>
    </>
  );
}
