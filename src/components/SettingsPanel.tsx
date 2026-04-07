"use client";
import { useState } from "react";
import { Settings } from "@/types/voucher";
import TagInput from "./TagInput";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
  isFetching: boolean;
  payeeCount: number;
}

export default function SettingsPanel({ settings, onSave, onClose, isFetching, payeeCount }: Props) {
  const [s, setS] = useState<Settings>({ ...settings });

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--surface)",
          width: "min(480px, 95vw)",
          height: "100vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1.5px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--accent)",
            color: "white",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15 }}>⚙️ ตั้งค่า</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          {/* Company */}
          <SettingGroup title="ข้อมูลบริษัท">
            <Field label="ชื่อบริษัท / หน่วยงาน">
              <input value={s.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="ที่อยู่">
              <textarea rows={2} value={s.companyAddress} onChange={(e) => set("companyAddress", e.target.value)} />
            </Field>
            <Field label="Logo URL (optional)">
              <input value={s.logoUrl || ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." />
            </Field>
          </SettingGroup>

          {/* Google Sheet */}
          <SettingGroup title="Google Sheet — ข้อมูลผู้รับเงิน">
            <div style={{ padding: "10px 12px", background: "var(--accent-light)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--accent)", marginBottom: 10 }}>
              <strong>รูปแบบ Sheet:</strong> Tax ID | ชื่อ | ธนาคาร | สาขา | เลขบัญชี | ที่อยู่
              <br />
              ต้อง Publish to web (File → Share → Publish to web) ก่อน
            </div>
            <Field label="Google Sheet URL">
              <input
                value={s.googleSheetUrl}
                onChange={(e) => set("googleSheetUrl", e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </Field>
            {payeeCount > 0 && (
              <div style={{ fontSize: 12, color: "var(--success)", marginTop: 6 }}>
                ✅ โหลดผู้รับเงินแล้ว {payeeCount} รายการ
              </div>
            )}
            {isFetching && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>⏳ กำลังดึงข้อมูล...</div>
            )}
          </SettingGroup>

          {/* Dropdowns */}
          <SettingGroup title="Dropdown Lists (แก้ไขได้)">
            <Field label="แผนก / หน่วยงาน">
              <TagInput tags={s.departments} onChange={(v) => set("departments", v)} placeholder="เพิ่มแผนก..." />
            </Field>
            <Field label="หมวดค่าใช้จ่าย">
              <TagInput tags={s.expenseCategories} onChange={(v) => set("expenseCategories", v)} placeholder="เพิ่มหมวด..." />
            </Field>
            <Field label="รายชื่อผู้อนุมัติ">
              <TagInput tags={s.approvers} onChange={(v) => set("approvers", v)} placeholder="เพิ่มผู้อนุมัติ..." />
            </Field>
            <Field label="รายชื่อผู้จ่ายเงิน">
              <TagInput tags={s.payers} onChange={(v) => set("payers", v)} placeholder="เพิ่มผู้จ่ายเงิน..." />
            </Field>
          </SettingGroup>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1.5px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => onSave(s)}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
