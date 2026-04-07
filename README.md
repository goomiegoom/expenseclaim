# ใบเบิกเงิน — Payment Voucher System

ระบบออกใบเบิกเงินสำหรับองค์กร พร้อมดึงข้อมูลผู้รับเงินจาก Google Sheet และเซ็นชื่อดิจิทัล

## Features

- 📋 กรอกข้อมูลใบเบิกพร้อม dropdown แผนก / หมวดค่าใช้จ่าย
- 👤 ดึงรายชื่อผู้รับเงินจาก Google Sheet อัตโนมัติ
- 💰 คำนวณยอดอัตโนมัติ พร้อมภาษีหัก ณ ที่จ่าย + ส่วนลด
- ✍️ เซ็นชื่อดิจิทัล (ผู้ขอเบิก / ผู้อนุมัติ / ผู้จ่าย / ผู้รับ)
- 🖨️ พิมพ์ใบเบิกได้ทันที
- ⚙️ ตั้งค่า dropdown ได้เอง (แผนก, ผู้อนุมัติ, ผู้จ่าย)

## Google Sheet Format

สร้าง Sheet ที่มีหัวคอลัมน์แถวแรก แล้วใส่ข้อมูลจากแถวที่ 2:

| Tax ID | ชื่อ | ธนาคาร | สาขา | เลขบัญชี | ที่อยู่ |
|--------|------|---------|------|-----------|---------|
| 1234567890123 | บริษัท ตัวอย่าง จำกัด | กสิกรไทย (KBANK) | สาทร | 123-4-56789-0 | 123 ถนนตัวอย่าง |

จากนั้น: **File → Share → Publish to web → Sheet → CSV → Publish**

## Setup

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import repository
3. คลิก Deploy (Vercel detect Next.js อัตโนมัติ)

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- CSS Variables (no external UI library)
- Canvas API for signatures
