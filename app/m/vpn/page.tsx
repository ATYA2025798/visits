"use client";

import { useState } from "react";
import { rememberRecent, useMobile } from "@/components/m/MobileShell";
import { GpsBox, SavedNotice } from "@/components/m/FieldBits";
import { enqueue } from "@/lib/offline/queue";
import { flushQueue } from "@/lib/offline/sync";
import type { Gps } from "@/lib/offline/device";

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export default function MobileVpn() {
  const [n, setN] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  if (saved)
    return (
      <SavedNotice
        text={saved}
        onAgain={() => {
          setSaved(null);
          setN((x) => x + 1);
        }}
      />
    );
  return <VpnFields key={n} onSaved={setSaved} />;
}

function VpnFields({ onSaved }: { onSaved: (t: string) => void }) {
  const { online } = useMobile();
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [place, setPlace] = useState("");
  const [suspects, setSuspects] = useState("");
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<Gps | null>(null);
  const [previous, setPrevious] = useState<{ id: string; networkName: string; ip: string; owner: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check(q: string) {
    if (!online || q.trim().length < 3) return;
    try {
      const d = await (await fetch(`/api/vpn/check?q=${encodeURIComponent(q.trim())}`)).json();
      setPrevious(d.cases ?? []);
    } catch {}
  }

  async function save() {
    setError("");
    if (!name.trim()) return setError("أدخل اسم الشبكة");
    if (!IPV4.test(ip.trim()) && !ip.includes(":")) return setError("عنوان IP غير صحيح");
    setBusy(true);
    const label = `VPN ${name.trim()}`;
    const item = await enqueue(
      "VPN",
      {
        networkName: name.trim(),
        ip: ip.trim(),
        placeText: place.trim() || null,
        suspects: suspects.trim() || null,
        notes: notes.trim() || null,
        gps,
      },
      label,
    );
    rememberRecent({ uuid: item.uuid, kind: "VPN", label, at: item.filledAt });
    const r = navigator.onLine ? await flushQueue().catch(() => null) : null;
    setBusy(false);
    onSaved(r && r.sent > 0 ? "تم إرسال حالة VPN." : "تم الحفظ على الجهاز، وسيتم الإرسال تلقائياً عند عودة الاتصال.");
  }

  return (
    <form
      className="grid"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
    >
      <h1 style={{ fontSize: 20 }}>حالة VPN</h1>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="card card-pad grid">
        <div className="field">
          <label htmlFor="v-name">اسم الشبكة</label>
          <input
            id="v-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => check(name)}
          />
        </div>
        <div className="field">
          <label htmlFor="v-ip">عنوان IP الذي ظهر لديك</label>
          <input
            id="v-ip"
            className="input ltr"
            inputMode="decimal"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onBlur={() => check(ip)}
            placeholder="10.20.30.40"
          />
        </div>
        {previous.length > 0 && (
          <div className="alert alert-warn" role="status">
            سبق تسجيل {previous.length} حالة بعنوان IP نفسه أو بالاسم نفسه:
            <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
              {previous.map((p) => (
                <li key={p.id}>
                  {p.networkName} · <span className="ltr">{p.ip}</span> · {p.owner}
                </li>
              ))}
            </ul>
          </div>
        )}
        <GpsBox value={gps} onChange={setGps} />
        <div className="field">
          <label htmlFor="v-place">وصف المكان</label>
          <input id="v-place" className="input" value={place} onChange={(e) => setPlace(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="v-sus">الحسابات المشتبه بها</label>
          <textarea
            id="v-sus"
            className="input"
            rows={2}
            value={suspects}
            onChange={(e) => setSuspects(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="v-notes">ملاحظات</label>
          <textarea id="v-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="m-sticky-save">
        <button className="btn btn-green btn-block" type="submit" disabled={busy}>
          {busy ? "جارٍ الحفظ…" : "حفظ الحالة"}
        </button>
      </div>
    </form>
  );
}
