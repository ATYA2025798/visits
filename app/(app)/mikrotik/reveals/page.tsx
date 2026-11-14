import { fmtDateTime } from "@/lib/format";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { revealLog } from "@/lib/mikrotik-credentials";

export const metadata: Metadata = { title: "سجل عرض كلمات السر" };


export default async function RevealsPage() {
  const me = await requirePermission("mikrotik:revealLog");
  const rows = await revealLog(me);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>سجل عرض كلمات سر المايكروتيك</h1>
          <p className="muted">يبيّن من عرض كلمة سر كل حساب ومتى. وهو متاح للسفراء فقط، ولا يظهر للمسؤول.</p>
        </div>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">لم يعرض أحد أي كلمة سر حتى الآن.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>متى</th>
                <th>المستخدم</th>
                <th>الحساب</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id.toString()}>
                  <td className="small">{fmtDateTime(r.at)}</td>
                  <td>{r.user.displayName}</td>
                  <td className="ltr">{r.lineCodeKey}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
