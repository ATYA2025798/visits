"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PurgeDemo({ purged }: { purged: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function purge() {
    if (!window.confirm("سيتم حذف جميع البيانات الوهمية (الخطوط التجريبية وزياراتها وحالات VPN والبطاقات) نهائياً. هل تريد المتابعة؟"))
      return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/demo/purge", { method: "POST", credentials: "same-origin" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? `خطأ ${res.status}`);
      setMsg({
        ok: true,
        text: `تم حذف البيانات الوهمية: ${d.visits} زيارة، و${d.lines} خطاً، و${d.vpn} حالة VPN، و${d.cards} بطاقة.`,
      });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-pad grid" aria-label="البيانات الوهمية" style={{ marginBottom: 16 }}>
      <div>
        <h2>حذف البيانات الوهمية</h2>
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          يحذف بيانات العرض التجريبية بالكامل، ولا تعود بعد إعادة تشغيل النظام. حسابات المستخدمين والقوائم تبقى كما هي.
        </p>
      </div>
      {purged && !msg ? (
        <div className="alert alert-ok" role="status">
          تم حذف البيانات الوهمية من هذه النسخة، ولن تعود بعد إعادة التشغيل.
        </div>
      ) : (
        !purged && (
          <div className="actions">
            <button className="btn btn-danger" onClick={purge} disabled={busy}>
              {busy ? "جارٍ الحذف…" : "حذف البيانات الوهمية"}
            </button>
          </div>
        )
      )}
      {msg && (
        <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </div>
      )}
    </section>
  );
}
