import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { followupMonths, monthFollowup, MONTH_RE, type FollowupLine } from "@/lib/followup";
import { fmtMonth } from "@/lib/format";
import { fmtDay, RecBadge } from "@/components/visit-ui";
import { Icon } from "@/components/Icon";
import { ProgressRing, Trend } from "@/components/ProgressRing";

export const metadata: Metadata = { title: "متابعة ملف الشهر" };

const SHOW = {
  all: "جميع الخطوط",
  pending: "لم تتم زيارتها",
  visited: "تمت زيارتها",
  carried: "مرحّلة من الشهر السابق",
} as const;
type Show = keyof typeof SHOW;

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

function LinesTable({ rows, empty }: { rows: FollowupLine[]; empty: string }) {
  if (!rows.length) return <div className="empty">{empty}</div>;
  return (
    <div className="table-wrap">
      <table className="table stack">
        <thead>
          <tr>
            <th>Line Code</th>
            <th>الحساب</th>
            <th>المنطقة</th>
            <th>الحالة</th>
            <th>تاريخ الزيارة</th>
            <th>السفير</th>
            <th>التوصية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.lineId}>
              <td className="cell-main">
                <Link href={`/search?code=${encodeURIComponent(l.code)}`} className="ltr">
                  <b>{l.code}</b>
                </Link>
                {l.carried && (
                  <span className="badge badge-blue" style={{ marginInlineStart: 6 }}>
                    مرحّل
                  </span>
                )}
              </td>
              <td data-label="الحساب" className="small">
                {l.accountName ?? "—"}
              </td>
              <td data-label="المنطقة" className="small">
                {l.region ?? "—"}
              </td>
              <td data-label="الحالة">
                {l.visit ? (
                  <span className="badge badge-green">تمت الزيارة</span>
                ) : (
                  <span className="badge badge-warn">لم تتم الزيارة</span>
                )}
              </td>
              <td data-label="تاريخ الزيارة" className="small">
                {l.visit ? (
                  <Link href={`/visits/${l.visit.id}`} className="ltr">
                    {fmtDay(l.visit.visitedOn)}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td data-label="السفير" className="small">
                {l.visit?.owner ?? "—"}
              </td>
              <td data-label="التوصية">
                <RecBadge label={l.visit?.recommendation} color={l.visit?.color} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function FollowupPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; show?: string }>;
}) {
  await requirePermission("visits:view");
  const sp = await searchParams;
  const months = await followupMonths();
  const month = sp.month && MONTH_RE.test(sp.month) && months.includes(sp.month) ? sp.month : months[0];
  const show: Show = sp.show && sp.show in SHOW ? (sp.show as Show) : "all";

  const head = (
    <div className="page-head">
      <div>
        <div className="eyebrow">ملف الزيارات الشهري من المسؤول</div>
        <h1>متابعة ملف الشهر</h1>
        <p className="muted">
          متابعة الخطوط المطلوب زيارتها في كل ملف شهري: ما تمت زيارته وما لم تتم، والخطوط المرحّلة من الشهر السابق،
          والمتأخرة منه دون توصية، ونسبة الإنجاز مقارنة بالشهر السابق.
        </p>
      </div>
    </div>
  );
  if (!month) {
    return (
      <>
        {head}
        <div className="card">
          <div className="empty">لم يُرفع أي ملف شهري حتى الآن. يُرفع الملف من صفحة «ملف الشهر».</div>
        </div>
      </>
    );
  }

  const f = await monthFollowup(month);
  const rows = f.lines
    .filter((l) =>
      show === "pending" ? !l.visit : show === "visited" ? !!l.visit : show === "carried" ? l.carried : true,
    )
    .sort(
      (a, b) =>
        Number(!!a.visit) - Number(!!b.visit) ||
        (a.region ?? "").localeCompare(b.region ?? "") ||
        a.code.localeCompare(b.code),
    );
  const stillOverdue = f.overdue.filter((o) => !o.resolvedThisMonth);
  const q = (o: Record<string, string>) => `/followup?${new URLSearchParams({ month, ...o })}`;
  const counts: Record<Show, number> = {
    all: f.total,
    pending: f.pending,
    visited: f.visited,
    carried: f.carried,
  };

  return (
    <>
      {head}
      <nav className="chips" aria-label="الأشهر" style={{ marginBottom: 16 }}>
        {months.map((m) => (
          <Link key={m} className="chip" href={`/followup?month=${m}`} aria-current={m === month ? "page" : undefined}>
            <Icon name="calendar" size={14} />
            {fmtMonth(m)}
          </Link>
        ))}
      </nav>

      <section className="kpis" aria-label="ملخص الشهر" style={{ marginBottom: 16 }}>
        <div className="card kpi kpi-blue">
          <span className="kpi-icon">
            <Icon name="list" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">الخطوط المطلوبة</div>
            <div className="value">{f.total}</div>
            <div className="sub">{f.excluded ? `إضافة إلى ${f.excluded} مستثناة` : "دون استثناءات"}</div>
          </span>
        </div>
        <div className="card kpi kpi-green">
          <span className="kpi-icon">
            <Icon name="check" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">تمت زيارتها</div>
            <div className="value">{f.visited}</div>
            <div className="sub">لم تتم زيارة {f.pending}</div>
          </span>
        </div>
        <div className="card kpi kpi-navy">
          <span className="kpi-icon">
            <Icon name="history" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">مرحّلة من {fmtMonth(f.previous)}</div>
            <div className="value">{f.carried}</div>
            <div className="sub">موجودة في ملف الشهر السابق أيضاً</div>
          </span>
        </div>
        <div className="card kpi kpi-amber">
          <span className="kpi-icon">
            <Icon name="clock" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">متأخرة من الشهر السابق</div>
            <div className="value">{stillOverdue.length}</div>
            <div className="sub">
              من أصل {f.overdue.length} دون توصية · عولج منها {f.overdue.length - stillOverdue.length}
            </div>
          </span>
        </div>
      </section>

      <div className="dash-row">
        <section className="card" aria-label="التوزيع حسب المنطقة">
          <div className="card-head">
            <h2>الإنجاز حسب المنطقة</h2>
            <span className="hint">{fmtMonth(month)}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المنطقة</th>
                  <th>المطلوب</th>
                  <th>تمت</th>
                  <th>المتبقي</th>
                  <th style={{ width: "34%" }}>نسبة الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {f.byRegion.map((r) => (
                  <tr key={r.key}>
                    <td>{r.key}</td>
                    <td>{r.total}</td>
                    <td>
                      <b>{r.visited}</b>
                    </td>
                    <td>{r.total - r.visited}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="meter" style={{ flex: 1 }}>
                          <span style={{ width: `${pct(r.visited, r.total)}%` }} />
                        </div>
                        <span className="ltr small">{pct(r.visited, r.total)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card progress-card" aria-label="نسبة الإنجاز">
          <div className="card-head">
            <h2>نسبة الإنجاز</h2>
            <Trend now={f.rate} before={f.previousRate} />
          </div>
          <div className="ring-wrap">
            <ProgressRing value={f.rate} label={fmtMonth(month)} />
            <div className="ring-facts">
              <div>
                <span className="muted">{fmtMonth(month)}</span> <b className="ltr">{f.rate}%</b>
              </div>
              <div>
                <span className="muted">{fmtMonth(f.previous)}</span>{" "}
                <b className="ltr">{f.previousRate !== null ? `${f.previousRate}%` : "—"}</b>
              </div>
              <div>
                <span className="muted">خطوط الشهر السابق</span> <b>{f.previousTotal ?? "—"}</b>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="dash-row dash-row-even">
        <section className="card" aria-label="حسب السفير">
          <div className="card-head">
            <h2>الزيارات المنجزة حسب السفير</h2>
          </div>
          {f.byAmbassador.length ? (
            <div className="card-pad">
              <ul className="barlist">
                {f.byAmbassador.map((a) => (
                  <li key={a.key}>
                    <span>{a.key}</span>
                    <div className="meter" style={{ flex: 1 }}>
                      <span style={{ width: `${pct(a.visits, f.visited)}%` }} />
                    </div>
                    <b>{a.visits}</b>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty">لا توجد زيارات منجزة بعد.</div>
          )}
        </section>
        <section className="card" aria-label="حسب التوصية">
          <div className="card-head">
            <h2>نتائج الزيارات حسب التوصية</h2>
          </div>
          {f.byRecommendation.length ? (
            <div className="card-pad">
              <ul className="barlist">
                {f.byRecommendation.map((r) => (
                  <li key={r.key}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="status-dot" style={{ background: r.color ?? "var(--ink-3)" }} />
                      {r.key}
                    </span>
                    <div className="meter" style={{ flex: 1 }}>
                      <span style={{ width: `${pct(r.count, f.visited)}%`, background: r.color ?? undefined }} />
                    </div>
                    <b>{r.count}</b>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty">لا توجد زيارات منجزة بعد.</div>
          )}
        </section>
      </div>

      <section className="card" aria-label="خطوط الملف" style={{ marginBottom: 16 }}>
        <div className="card-head" style={{ flexWrap: "wrap" }}>
          <h2>خطوط ملف {fmtMonth(month)}</h2>
          <nav className="chips" aria-label="تصفية الخطوط">
            {(Object.keys(SHOW) as Show[]).map((k) => (
              <Link key={k} className="chip" href={q({ show: k })} aria-current={k === show ? "page" : undefined}>
                {SHOW[k]} ({counts[k]})
              </Link>
            ))}
          </nav>
        </div>
        <LinesTable rows={rows} empty="لا توجد خطوط ضمن هذا التصنيف." />
      </section>

      <section className="card" aria-label="المتأخرة من الشهر السابق">
        <div className="card-head">
          <h2>المتأخرة من {fmtMonth(f.previous)} دون توصية</h2>
          <span className="hint">خطوط ملف الشهر السابق التي لم تُزر فيه أو زيرت دون توصية</span>
        </div>
        {f.overdue.length ? (
          <div className="table-wrap">
            <table className="table stack">
              <thead>
                <tr>
                  <th>Line Code</th>
                  <th>الحساب</th>
                  <th>المنطقة</th>
                  <th>الوضع الحالي</th>
                  <th>زيارة هذا الشهر</th>
                </tr>
              </thead>
              <tbody>
                {f.overdue
                  .sort((a, b) => Number(a.resolvedThisMonth) - Number(b.resolvedThisMonth))
                  .map((o) => (
                    <tr key={o.lineId}>
                      <td className="cell-main">
                        <Link href={`/search?code=${encodeURIComponent(o.code)}`} className="ltr">
                          <b>{o.code}</b>
                        </Link>
                      </td>
                      <td data-label="الحساب" className="small">
                        {o.accountName ?? "—"}
                      </td>
                      <td data-label="المنطقة" className="small">
                        {o.region ?? "—"}
                      </td>
                      <td data-label="الوضع الحالي">
                        {o.resolvedThisMonth ? (
                          <span className="badge badge-green">عولج هذا الشهر</span>
                        ) : (
                          <span className="badge badge-red">ما زال متأخراً</span>
                        )}
                      </td>
                      <td data-label="زيارة هذا الشهر" className="small">
                        {o.visit ? (
                          <Link href={`/visits/${o.visit.id}`} className="ltr">
                            {fmtDay(o.visit.visitedOn)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            {f.hasPrevious ? "لا توجد خطوط متأخرة من الشهر السابق." : "لا يوجد ملف للشهر السابق للمقارنة."}
          </div>
        )}
      </section>
    </>
  );
}
