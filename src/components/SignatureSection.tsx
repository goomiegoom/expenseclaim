"use client";
import { useRef, useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SignatureSection({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasCanvas, setHasCanvas] = useState(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && canvasRef.current && mode === "draw") {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, 360, 120); ctx.drawImage(img, 0, 0); };
      img.src = value;
      setHasCanvas(true);
    }
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    setDrawing(true); lastPos.current = getPos(e, canvas);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas || !lastPos.current) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#1a1816";
    ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.stroke();
    lastPos.current = pos; setHasCanvas(true);
  };
  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); if (!drawing) return;
    setDrawing(false); lastPos.current = null;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL());
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasCanvas(false); onChange("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: "var(--radius)", overflow: "hidden", border: "1.5px solid var(--border)", width: "fit-content" }}>
        {(["draw", "upload"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 16px", background: mode === m ? "var(--accent)" : "var(--surface)",
            color: mode === m ? "white" : "var(--text-2)", border: "none",
            fontFamily: "var(--font)", fontSize: 12, cursor: "pointer", fontWeight: mode === m ? 600 : 400,
          }}>
            {m === "draw" ? "✏️ เซ็น" : "📁 อัปโหลด"}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <div>
          <div style={{ position: "relative", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", background: "#fff", display: "inline-block", cursor: "crosshair" }}>
            <canvas ref={canvasRef} width={360} height={120}
              style={{ display: "block", width: 360, height: 120, touchAction: "none" }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
            {!hasCanvas && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 12, pointerEvents: "none" }}>
                เซ็นชื่อที่นี่
              </div>
            )}
          </div>
          {hasCanvas && (
            <button className="btn btn-ghost btn-sm" onClick={clearCanvas} style={{ marginLeft: 8, color: "var(--danger)", fontSize: 11 }}>✕ ล้าง</button>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>📁 เลือกไฟล์ลายเซ็น (PNG/JPG)</button>
          {value && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="signature" style={{ height: 80, border: "1px solid var(--border)", borderRadius: 4, background: "#fff", padding: 4 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => onChange("")} style={{ color: "var(--danger)", fontSize: 11 }}>✕ ลบ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
