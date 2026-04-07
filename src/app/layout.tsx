import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ใบเบิกเงิน | Payment Voucher",
  description: "ระบบออกใบเบิกเงิน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
