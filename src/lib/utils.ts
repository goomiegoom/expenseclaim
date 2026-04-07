import { Payee, Settings } from "@/types/voucher";

export function sheetToCsvUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/pub") && url.includes("output=csv")) return url;
  if (url.includes("/pub")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}output=csv`;
  }
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return "";
  const sheetId = match[1];
  const gidMatch = url.match(/gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`;
}

export function parseCsvToPayees(csv: string): Payee[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  // Expected columns: Tax ID, Name, Bank, Branch, Account No, Address
  return lines.slice(1).map((line, i) => {
    const cols = parseCsvLine(line);
    return {
      id: `payee-${i}`,
      taxId: cols[0]?.trim() || "",
      name: cols[1]?.trim() || cols[0]?.trim() || `Payee ${i + 1}`,
      bank: cols[2]?.trim() || "",
      branch: cols[3]?.trim() || "",
      accountNo: cols[4]?.trim() || "",
      address: cols[5]?.trim() || "",
    };
  }).filter((p) => p.name);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function fetchPayeesFromSheet(url: string): Promise<Payee[]> {
  const csvUrl = sheetToCsvUrl(url);
  if (!csvUrl) throw new Error("Invalid URL");

  const proxies = [
    csvUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`,
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy);
      if (res.ok) {
        const csv = await res.text();
        return parseCsvToPayees(csv);
      }
    } catch {
      continue;
    }
  }
  throw new Error("All fetch methods failed");
}

const SETTINGS_KEY = "voucher_settings";
const DEFAULT_SETTINGS: Settings = {
  googleSheetUrl: "",
  companyName: "บริษัท ตัวอย่าง จำกัด",
  companyAddress: "123 ถนนตัวอย่าง กรุงเทพฯ 10110",
  departments: ["บัญชี/การเงิน", "ฝ่ายบุคคล", "ไอที", "การตลาด", "ปฏิบัติการ"],
  expenseCategories: [
    "ค่าเดินทาง",
    "ค่าอาหาร/เลี้ยงรับรอง",
    "ค่าวัสดุสำนักงาน",
    "ค่าสาธารณูปโภค",
    "ค่าบริการ/ที่ปรึกษา",
    "ค่าฝึกอบรม",
    "อื่นๆ",
  ],
  approvers: [],
  payers: [],
  logoUrl: "",
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function generateVoucherNo(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const count = (parseInt(localStorage.getItem("voucher_count") || "0") + 1);
  localStorage.setItem("voucher_count", String(count));
  return `PV${y}${m}-${String(count).padStart(4, "0")}`;
}
