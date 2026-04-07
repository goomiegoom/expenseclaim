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
import SignaturePad from "@/components/SignaturePad";
import VoucherPrint from "@/components/VoucherPrint";
import TagInput from "@/components/TagInput";

const emptyItem = (): VoucherItem => ({
  id: crypto.randomUUID(),
  description: "",
  amount: 0,
  note: "",
});

const today = () => new Date().toISOString().split("T")[0];

export default function Home() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  // Signature refs (base64)
  const [sigRequester, setSigRequester] = useState("");
  const [sigApprover, setSigApprover] = useState("");
  const [sigPayer, setSigPayer] = useState("");
  const [sigReceiver, setSigReceiver] = useState("");

  const [voucher, setVoucher] = useState<Voucher>({
    voucherNo: "",
    date: today(),
    department: "",
    purpose: "",
    payee: null,
    items: [emptyItem()],
    paymentMethod: "transfer",
    taxWithheld: 0,
    discount: 0,
    requestedBy: "",
    approvedBy: "",
    paidBy: "",
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

  // Generate voucher number on mount
  useEffect(() => {
    setVoucher((v) => ({ ...v, voucherNo: generateVoucherNo() }));
  }, []);

  // Auto-fetch payees if URL set
  useEffect(() => {
    if (settings.googleSheetUrl) doFetch(settings.googleSheetUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doFetch = useCallback(async (url: string) => {
    setIsFetching(true);
    setFetchError("");
    try {
      const data = await fetchPayeesFromSheet(url);
      if (data.length === 0) {
        setFetchError("ไม่พบข้อมูลใน Sheet — ตรวจสอบว่า Publish to web แล้ว");
      } else {
        setPayees(data);
      }
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

  // Voucher field helpers
  const setField = <K extends keyof Voucher>(k: K, v: Voucher[K]) =>
    setVoucher((prev) => ({ ...prev, [k]: v }));

  const setItem = (id: string, k: keyof VoucherItem, v: string | number) =>
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [k]: v } : it)),
    }));

  const addItem = () =>
    setVoucher((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (id: string) =>
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));

  // Totals
  const subtotal = voucher.items.reduce((s, it) => s + (it.amount || 0), 0);
  const taxAmount = (subtotal * voucher.taxWithheld) / 100;
  const total = subtotal - taxAmount - voucher.discount;

  const fmt = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const selectedPayee = voucher.payee;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="no-print"
        style={{
          background: "var(--accent)",
          color: "white",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.3 }}>
              ระบบใบเบิกเงิน
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{settings.companyName}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {settings.googleSheetUrl && (
            <button
              className="btn btn-sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
              onClick={() => doFetch(settings.googleSheetUrl)}
              disabled={isFetching}
            >
              {isFetching ? "⏳" : "🔄"} {isFetching ? "กำลังดึง..." : `ผู้รับเงิน (${payees.length})`}
            </button>
          )}
          <button
            className="btn btn-sm"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
            onClick={() => setShowSettings(true)}
          >
            ⚙️ ตั้งค่า
          </button>
          <button
            className="btn btn-sm"
            style={{
              background: "var(--accent-2)",
              color: "var(--accent)",
              border: "none",
              fontWeight: 600,
            }}
            onClick={() => window.print()}
          >
            🖨️ พิมพ์
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="no-print"
        style={{
          background: "var(--surface)",
          borderBottom: "1.5px solid var(--border)",
          padding: "0 24px",
          display: "flex",
          gap: 0,
        }}
      >
        {(["form", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              color: activeTab === tab ? "var(--accent)" : "var(--text-2)",
              fontFamily: "var(--font)",
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab === "form" ? "✏️ กรอกข้อมูล" : "👁 ตัวอย่างพิมพ์"}
          </button>
        ))}
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div
          className="no-print"
          style={{
            background: "var(--danger-light)",
            borderBottom: "1px solid #f5c6cb",
            padding: "10px 24px",
            color: "var(--danger)",
            fontSize: 13,
          }}
        >
          ⚠️ {fetchError}
        </div>
      )}

      {/* Form */}
      {activeTab === "form" && (
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 60px" }}>
          {/* Section: Header Info */}
          <Section title="ข้อมูลทั่วไป" icon="📋">
            <Grid2>
              <Field label="เลขที่ใบเบิก">
                <input
                  value={voucher.voucherNo}
                  onChange={(e) => setField("voucherNo", e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                />
              </Field>
              <Field label="วันที่">
                <input
                  type="date"
                  value={voucher.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </Field>
              <Field label="หน่วยงาน / แผนก">
                <ComboSelect
                  value={voucher.department}
                  onChange={(v) => setField("department", v)}
                  options={settings.departments}
                  placeholder="เลือกหรือพิมพ์แผนก"
                />
              </Field>
              <Field label="วัตถุประสงค์ / หมวดค่าใช้จ่าย">
                <ComboSelect
                  value={voucher.purpose}
                  onChange={(v) => setField("purpose", v)}
                  options={settings.expenseCategories}
                  placeholder="เลือกหรือพิมพ์วัตถุประสงค์"
                />
              </Field>
            </Grid2>
          </Section>

          {/* Section: Payee */}
          <Section title="ผู้รับเงิน" icon="👤">
            {payees.length > 0 ? (
              <Field label="เลือกผู้รับเงิน">
                <select
                  value={selectedPayee?.id || ""}
                  onChange={(e) => {
                    const p = payees.find((x) => x.id === e.target.value) || null;
                    setField("payee", p);
                  }}
                >
                  <option value="">— เลือกผู้รับเงิน —</option>
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.taxId ? `(${p.taxId})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--accent-light)",
                  borderRadius: "var(--radius)",
                  fontSize: 13,
                  color: "var(--accent)",
                  marginBottom: 12,
                }}
              >
                💡 ตั้งค่า Google Sheet URL ในหน้า ⚙️ ตั้งค่า เพื่อดึงรายชื่อผู้รับเงินอัตโนมัติ
              </div>
            )}

            {/* Manual / display payee info */}
            <div
              style={{
                background: "var(--surface2)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 16,
              }}
            >
              <Grid2>
                <Field label="ชื่อผู้รับเงิน">
                  <input
                    value={selectedPayee?.name || ""}
                    onChange={(e) =>
                      setField("payee", { ...(selectedPayee || { id: "manual" }), name: e.target.value })
                    }
                    placeholder="ชื่อบุคคล / บริษัท"
                  />
                </Field>
                <Field label="เลขประจำตัวผู้เสียภาษี">
                  <input
                    value={selectedPayee?.taxId || ""}
                    onChange={(e) =>
                      setField("payee", { ...(selectedPayee || { id: "manual", name: "" }), taxId: e.target.value })
                    }
                    placeholder="1234567890123"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </Field>
                <Field label="ธนาคาร">
                  <ComboSelect
                    value={selectedPayee?.bank || ""}
                    onChange={(v) =>
                      setField("payee", { ...(selectedPayee || { id: "manual", name: "" }), bank: v })
                    }
                    options={THAI_BANKS}
                    placeholder="เลือกธนาคาร"
                  />
                </Field>
                <Field label="เลขที่บัญชี">
                  <input
                    value={selectedPayee?.accountNo || ""}
                    onChange={(e) =>
                      setField("payee", { ...(selectedPayee || { id: "manual", name: "" }), accountNo: e.target.value })
                    }
                    placeholder="xxx-x-xxxxx-x"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </Field>
                <Field label="สาขา" style={{ gridColumn: "1 / -1" }}>
                  <input
                    value={selectedPayee?.branch || ""}
                    onChange={(e) =>
                      setField("payee", { ...(selectedPayee || { id: "manual", name: "" }), branch: e.target.value })
                    }
                    placeholder="สาขา"
                  />
                </Field>
                <Field label="ที่อยู่" style={{ gridColumn: "1 / -1" }}>
                  <textarea
                    rows={2}
                    value={selectedPayee?.address || ""}
                    onChange={(e) =>
                      setField("payee", { ...(selectedPayee || { id: "manual", name: "" }), address: e.target.value })
                    }
                    placeholder="ที่อยู่สำหรับออกใบเสร็จ"
                  />
                </Field>
              </Grid2>
            </div>
          </Section>

          {/* Section: Items */}
          <Section title="รายการค่าใช้จ่าย" icon="💰">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 100px 36px",
                  gap: 8,
                  padding: "0 4px",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>รายการ</span>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>หมายเหตุ</span>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, textAlign: "right" }}>จำนวนเงิน</span>
                <span />
              </div>

              {voucher.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 100px 36px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={item.description}
                    onChange={(e) => setItem(item.id, "description", e.target.value)}
                    placeholder={`รายการที่ ${idx + 1}`}
                  />
                  <input
                    value={item.note || ""}
                    onChange={(e) => setItem(item.id, "note", e.target.value)}
                    placeholder="หมายเหตุ"
                  />
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => setItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}
                  />
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeItem(item.id)}
                    style={{ color: "var(--danger)", opacity: voucher.items.length === 1 ? 0.3 : 1 }}
                    disabled={voucher.items.length === 1}
                    title="ลบรายการ"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className="btn btn-secondary btn-sm"
                onClick={addItem}
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              >
                + เพิ่มรายการ
              </button>
            </div>

            {/* Totals */}
            <div
              style={{
                marginTop: 16,
                background: "var(--surface2)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <TotalRow label="รวมก่อนหัก" value={fmt(subtotal)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="หัก ณ ที่จ่าย (%)">
                  <input
                    type="number"
                    value={voucher.taxWithheld || ""}
                    onChange={(e) => setField("taxWithheld", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min={0}
                    max={100}
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </Field>
                <Field label="ส่วนลด (บาท)">
                  <input
                    type="number"
                    value={voucher.discount || ""}
                    onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </Field>
              </div>
              {voucher.taxWithheld > 0 && (
                <TotalRow label={`ภาษีหัก ณ ที่จ่าย ${voucher.taxWithheld}%`} value={`(${fmt(taxAmount)})`} dim />
              )}
              {voucher.discount > 0 && (
                <TotalRow label="ส่วนลด" value={`(${fmt(voucher.discount)})`} dim />
              )}
              <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: 10 }}>
                <TotalRow
                  label="ยอดสุทธิที่จ่าย"
                  value={`฿ ${fmt(total)}`}
                  bold
                />
              </div>
            </div>
          </Section>

          {/* Section: Payment Method */}
          <Section title="วิธีการจ่ายเงิน" icon="💳">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {([
                { val: "transfer", label: "โอนเงิน", icon: "🏦" },
                { val: "cash", label: "เงินสด", icon: "💵" },
                { val: "check", label: "เช็ค", icon: "📝" },
              ] as const).map((m) => (
                <button
                  key={m.val}
                  onClick={() => setField("paymentMethod", m.val)}
                  style={{
                    padding: "10px 20px",
                    border: "1.5px solid",
                    borderColor: voucher.paymentMethod === m.val ? "var(--accent)" : "var(--border)",
                    background: voucher.paymentMethod === m.val ? "var(--accent-light)" : "var(--surface)",
                    color: voucher.paymentMethod === m.val ? "var(--accent)" : "var(--text-2)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    fontWeight: voucher.paymentMethod === m.val ? 600 : 400,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <Field label="หมายเหตุเพิ่มเติม">
              <textarea
                rows={2}
                value={voucher.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="หมายเหตุ / เงื่อนไขเพิ่มเติม"
              />
            </Field>
          </Section>

          {/* Section: Approvers */}
          <Section title="ผู้เกี่ยวข้อง" icon="👥">
            <Grid2>
              <Field label="ผู้ขอเบิก / ผู้ทำรายการ">
                <ComboSelect
                  value={voucher.requestedBy}
                  onChange={(v) => setField("requestedBy", v)}
                  options={[...settings.approvers, ...settings.payers]}
                  placeholder="ชื่อผู้ขอเบิก"
                />
              </Field>
              <Field label="ผู้อนุมัติ">
                <ComboSelect
                  value={voucher.approvedBy}
                  onChange={(v) => setField("approvedBy", v)}
                  options={settings.approvers}
                  placeholder="ชื่อผู้อนุมัติ"
                />
              </Field>
              <Field label="ผู้จ่ายเงิน">
                <ComboSelect
                  value={voucher.paidBy}
                  onChange={(v) => setField("paidBy", v)}
                  options={settings.payers}
                  placeholder="ชื่อผู้จ่ายเงิน"
                />
              </Field>
            </Grid2>
          </Section>

          {/* Section: Signatures */}
          <Section title="ลายมือชื่อ" icon="✍️">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { label: "ผู้ขอเบิก", name: voucher.requestedBy, sig: sigRequester, set: setSigRequester },
                { label: "ผู้อนุมัติ", name: voucher.approvedBy, sig: sigApprover, set: setSigApprover },
                { label: "ผู้จ่ายเงิน", name: voucher.paidBy, sig: sigPayer, set: setSigPayer },
                { label: "ผู้รับเงิน", name: voucher.payee?.name || "", sig: sigReceiver, set: setSigReceiver },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6, fontWeight: 500 }}>
                    {s.label}
                    {s.name && <span style={{ color: "var(--text-2)", marginLeft: 4 }}>({s.name})</span>}
                  </div>
                  <SignaturePad value={s.sig} onChange={s.set} />
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Attachments */}
          <Section title="หลักฐานที่แนบมา" icon="📎">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "receipt", label: "ใบเสร็จรับเงิน" },
                { key: "taxInvoice", label: "ใบกำกับภาษี" },
                { key: "transferSlip", label: "Slip โอนเงิน" },
                { key: "quotation", label: "ใบเสนอราคา / ใบแจ้งหนี้" },
              ] as const).map((item) => (
                <label
                  key={item.key}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
                >
                  <input
                    type="checkbox"
                    checked={voucher.attachments[item.key]}
                    onChange={(e) =>
                      setField("attachments", { ...voucher.attachments, [item.key]: e.target.checked })
                    }
                    style={{ width: 17, height: 17, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14 }}>{item.label}</span>
                </label>
              ))}
              {/* Other with text input */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={voucher.attachments.other}
                    onChange={(e) =>
                      setField("attachments", { ...voucher.attachments, other: e.target.checked })
                    }
                    style={{ width: 17, height: 17, accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 14 }}>อื่นๆ ระบุ</span>
                </label>
                <input
                  value={voucher.attachments.otherDetail}
                  onChange={(e) =>
                    setField("attachments", { ...voucher.attachments, otherDetail: e.target.value, other: e.target.value ? true : voucher.attachments.other })
                  }
                  placeholder="ระบุเอกสารอื่นๆ..."
                  style={{ flex: 1, opacity: voucher.attachments.other ? 1 : 0.5 }}
                  disabled={!voucher.attachments.other}
                />
              </div>
            </div>
          </Section>

          {/* Action bar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1.5px solid var(--border)",
            }}
          >
            <button className="btn btn-secondary" onClick={() => setActiveTab("preview")}>
              👁 ดูตัวอย่าง
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              🖨️ พิมพ์ใบเบิก
            </button>
          </div>
        </main>
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <div style={{ padding: "24px 16px" }}>
          <VoucherPrint
            voucher={voucher}
            settings={settings}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            signatures={{ sigRequester, sigApprover, sigPayer, sigReceiver }}
          />
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }} className="no-print">
            <button className="btn btn-secondary" onClick={() => setActiveTab("form")}>← กลับแก้ไข</button>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์</button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          isFetching={isFetching}
          payeeCount={payees.length}
        />
      )}

      {/* Print Area (always in DOM, hidden) */}
      <div className="print-only" style={{ padding: 32 }}>
        <VoucherPrint
          voucher={voucher}
          settings={settings}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          signatures={{ sigRequester, sigApprover, sigPayer, sigReceiver }}
        />
      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        marginBottom: 16,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1.5px solid var(--border)",
          background: "var(--surface2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TotalRow({ label, value, bold, dim }: { label: string; value: string; bold?: boolean; dim?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: dim ? "var(--text-3)" : "var(--text)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: bold ? 700 : 400,
          fontSize: bold ? 16 : 13,
          color: bold ? "var(--accent)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ComboSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [custom, setCustom] = useState(false);
  const isCustom = value && !options.includes(value);

  useEffect(() => {
    if (isCustom) setCustom(true);
  }, [isCustom]);

  if (custom) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        {options.length > 0 && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => { setCustom(false); onChange(""); }}
            title="กลับเลือกจาก list"
            style={{ flexShrink: 0 }}
          >
            ↩
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === "__custom__") { setCustom(true); onChange(""); }
          else onChange(e.target.value);
        }}
        style={{ flex: 1 }}
      >
        <option value="">{placeholder || "— เลือก —"}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value="__custom__">+ พิมพ์เอง...</option>
      </select>
    </div>
  );
}

const THAI_BANKS = [
  "กสิกรไทย (KBANK)",
  "กรุงไทย (KTB)",
  "ไทยพาณิชย์ (SCB)",
  "กรุงเทพ (BBL)",
  "กรุงศรีอยุธยา (BAY)",
  "ทหารไทยธนชาต (TTB)",
  "ออมสิน (GSB)",
  "เพื่อการเกษตรและสหกรณ์ (BAAC)",
  "ซีไอเอ็มบีไทย (CIMB)",
  "ยูโอบี (UOB)",
  "ทิสโก้ (TISCO)",
  "แลนด์แอนด์เฮ้าส์ (LH Bank)",
  "ไทยเครดิต (Thai Credit)",
];
