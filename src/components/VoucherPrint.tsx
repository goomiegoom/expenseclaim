"use client";
import { Voucher, Settings } from "@/types/voucher";

interface Props {
  voucher: Voucher;
  settings: Settings;
  totalTax: number;
  totalNet: number;
  fmt: (n: number) => string;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: "เงินสด", transfer: "โอนเงิน", check: "เช็ค", credit: "บัตรเครดิต",
};

export default function VoucherPrint({ voucher, settings, totalTax, totalNet, fmt }: Props) {
  const thaiDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  };

  const p = voucher.payee;
  const a = voucher.attachments;
  const attachList = [
    a.receipt && "ใบเสร็จรับเงิน",
    a.taxInvoice && "ใบกำกับภาษี",
    a.transferSlip && "Slip โอนเงิน",
    a.quotation && "ใบเสนอราคา/ใบแจ้งหนี้",
    a.other && (a.otherDetail ? `อื่นๆ: ${a.otherDetail}` : "อื่นๆ"),
  ].filter(Boolean) as string[];

  const ATTACH_KEYS = [
    { key: "receipt", label: "ใบเสร็จรับเงิน" },
    { key: "taxInvoice", label: "ใบกำกับภาษี" },
    { key: "transferSlip", label: "Slip โอนเงิน" },
    { key: "quotation", label: "ใบเสนอราคา" },
  ] as const;

  return (
    <div className="voucher-print-area" style={{
      background: "white",
      width: "100%", maxWidth: 750,
      margin: "0 auto",
      padding: "20px 28px",
      fontFamily: "'IBM Plex Sans Thai', sans-serif",
      fontSize: 12, color: "#1a1816",
      boxShadow: "var(--shadow-lg)",
      borderRadius: 8, border: "1px solid var(--border)",
    }}>

      {/* ===== HEADER ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #1a3a5c" }}>
        <div>
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="logo" style={{ height: 40, marginBottom: 4 }} />
          )}
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a3a5c" }}>{settings.companyName}</div>
          <div style={{ fontSize: 10, color: "#5a5650" }}>{settings.companyAddress}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a3a5c" }}>ใบเบิกเงิน</div>
          <div style={{ fontSize: 9, color: "#8a8680" }}>PAYMENT VOUCHER</div>
          <div style={{ marginTop: 6, background: "#e8eef5", borderRadius: 5, padding: "4px 12px", display: "inline-block" }}>
            <span style={{ fontSize: 10, color: "#5a5650" }}>เลขที่ </span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#1a3a5c" }}>{voucher.voucherNo}</span>
          </div>
        </div>
      </div>

      {/* ===== META ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px 16px", marginBottom: 10 }}>
        <Meta label="วันที่" value={thaiDate(voucher.date)} />
        <Meta label="หน่วยงาน" value={voucher.department} />
        <Meta label="วิธีการจ่าย" value={PAYMENT_LABEL[voucher.paymentMethod]} />
        <Meta label="ผู้ขอเบิก" value={voucher.requestedBy} />
      </div>

      {/* ===== PAYEE ===== */}
      <div style={{ background: "#f9f8f6", border: "1px solid #ddd9d0", borderRadius: 5, padding: "8px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#1a3a5c", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>ผู้เบิกเงิน</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "2px 16px" }}>
          <Meta label="ชื่อ" value={p?.name || "—"} bold />
          <Meta label="เลขภาษี / บัตรประชาชน" value={p?.taxId || "—"} mono />
          <Meta label="ธนาคาร / สาขา" value={[p?.bank, p?.branch].filter(Boolean).join(" / ") || "—"} />
          <Meta label="เลขที่บัญชี" value={p?.accountNo || "—"} mono />
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#1a3a5c", color: "white" }}>
            <th style={{ padding: "6px 8px", textAlign: "center", width: 28, fontWeight: 600, fontSize: 10 }}>ที่</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, fontSize: 10 }}>รายการ / รายละเอียด</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, fontSize: 10, width: 110 }}>หมวดหมู่</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, fontSize: 10, width: 80 }}>หมายเหตุ</th>
            <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, fontSize: 10, width: 60 }}>หัก ณ ที่จ่าย</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, fontSize: 10, width: 90 }}>จำนวนเงิน (฿)</th>
          </tr>
        </thead>
        <tbody>
          {voucher.items.map((item, idx) => {
            const tax = (item.amount * item.taxWithheld) / 100;
            return (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "white" : "#f9f8f6" }}>
                <td style={{ padding: "5px 8px", textAlign: "center", color: "#8a8680", fontSize: 10 }}>{idx + 1}</td>
                <td style={{ padding: "5px 8px" }}>{item.description || "—"}</td>
                <td style={{ padding: "5px 8px", fontSize: 10, color: "#5a5650" }}>{item.category || "—"}</td>
                <td style={{ padding: "5px 8px", fontSize: 10, color: "#8a8680" }}>{item.note || ""}</td>
                <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", fontSize: 10, color: "#5a5650" }}>
                  {item.taxWithheld > 0 ? `${item.taxWithheld}% (${fmt(tax)})` : "—"}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(item.amount)}</td>
              </tr>
            );
          })}
          {/* Pad to at least 5 rows */}
          {Array.from({ length: Math.max(0, 5 - voucher.items.length) }).map((_, i) => (
            <tr key={`pad-${i}`} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "5px 8px", color: "#ddd", textAlign: "center" }}>{voucher.items.length + i + 1}</td>
              <td colSpan={5} style={{ padding: "5px 8px" }} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0f4f8", borderTop: "1.5px solid #1a3a5c" }}>
            <td colSpan={5} style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "#1a3a5c" }}>
              ยอดสุทธิ {totalTax > 0 && <span style={{ fontWeight: 400, fontSize: 10, color: "#5a5650" }}>(หักภาษี {fmt(totalTax)} บาท)</span>}
            </td>
            <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#1a3a5c" }}>
              ฿ {fmt(totalNet)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ===== ATTACHMENTS + NOTE (side by side) ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ border: "1px solid #ddd9d0", borderRadius: 5, padding: "8px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#1a3a5c", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>📎 หลักฐานที่แนบ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            {ATTACH_KEYS.map((item) => {
              const checked = (a as unknown as Record<string, boolean>)[item.key];
              return (
                <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                  <span style={{
                    width: 13, height: 13, border: "1.5px solid", flexShrink: 0,
                    borderColor: checked ? "#1a3a5c" : "#b5b0a5",
                    background: checked ? "#1a3a5c" : "white",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 9, borderRadius: 2,
                  }}>{checked ? "✓" : ""}</span>
                  <span style={{ color: checked ? "#1a1816" : "#b5b0a5" }}>{item.label}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <span style={{
                width: 13, height: 13, border: "1.5px solid", flexShrink: 0,
                borderColor: a.other ? "#1a3a5c" : "#b5b0a5",
                background: a.other ? "#1a3a5c" : "white",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 9, borderRadius: 2,
              }}>{a.other ? "✓" : ""}</span>
              <span style={{ color: a.other ? "#1a1816" : "#b5b0a5" }}>
                อื่นๆ{a.other && a.otherDetail ? `: ${a.otherDetail}` : " ระบุ ................."}
              </span>
            </div>
          </div>
        </div>
        <div style={{ border: "1px solid #ddd9d0", borderRadius: 5, padding: "8px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#1a3a5c", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>📝 หมายเหตุ</div>
          <div style={{ fontSize: 11, color: "#5a5650", minHeight: 40 }}>{voucher.note || "—"}</div>
        </div>
      </div>

      {/* ===== SIGNATURE — requester only ===== */}
      <div style={{ borderTop: "1.5px solid #1a3a5c", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Requester sig */}
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 64, borderBottom: "1px solid #ddd9d0", marginBottom: 5, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
            {voucher.signatureData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={voucher.signatureData} alt="sig" style={{ maxHeight: 58, maxWidth: "100%", objectFit: "contain" }} />
            )}
          </div>
          <div style={{ fontSize: 10, color: "#8a8680" }}>ลงชื่อ .................................................</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a5c", marginTop: 2 }}>ผู้ขอเบิกเงิน</div>
          {voucher.requestedBy && <div style={{ fontSize: 10, color: "#5a5650" }}>({voucher.requestedBy})</div>}
          <div style={{ fontSize: 10, color: "#8a8680", marginTop: 3 }}>วันที่ ........../........../.........</div>
        </div>
        {/* Approver */}
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 64, borderBottom: "1px solid #ddd9d0", marginBottom: 5 }} />
          <div style={{ fontSize: 10, color: "#8a8680" }}>ลงชื่อ .................................................</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a5c", marginTop: 2 }}>ผู้อนุมัติ</div>
          <div style={{ fontSize: 10, color: "#8a8680", marginTop: 3 }}>วันที่ ........../........../.........</div>
        </div>
        {/* Payer */}
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 64, borderBottom: "1px solid #ddd9d0", marginBottom: 5 }} />
          <div style={{ fontSize: 10, color: "#8a8680" }}>ลงชื่อ .................................................</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a5c", marginTop: 2 }}>ผู้จ่ายเงิน</div>
          <div style={{ fontSize: 10, color: "#8a8680", marginTop: 3 }}>วันที่ ........../........../.........</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 9, color: "#b5b0a5" }}>
        <span>ระบบใบเบิกเงิน — {settings.companyName}</span>
        <span>พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</span>
      </div>
    </div>
  );
}

function Meta({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#8a8680", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: bold ? 700 : 400, fontFamily: mono ? "monospace" : undefined }}>{value || "—"}</div>
    </div>
  );
}
