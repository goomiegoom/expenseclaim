"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  loadSettings,
  saveSettings,
  fetchPayeesFromSheet,
  generateVoucherNo,
} from "@/lib/utils";
import { Payee, Settings, Voucher, VoucherItem } from "@/types/voucher";
import SettingsPanel from "@/components/SettingsPanel";
import SignatureSection from "@/components/SignatureSection";
import VoucherPrint from "@/components/VoucherPrint";

const emptyItem = (categories: string[]): VoucherItem => ({
  id: crypto.randomUUID(),
  description: "",
  category: categories[0] || "",
  amount: 0,
  taxWithheld: 0,
  note: "",
});

const today = () => new Date().toISOString().split("T")[0];

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const [voucher, setVoucher] = useState<Voucher>({
    voucherNo: "",
    date: today(),
    department: "",
    payee: null,
    items: [],
    paymentMethod: "transfer",
    discount: 0,
    requestedBy: "",
    signatureData: "",
    note: "",
    status: "draft",
    attachments: {
      receipt: false,
      taxInvoice: false,
      transferSlip: false,
      quotation: false,
      other: false,
      otherDetail: "",
    },
  });

  // Init items after settings load so category defaults correctly
  useEffect(() => {
    setVoucher((v) => ({
      ...v,
      voucherNo: generateVoucherNo(),
      items: [emptyItem(settings.expenseCategories)],
    }));
  }, []);

  useEffect(() => {
    if (settings.googleSheetUrl) doFetch(settings.googleSheetUrl);
  }, []);

  const doFetch = useCallback(async (url: string) => {
    setIsFetching(true);
    setFetchError("");
    try {
      const data = await fetchPayeesFromSheet(url);
      if (data.length === 0) setFetchError("ไม่พบข้อมูลใน Sheet");
      else setPayees(data);
    } catch {
      setFetchError("ดึงข้อมูลไม่ได้ — ตรวจสอบ URL และการ Publish");
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleSaveSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
    setShowSettings(false);
    if (s.googleSheetUrl !== settings.googleSheetUrl) doFetch(s.googleSheetUrl);
  };

  const setField = <K extends keyof Voucher>(k: K, v: Voucher[K]) =>
    setVoucher((prev) => ({ ...prev, [k]: v }));

  const setItem = (id: string, patch: Partial<VoucherItem>) =>
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));

  const addItem = () =>
    setVoucher((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem(settings.expenseCategories)],
    }));

  const removeItem = (id: string) =>
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));

  // Totals
  const itemTotals = voucher.items.map((it) => {
    const tax = (it.amount * it.taxWithheld) / 100;
    return { gross: it.amount, tax, net: it.amount - tax };
  });
  const totalGross = itemTotals.reduce((s, t) => s + t.gross, 0);
  const totalTax = itemTotals.reduce((s, t) => s + t.tax, 0);
  const totalNet = totalGross - totalTax - (voucher.discount || 0);

  const fmt = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header className="no-print" style={{
        background: "var(--accent)", color: "white", padding: "0 20px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>ระบบใบเบิกเงิน</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{settings.companyName}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {settings.googleSheetUrl && (
            <button className="btn btn-sm" onClick={() => doFetch(settings.googleSheetUrl)} disabled={isFetching}
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
              {isFetching ? "⏳" : "🔄"} {isFetching ? "กำลังดึง..." : `ผู้เบิก (${payees.length})`}
            </button>
          )}
          <button className="btn btn-sm" onClick={() => setShowSettings(true)}
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            ⚙️ ตั้งค่า
          </button>
          <button className="btn btn-sm" onClick={() => window.print()}
            style={{ background: "var(--accent-2)", color: "var(--accent)", border: "none", fontWeight: 600 }}>
            🖨️ พิมพ์
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="no-print" style={{
        background: "var(--surface)", borderBottom: "1.5px solid var(--border)",
        padding: "0 20px", display: "flex",
      }}>
        {(["form", "preview"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 18px", background: "none", border: "none",
            borderBottom: activeTab === tab ? "2.5px solid var(--accent)" : "2.5px solid transparent",
            color: activeTab === tab ? "var(--accent)" : "var(--text-2)",
            fontFamily: "var(--font)", fontSize: 13,
            fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer",
          }}>
            {tab === "form" ? "✏️ กรอกข้อมูล" : "👁 ตัวอย่างพิมพ์"}
          </button>
        ))}
      </div>

      {fetchError && (
        <div className="no-print" style={{
          background: "var(--danger-light)", borderBottom: "1px solid #f5c6cb",
          padding: "8px 20px", color: "var(--danger)", fontSize: 12,
        }}>⚠️ {fetchError}</div>
      )}

      {/* ===== FORM ===== */}
      {activeTab === "form" && (
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 60px" }}>

          {/* Row 1: Header info */}
          <Section title="ข้อมูลทั่วไป" icon="📋">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="เลขที่ใบเบิก">
                <input value={voucher.voucherNo}
                  onChange={(e) => setField("voucherNo", e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }} />
              </Field>
              <Field label="วันที่">
                <input type="date" value={voucher.date}
                  onChange={(e) => setField("date", e.target.value)} />
              </Field>
              <Field label="หน่วยงาน / แผนก">
                <ComboSelect value={voucher.department}
                  onChange={(v) => setField("department", v)}
                  options={settings.departments} placeholder="เลือกหรือพิมพ์" />
              </Field>
            </div>
          </Section>

          {/* Payee → ผู้เบิกเงิน */}
          <Section title="ผู้เบิกเงิน" icon="👤">
            {payees.length > 0 && (
              <Field label="เลือกผู้เบิกเงิน" style={{ marginBottom: 12 }}>
                <select value={voucher.payee?.id || ""}
                  onChange={(e) => {
                    const p = payees.find((x) => x.id === e.target.value) || null;
                    setField("payee", p);
                  }}>
                  <option value="">— เลือกผู้เบิกเงิน —</option>
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} {p.taxId ? `(${p.taxId})` : ""}</option>
                  ))}
                </select>
              </Field>
            )}
            {!payees.length && (
              <div style={{ padding: "10px 14px", background: "var(--accent-light)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--accent)", marginBottom: 12 }}>
                💡 ตั้งค่า Google Sheet เพื่อดึงรายชื่ออัตโนมัติ
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="ชื่อผู้เบิกเงิน">
                <input value={voucher.payee?.name || ""}
                  onChange={(e) => setField("payee", { ...(voucher.payee || { id: "manual" }), name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล / บริษัท" />
              </Field>
              <Field label="เลขภาษี / บัตรประชาชน">
                <input value={voucher.payee?.taxId || ""}
                  onChange={(e) => setField("payee", { ...(voucher.payee || { id: "manual", name: "" }), taxId: e.target.value })}
                  placeholder="13 หลัก" style={{ fontFamily: "var(--font-mono)" }} />
              </Field>
              <Field label="ธนาคาร">
                <ComboSelect value={voucher.payee?.bank || ""}
                  onChange={(v) => setField("payee", { ...(voucher.payee || { id: "manual", name: "" }), bank: v })}
                  options={THAI_BANKS} placeholder="เลือกธนาคาร" />
              </Field>
              <Field label="เลขที่บัญชี">
                <input value={voucher.payee?.accountNo || ""}
                  onChange={(e) => setField("payee", { ...(voucher.payee || { id: "manual", name: "" }), accountNo: e.target.value })}
                  placeholder="xxx-x-xxxxx-x" style={{ fontFamily: "var(--font-mono)" }} />
              </Field>
              <Field label="สาขา">
                <input value={voucher.payee?.branch || ""}
                  onChange={(e) => setField("payee", { ...(voucher.payee || { id: "manual", name: "" }), branch: e.target.value })}
                  placeholder="สาขา" />
              </Field>
              <Field label="วิธีการจ่ายเงิน">
                <select value={voucher.paymentMethod}
                  onChange={(e) => setField("paymentMethod", e.target.value as Voucher["paymentMethod"])}>
                  <option value="transfer">🏦 โอนเงิน</option>
                  <option value="cash">💵 เงินสด</option>
                  <option value="check">📝 เช็ค</option>
                  <option value="credit">💳 บัตรเครดิต</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Items Table */}
          <Section title="รายการค่าใช้จ่าย" icon="💰">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface2)", borderBottom: "1.5px solid var(--border)" }}>
                    {["รายการ / รายละเอียด", "หมวดหมู่", "จำนวนเงิน (฿)", "หัก ณ ที่จ่าย (%)", "หมายเหตุ", ""].map((h, i) => (
                      <th key={i} style={{
                        padding: "8px 10px", textAlign: i >= 2 && i <= 3 ? "center" : "left",
                        fontSize: 11, fontWeight: 600, color: "var(--text-2)",
                        whiteSpace: "nowrap", width: i === 5 ? 32 : undefined,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {voucher.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 6px 6px 10px" }}>
                        <input value={item.description}
                          onChange={(e) => setItem(item.id, { description: e.target.value })}
                          placeholder={`รายการที่ ${idx + 1}`} style={{ minWidth: 160 }} />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <ComboSelect value={item.category}
                          onChange={(v) => setItem(item.id, { category: v })}
                          options={settings.expenseCategories}
                          placeholder="หมวดหมู่" />
                      </td>
                      <td style={{ padding: "6px", width: 120 }}>
                        <input type="number" value={item.amount || ""}
                          onChange={(e) => setItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00" style={{ textAlign: "right", fontFamily: "var(--font-mono)" }} />
                      </td>
                      <td style={{ padding: "6px", width: 90 }}>
                        <input type="number" value={item.taxWithheld || ""}
                          onChange={(e) => setItem(item.id, { taxWithheld: parseFloat(e.target.value) || 0 })}
                          placeholder="0" min={0} max={100}
                          style={{ textAlign: "center", fontFamily: "var(--font-mono)" }} />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <input value={item.note || ""}
                          onChange={(e) => setItem(item.id, { note: e.target.value })}
                          placeholder="หมายเหตุ" />
                      </td>
                      <td style={{ padding: "6px 10px 6px 4px", textAlign: "center" }}>
                        <button className="btn btn-ghost btn-icon"
                          onClick={() => removeItem(item.id)}
                          style={{ color: "var(--danger)", opacity: voucher.items.length === 1 ? 0.3 : 1 }}
                          disabled={voucher.items.length === 1}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>+ เพิ่มรายการ</button>
              <div style={{ minWidth: 220, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px" }}>
                {totalTax > 0 && <SumRow label="ภาษีหัก ณ ที่จ่ายรวม" value={`(${fmt(totalTax)})`} />}
                {voucher.discount > 0 && <SumRow label="ส่วนลด" value={`(${fmt(voucher.discount)})`} />}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap" }}>ส่วนลด (฿)</span>
                  <input type="number" value={voucher.discount || ""}
                    onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
                    placeholder="0" style={{ width: 90, fontFamily: "var(--font-mono)", textAlign: "right" }} />
                </div>
                <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: 8 }}>
                  <SumRow label="ยอดสุทธิ" value={`฿ ${fmt(totalNet)}`} bold />
                </div>
              </div>
            </div>
          </Section>

          {/* Attachments */}
          <Section title="หลักฐานที่แนบมา" icon="📎">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
              {([
                { key: "receipt", label: "ใบเสร็จรับเงิน" },
                { key: "taxInvoice", label: "ใบกำกับภาษี" },
                { key: "transferSlip", label: "Slip โอนเงิน" },
                { key: "quotation", label: "ใบเสนอราคา / ใบแจ้งหนี้" },
              ] as const).map((item) => (
                <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={voucher.attachments[item.key]}
                    onChange={(e) => setField("attachments", { ...voucher.attachments, [item.key]: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} />
                  {item.label}
                </label>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={voucher.attachments.other}
                  onChange={(e) => setField("attachments", { ...voucher.attachments, other: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} />
                อื่นๆ
              </label>
              {voucher.attachments.other && (
                <input value={voucher.attachments.otherDetail}
                  onChange={(e) => setField("attachments", { ...voucher.attachments, otherDetail: e.target.value })}
                  placeholder="ระบุ..." style={{ width: 180 }} />
              )}
            </div>
          </Section>

          {/* Note */}
          <Section title="หมายเหตุ" icon="📝">
            <textarea rows={2} value={voucher.note}
              onChange={(e) => setField("note", e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม / เงื่อนไข" />
          </Section>

          {/* Signature - requester only */}
          <Section title="ลายมือชื่อผู้ขอเบิก" icon="✍️">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="ชื่อผู้ขอเบิก">
                <input value={voucher.requestedBy}
                  onChange={(e) => setField("requestedBy", e.target.value)}
                  placeholder="ชื่อ-นามสกุล" />
              </Field>
              <div />
            </div>
            <div style={{ marginTop: 12 }}>
              <SignatureSection
                value={voucher.signatureData}
                onChange={(v) => setField("signatureData", v)}
              />
            </div>
          </Section>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: "1.5px solid var(--border)" }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab("preview")}>👁 ดูตัวอย่าง</button>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์ใบเบิก</button>
          </div>
        </main>
      )}

      {/* Preview */}
      {activeTab === "preview" && (
        <div style={{ padding: "20px 16px" }}>
          <VoucherPrint voucher={voucher} settings={settings}
            totalTax={totalTax} totalNet={totalNet} fmt={fmt} />
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }} className="no-print">
            <button className="btn btn-secondary" onClick={() => setActiveTab("form")}>← กลับแก้ไข</button>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์</button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel settings={settings} onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)} isFetching={isFetching} payeeCount={payees.length} />
      )}

      <div className="print-only" style={{ padding: 0 }}>
        <VoucherPrint voucher={voucher} settings={settings}
          totalTax={totalTax} totalNet={totalNet} fmt={fmt} />
      </div>
    </div>
  );
}

// ---- Helper components ----
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1.5px solid var(--border)",
      borderRadius: "var(--radius-lg)", marginBottom: 12, overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        padding: "10px 16px", borderBottom: "1.5px solid var(--border)",
        background: "var(--surface2)", display: "flex", alignItems: "center", gap: 7,
      }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: bold ? 13 : 11, fontWeight: bold ? 700 : 400, color: bold ? "var(--accent)" : "var(--text-3)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: bold ? 15 : 12, fontWeight: bold ? 700 : 400, color: bold ? "var(--accent)" : "var(--text-3)" }}>{value}</span>
    </div>
  );
}

function ComboSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  const [custom, setCustom] = useState(false);
  const isCustom = value && !options.includes(value);
  useEffect(() => { if (isCustom) setCustom(true); }, [isCustom]);

  if (custom || !options.length) {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={custom} />
        {options.length > 0 && (
          <button className="btn btn-ghost btn-icon" onClick={() => { setCustom(false); onChange(""); }} title="กลับ" style={{ flexShrink: 0 }}>↩</button>
        )}
      </div>
    );
  }
  return (
    <select value={value} onChange={(e) => {
      if (e.target.value === "__custom__") { setCustom(true); onChange(""); }
      else onChange(e.target.value);
    }}>
      <option value="">{placeholder || "— เลือก —"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">+ พิมพ์เอง...</option>
    </select>
  );
}

const THAI_BANKS = [
  "กสิกรไทย (KBANK)", "กรุงไทย (KTB)", "ไทยพาณิชย์ (SCB)",
  "กรุงเทพ (BBL)", "กรุงศรีอยุธยา (BAY)", "ทหารไทยธนชาต (TTB)",
  "ออมสิน (GSB)", "เพื่อการเกษตรและสหกรณ์ (BAAC)", "ซีไอเอ็มบีไทย (CIMB)",
  "ยูโอบี (UOB)", "ทิสโก้ (TISCO)", "แลนด์แอนด์เฮ้าส์ (LH Bank)",
];
