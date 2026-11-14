import { fmtDateTime } from "@/lib/format";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/authz";
import { findVpnCases } from "@/lib/vpn";
import { GpsLink } from "@/components/FieldExtras";
import { VpnSiteForm } from "@/components/SiteFieldForms";

export const metadata: Metadata = { title: "حالات VPN" };


export default async function VpnPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requirePermission("visits:view");
  const q = ((await searchParams).q ?? "").slice(0, 100);
  const rows = await findVpnCases({ q });
  return (
    <>
      <div className="page-head">
        <div>
          <h1>حالات VPN</h1>
          <p className="muted">مستقلة عن الزيارات. وإذا سبق تسجيل عنوان IP نفسه أو اسم الشبكة نفسه، تظهر علامة «متكرر».</p>
        </div>
      </div>
      {can(me, "visits:create") && <VpnSiteForm />}
      <div className="card">
        <form className="filters actions" method="get" role="search">
          <label className="sr-only" htmlFor="vq">
            البحث بعنوان IP أو الاسم
          </label>
          <input
            id="vq"
            name="q"
            className="input"
            style={{ maxWidth: 320 }}
            defaultValue={q}
            placeholder="البحث بعنوان IP أو اسم الشبكة"
          />
          <button className="btn btn-primary">بحث</button>
        </form>
        {rows.length === 0 ? (
          <div className="empty">لا توجد حالات{q ? " مطابقة لهذا البحث" : ""}.</div>
        ) : (
          <div className="table-wrap">
            <table className="table stack">
              <thead>
                <tr>
                  <th>الشبكة</th>
                  <th>IP</th>
                  <th>المكان</th>
                  <th>المشتبه بهم</th>
                  <th>بواسطة وتاريخ الرفع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="cell-main">
                      <b>{r.networkName}</b>{" "}
                      {r.duplicates > 0 && <span className="badge badge-red">متكرر ({r.duplicates})</span>}
                      {r.notes && <div className="small muted">{r.notes}</div>}
                    </td>
                    <td data-label="IP" className="ltr">
                      <a href={`/vpn?q=${encodeURIComponent(r.ip)}`}>{r.ip}</a>
                    </td>
                    <td data-label="المكان" className="small">
                      {r.placeText ?? ""} <GpsLink lat={r.lat} lng={r.lng} accuracy={r.gpsAccuracy} />
                    </td>
                    <td data-label="المشتبه بهم" className="small">
                      {r.suspects ?? "—"}
                    </td>
                    <td data-label="بواسطة وتاريخ الرفع" className="small muted">
                      {r.owner.displayName} · {fmtDateTime(r.filledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
