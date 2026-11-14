"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate } from "@/lib/format";

type Preview = {
  sheet: string;
  summary: { visits: number; mergedRows: number; specialCases: number; doubtfulDates: number; maxNumber: number };
  duplicateNumbers: number;
  from: string | null;
  to: string | null;
  recommendations: Array<{ label: string; count: number }>;
  unknownValues: Array<{ kind: string; label: string; count: number }>;
};

async function send(url: string, file: File) {
  const fd = new FormData();
  fd.set("file", file);
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: fd, credentials: "same-origin" });
  } catch {
    throw new Error("تعذّر الاتصال بالخادم");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `خطأ ${res.status}`);
  return data;
}

export function LegacyFlow({ legacyCount }: { legacyCount: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<null | "preview" | "apply">(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const file = () => fileRef.current?.files?.[0];

  async function doPreview() {
    const f = file();
    if (!f) return setError("اختر ملف الإكسل أولاً");
    setError(null);
    setDone(null);
    setBusy("preview");
    try {
      setPreview(await send("/api/legacy/preview", f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function doApply() {
    const f = file();
    if (!f || !preview) return;
    setError(null);
    setBusy("apply");
    try {
      const r = await send("/api/legacy/apply", f);
      setDone(`تم النقل: ${r.created} زيارة جديدة، و${r.updated} زيارة حُدّثت، و${r.unchanged} دون تغيير.`);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid">
      <section className="card card-pad grid" aria-label="رفع الملف">
        <div className="field">
          <label htmlFor="legacy-file">ملف الإكسل</label>
          <input id="legacy-file" ref={fileRef} type="file" accept=".xlsx" className="input" onChange={() => setPreview(null)} />
          <span className="hint">الزيارات المنقولة حالياً: {legacyCount}</span>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={doPreview} disabled={busy !== null}>
            {busy === "preview" ? "جارٍ قراءة الملف…" : "معاينة"}
          </button>
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {done && (
          <div className="alert alert-ok" role="status">
            {done}
          </div>
        )}
      </section>

      {preview && (
        <section className="card" aria-label="المعاينة">
          <div className="card-head">
            <h2>معاينة الورقة {preview.sheet}</h2>
            {preview.from && preview.to && (
              <span className="hint ltr">
                {fmtDate(new Date(preview.from))} — {fmtDate(new Date(preview.to))}
              </span>
            )}
          </div>
          <div className="kpis card-pad" style={{ marginBottom: 0 }}>
            <div className="card kpi kpi-blue">
              <span className="kpi-body">
                <div className="label">الزيارات</div>
                <div className="value">{preview.summary.visits}</div>
                <div className="sub">صفوف مكمّلة دُمجت: {preview.summary.mergedRows}</div>
              </span>
            </div>
            <div className="card kpi kpi-navy">
              <span className="kpi-body">
                <div className="label">حالات خاصة</div>
                <div className="value">{preview.summary.specialCases}</div>
                <div className="sub">دون Line Code صالح</div>
              </span>
            </div>
            <div className="card kpi kpi-amber">
              <span className="kpi-body">
                <div className="label">تواريخ تحتاج مراجعة</div>
                <div className="value">{preview.summary.doubtfulDates}</div>
                <div className="sub">أرقام زيارات مكررة في الملف: {preview.duplicateNumbers}</div>
              </span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>التوصية</th>
                  <th>العدد</th>
                </tr>
              </thead>
              <tbody>
                {preview.recommendations.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.unknownValues.length > 0 && (
            <div className="card-pad small muted">
              قيم غير موجودة في القوائم وستُضاف كقيم موقوفة تظهر في الزيارات القديمة فقط:{" "}
              {preview.unknownValues.map((u) => `${u.label} (${u.count})`).join("، ")}
            </div>
          )}
          <div className="card-foot grid" style={{ gap: 12 }}>
            <div className="actions">
              <button className="btn btn-primary" onClick={doApply} disabled={busy !== null}>
                {busy === "apply" ? "جارٍ النقل…" : `نقل ${preview.summary.visits} زيارة إلى النظام`}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
