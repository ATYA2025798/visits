import { fmtLongDate, fmtMonth } from "@/lib/format";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { dashboardStats } from "@/lib/stats";
import { followupMonths, monthFollowup } from "@/lib/followup";
import { todayLocal } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/roles";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import { BarList } from "@/components/charts/BarList";
import { Icon } from "@/components/Icon";
import { ProgressRing, Trend } from "@/components/ProgressRing";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export default async function HomePage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const today = todayLocal();
  const isAmb = can(user, "visits:mine");

  const header = (
    <div className="page-head">
      <div>
        <div className="eyebrow">لوحة المتابعة · {ROLE_LABEL[user.role]}</div>
        <h1>مرحباً، {user.displayName}</h1>
        <p className="muted">{fmtLongDate(new Date())}</p>
      </div>
      {can(user, "visits:create") && (
        <div className="actions">
          <Link className="btn btn-ghost" href="/search">
            <Icon name="search" size={16} /> البحث باستخدام Line Code
          </Link>
          <Link className="btn btn-primary" href="/visits/new">
            <Icon name="plus" size={16} /> زيارة جديدة
          </Link>
        </div>
      )}
    </div>
  );

  if (!can(user, "stats:view")) return header;
  const [s, months] = await Promise.all([dashboardStats({ today, userId: user.id }), followupMonths()]);
  const fu = months[0] ? await monthFollowup(months[0]) : null;
  const a = s.alerts;

  return (
    <>
      {header}
      {denied && (
        <div className="alert alert-warn" role="alert" style={{ marginBottom: 16 }}>
          ليست لديك صلاحية للوصول إلى هذه الصفحة.
        </div>
      )}

      <section className="kpis" aria-label="الأرقام" style={{ marginBottom: 16 }}>
        <Link className="card kpi kpi-blue" href={`/visits?from=${today}&to=${today}`}>
          <span className="kpi-icon">
            <Icon name="calendar" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">زيارات اليوم</div>
            <div className="value">{s.visits.today}</div>
            <div className="sub">
              هذا الأسبوع {s.visits.week} · هذا الشهر {s.visits.month}
            </div>
          </span>
        </Link>
        <Link className="card kpi kpi-green" href={fu ? `/followup?month=${fu.month}` : "/followup"}>
          <span className="kpi-icon">
            <Icon name="target" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">إنجاز ملف الشهر{fu ? ` · ${fmtMonth(fu.month)}` : ""}</div>
            <div className="value">
              {fu ? nf.format(fu.rate) : "—"}
              {fu && <span className="unit">%</span>}
            </div>
            <div className="sub">
              {fu ? (
                <>
                  {fu.visited} من {fu.total} خط <Trend now={fu.rate} before={fu.previousRate} />
                </>
              ) : (
                "لم يُرفع ملف شهري بعد"
              )}
            </div>
          </span>
        </Link>
        <div className="card kpi kpi-navy">
          <span className="kpi-icon">
            <Icon name="alert" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">نسبة التجاوزات هذا الشهر</div>
            <div className="value">
              {nf.format(s.violations.monthRate)}
              <span className="unit">%</span>
            </div>
            <div className="sub">
              {s.violations.month} من {s.visits.month} زيارة · الإجمالي {nf.format(s.violations.totalRate)}%
            </div>
          </span>
        </div>
        <Link className="card kpi kpi-amber" href="/revisits">
          <span className="kpi-icon">
            <Icon name="refresh" size={20} />
          </span>
          <span className="kpi-body">
            <div className="label">بانتظار إعادة زيارة</div>
            <div className="value">{s.openRevisits}</div>
            <div className="sub">{a.postponedTwice.length} مؤجلة أكثر من مرة</div>
          </span>
        </Link>
      </section>

      <div className="dash-row">
        <section className="card" aria-label="الزيارات شهرياً">
          <div className="card-head">
            <h2>الزيارات شهرياً حسب التوصية</h2>
            <span className="hint">{s.visits.total} زيارة في المجموع</span>
          </div>
          <div className="card-pad">
            <MonthlyChart months={s.monthly} />
          </div>
        </section>

        <section className="card progress-card" aria-label="متابعة ملف الشهر">
          <div className="card-head">
            <h2>متابعة ملف الشهر</h2>
            {fu && <span className="hint">{fmtMonth(fu.month)}</span>}
          </div>
          {fu ? (
            <>
              <div className="ring-wrap">
                <ProgressRing value={fu.rate} label="نسبة الإنجاز" />
                <div className="ring-facts">
                  <div>
                    <span className="muted">المطلوب</span> <b>{fu.total}</b>
                  </div>
                  <div>
                    <span className="muted">تمت زيارته</span> <b>{fu.visited}</b>
                  </div>
                  <div>
                    <span className="muted">لم تتم زيارته</span> <b>{fu.pending}</b>
                  </div>
                  <div>
                    <span className="muted">متأخر من الشهر السابق</span>{" "}
                    <b>{fu.overdue.filter((o) => !o.resolvedThisMonth).length}</b>
                  </div>
                  {fu.previousRate !== null && (
                    <div>
                      <span className="muted">الشهر السابق</span> <b className="ltr">{fu.previousRate}%</b>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-foot">
                <Link href={`/followup?month=${fu.month}`}>عرض التفاصيل الكاملة</Link>
              </div>
            </>
          ) : (
            <div className="empty">لم يُرفع ملف شهري بعد.</div>
          )}
        </section>
      </div>

      <div className="dash-row dash-row-even">
        <section className="card" aria-label="زيارات كل سفير">
          <div className="card-head">
            <h2>أداء السفراء</h2>
            <span className="hint">عدد الزيارات</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>السفير</th>
                  <th>هذا الشهر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {s.byAmbassador.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>
                      <b>{r.month}</b>
                    </td>
                    <td>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" aria-label="توزيع الإجراءات">
          <div className="card-head">
            <h2>توزيع الإجراءات</h2>
            <span className="hint">جميع الزيارات</span>
          </div>
          <div className="card-pad">
            <BarList rows={s.actions} muted={["بدون إجراء"]} />
          </div>
        </section>
      </div>

      <div>
        <section className="card" aria-label="تنبيهات">
          <div className="card-head">
            <h2>تنبيهات تتطلب المتابعة</h2>
          </div>
          <div className="alerts-grid">
            <div>
              <h3 className="alert-title">
                تجاوزات بدون إجراء <span className="badge badge-red">{a.violationsNoAction.length}</span>
              </h3>
              {a.violationsNoAction.length === 0 ? (
                <p className="small muted">لا يوجد.</p>
              ) : (
                <ul className="alert-list">
                  {a.violationsNoAction.slice(0, 8).map((v) => (
                    <li key={v.id}>
                      <Link href={`/visits/${v.id}`}>
                        <span className="ltr">{v.lineCode ?? "حالة خاصة"}</span>
                      </Link>{" "}
                      <span className="muted small">{v.accountName}</span>
                    </li>
                  ))}
                  {a.violationsNoAction.length > 8 && (
                    <li className="small muted">و{a.violationsNoAction.length - 8} أخرى</li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <h3 className="alert-title">
                إعادات زيارة مؤجلة أكثر من مرة <span className="badge badge-warn">{a.postponedTwice.length}</span>
              </h3>
              {a.postponedTwice.length === 0 ? (
                <p className="small muted">لا يوجد.</p>
              ) : (
                <ul className="alert-list">
                  {a.postponedTwice.slice(0, 8).map((v) => (
                    <li key={v.id}>
                      <Link href={`/visits/${v.id}`}>
                        <span className="ltr">{v.lineCode ?? "حالة خاصة"}</span>
                      </Link>{" "}
                      <span className="muted small">عدد مرات التأجيل: {v.postponeCount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="alert-title">
                خطوط بحاجة إلى صلاحية access <span className="badge badge-blue">{a.needAccess}</span>
              </h3>
              <p className="small">
                <Link href="/mikrotik/access">فتح القائمة</Link>
              </p>
            </div>
            {isAmb && (
              <div>
                <h3 className="alert-title">
                  طلبات تعديل بانتظارك <span className="badge badge-blue">{a.pendingRequests}</span>
                </h3>
                <p className="small">
                  <Link href="/inbox">فتح الطلبات</Link>
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
