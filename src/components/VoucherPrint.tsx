"use client";
import { Voucher, Settings } from "@/types/voucher";

interface Props {
  voucher: Voucher;
  settings: Settings;
  subtotal: number;
  taxAmount: number;
  total: number;
  signatures: {
    sigRequester: string;
    sigApprover: string;
    sigPayer: string;
    sigReceiver: string;
  };
}

const fmt = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENT_LABEL: Record<string, string> = {
  cash: "เงินสด",
  transfer: "โอนเงิน",
  check: "เช็ค",
};

export default function VoucherPrint({ voucher, settings, subtotal, taxAmount, total, signatures }: Props) {
  const thaiDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="voucher-print-area"
      style={{
        background: "white",
        width: "100%",
        maxWidth: 794,
        margin: "0 auto",
        padding: "32px 40px",
        fontFamily: "'IBM Plex Sans Thai', sans-serif",
        fontSize: 13,
        color: "#1a1816",
        boxShadow: "var(--shadow-lg)",
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "2px solid #1a3a5c", paddingBottom: 16 }}>
        <div>
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="logo" style={{ height: 48, marginBottom: 8 }} />
          )}
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a3a5c" }}>{settings.companyName}</div>
          <div style={{ fontSize: 11, color: "#5a5650", maxWidth: 300 }}>{settings.companyAddress}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1a3a5c", letterSpacing: 1 }}>
            ใบเบิกเงิน
          </div>
          <div style={{ fontSize: 11, color: "#8a8680", marginTop: 2 }}>PAYMENT VOUCHER</div>
          <div style={{ marginTop: 8, background: "#e8eef5", borderRadius: 6, padding: "6px 14px", display: "inline-block" }}>
            <span style={{ fontSize: 11, color: "#5a5650" }}>เลขที่ </span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#1a3a5c" }}>
              {voucher.voucherNo}
            </span>
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 24px", marginBottom: 20 }}>
        <MetaRow label="วันที่" value={thaiDate(voucher.date)} />
        <MetaRow label="หน่วยงาน" value={voucher.department} />
        <MetaRow label="วัตถุประสงค์" value={voucher.purpose} />
      </div>

      {/* Payee */}
      <div style={{ border: "1px solid #ddd9d0", borderRadius: 6, padding: "12px 16px", marginBottom: 16, background: "#f9f8f6" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
          <MetaRow label="ผู้รับเงิน" value={voucher.payee?.name || "—"} bold />
          <MetaRow label="เลขประจำตัวผู้เสียภาษี" value={voucher.payee?.taxId || "—"} mono />
          {voucher.paymentMethod === "transfer" && (
            <>
              <MetaRow label="ธนาคาร" value={[voucher.payee?.bank, voucher.payee?.branch].filter(Boolean).join(" สาขา") || "—"} />
              <MetaRow label="เลขที่บัญชี" value={voucher.payee?.accountNo || "—"} mono />
            </>
          )}
          {voucher.payee?.address && (
            <div style={{ gridColumn: "1 / -1" }}>
              <MetaRow label="ที่อยู่" value={voucher.payee.address} />
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#1a3a5c", color: "white" }}>
            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, width: 36 }}>ที่</th>
            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>รายการ</th>
            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>หมายเหตุ</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600, width: 120 }}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {voucher.items.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "white" : "#f9f8f6" }}>
              <td style={{ padding: "7px 12px", fontSize: 12, color: "#8a8680" }}>{idx + 1}</td>
              <td style={{ padding: "7px 12px", fontSize: 13 }}>{item.description || "—"}</td>
              <td style={{ padding: "7px 12px", fontSize: 12, color: "#8a8680" }}>{item.note || ""}</td>
              <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 13 }}>
                {fmt(item.amount)}
              </td>
            </tr>
          ))}
          {/* Pad empty rows */}
          {voucher.items.length < 5 &&
            Array.from({ length: 5 - voucher.items.length }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "7px 12px", color: "#eee" }}>{voucher.items.length + i + 1}</td>
                <td colSpan={3} style={{ padding: "7px 12px" }} />
              </tr>
            ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{ width: 260 }}>
          <SumRow label="รวมทั้งสิ้น" value={fmt(subtotal)} />
          {voucher.taxWithheld > 0 && (
            <SumRow label={`หัก ณ ที่จ่าย ${voucher.taxWithheld}%`} value={`(${fmt(taxAmount)})`} />
          )}
          {voucher.discount > 0 && (
            <SumRow label="ส่วนลด" value={`(${fmt(voucher.discount)})`} />
          )}
          <SumRow label="ยอดชำระสุทธิ" value={`฿ ${fmt(total)}`} bold />
          <div style={{ marginTop: 6, fontSize: 11, color: "#8a8680", textAlign: "right" }}>
            วิธีชำระ: <strong>{PAYMENT_LABEL[voucher.paymentMethod]}</strong>
          </div>
        </div>
      </div>

      {/* Note */}
      {voucher.note && (
        <div style={{ marginBottom: 20, padding: "10px 14px", background: "#fdf7e8", border: "1px solid #e8d89a", borderRadius: 6, fontSize: 12, color: "#5a5650" }}>
          <strong>หมายเหตุ:</strong> {voucher.note}
        </div>
      )}

      {/* Attachments */}
      {(() => {
        const a = voucher.attachments;
        const checked = [
          a.receipt && "ใบเสร็จรับเงิน",
          a.taxInvoice && "ใบกำกับภาษี",
          a.transferSlip && "Slip โอนเงิน",
          a.quotation && "ใบเสนอราคา / ใบแจ้งหนี้",
          a.other && (a.otherDetail ? `อื่นๆ: ${a.otherDetail}` : "อื่นๆ"),
        ].filter(Boolean) as string[];

        return (
          <div style={{ marginBottom: 20, padding: "10px 16px", border: "1px solid #ddd9d0", borderRadius: 6, background: "#f9f8f6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1a3a5c", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              📎 หลักฐานที่แนบมา
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
              {[
                { key: "receipt", label: "ใบเสร็จรับเงิน" },
                { key: "taxInvoice", label: "ใบกำกับภาษี" },
                { key: "transferSlip", label: "Slip โอนเงิน" },
                { key: "quotation", label: "ใบเสนอราคา / ใบแจ้งหนี้" },
              ].map((item) => {
                const isChecked = (voucher.attachments as unknown as Record<string, boolean>)[item.key];
                return (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 15, height: 15, border: "1.5px solid",
                      borderColor: isChecked ? "#1a3a5c" : "#b5b0a5",
                      borderRadius: 3,
                      background: isChecked ? "#1a3a5c" : "white",
                      color: "white", fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>
                      {isChecked ? "✓" : ""}
                    </span>
                    <span style={{ color: isChecked ? "#1a1816" : "#b5b0a5" }}>{item.label}</span>
                  </div>
                );
              })}
              {/* Other */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 15, height: 15, border: "1.5px solid",
                  borderColor: voucher.attachments.other ? "#1a3a5c" : "#b5b0a5",
                  borderRadius: 3,
                  background: voucher.attachments.other ? "#1a3a5c" : "white",
                  color: "white", fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {voucher.attachments.other ? "✓" : ""}
                </span>
                <span style={{ color: voucher.attachments.other ? "#1a1816" : "#b5b0a5" }}>
                  อื่นๆ{voucher.attachments.otherDetail ? `: ${voucher.attachments.otherDetail}` : " ระบุ ........................................"}
                </span>
              </div>
            </div>
            {checked.length === 0 && (
              <div style={{ fontSize: 11, color: "#b5b0a5", fontStyle: "italic", marginTop: 4 }}>— ไม่ได้ระบุหลักฐาน —</div>
            )}
          </div>
        );
      })()}

      {/* Signatures */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 32, borderTop: "2px solid #1a3a5c", paddingTop: 20 }}>
        {[
          { label: "ผู้ขอเบิก", name: voucher.requestedBy, sig: signatures.sigRequester },
          { label: "ผู้อนุมัติ", name: voucher.approvedBy, sig: signatures.sigApprover },
          { label: "ผู้จ่ายเงิน", name: voucher.paidBy, sig: signatures.sigPayer },
          { label: "ผู้รับเงิน", name: voucher.payee?.name || "", sig: signatures.sigReceiver },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ height: 72, borderBottom: "1px solid #ddd9d0", marginBottom: 6, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
              {s.sig ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.sig} alt={s.label} style={{ maxHeight: 64, maxWidth: "100%", objectFit: "contain" }} />
              ) : null}
            </div>
            <div style={{ fontSize: 11, color: "#8a8680" }}>ลงชื่อ .................................................</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a5c", marginTop: 3 }}>{s.label}</div>
            {s.name && <div style={{ fontSize: 10, color: "#5a5650" }}>({s.name})</div>}
            <div style={{ fontSize: 10, color: "#8a8680", marginTop: 4 }}>วันที่ ............../............../............</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b5b0a5" }}>
        <span>เอกสารออกโดยระบบใบเบิกเงิน</span>
        <span>พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</span>
      </div>
    </div>
  );
}

function MetaRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#8a8680", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 400, fontFamily: mono ? "monospace" : undefined }}>{value || "—"}</div>
    </div>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: bold ? "1.5px solid #1a3a5c" : "none", marginBottom: bold ? 4 : 0 }}>
      <span style={{ fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, color: bold ? "#1a3a5c" : "#5a5650" }}>{label}</span>
      <span style={{ fontFamily: "monospace", fontSize: bold ? 14 : 12, fontWeight: bold ? 700 : 400, color: bold ? "#1a3a5c" : "#5a5650" }}>{value}</span>
    </div>
  );
}
