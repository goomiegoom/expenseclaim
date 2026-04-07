"use client";
import { useState, useRef } from "react";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const v = input.trim();
    if (!v || tags.includes(v)) { setInput(""); return; }
    onChange([...tags, v]);
    setInput("");
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              border: "1px solid #c4d6ea",
            }}
          >
            {t}
            <button
              onClick={() => remove(t)}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                padding: "0 0 0 2px",
                fontSize: 13,
                lineHeight: 1,
                opacity: 0.6,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "เพิ่ม..."}
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary btn-sm" onClick={add} style={{ flexShrink: 0 }}>
          +
        </button>
      </div>
    </div>
  );
}
