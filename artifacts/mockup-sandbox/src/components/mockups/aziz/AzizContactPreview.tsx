import { useState } from "react";

const SAND = "#F5EFE6";
const OLIVE = "#6B7A4E";
const GOLD = "#B8924A";
const CHARCOAL = "#2A2A2A";
const MUTED = "#8A8A8A";
const BORDER = "#E8DDD0";
const CARD = "#FFFFFF";

const platforms = [
  { key: "phone",     icon: "📱", color: "#2ECC71", label: "Mobile / WhatsApp",  value: "0501234567",   href: "https://wa.me/0501234567" },
  { key: "instagram", icon: "📸", color: "#E1306C", label: "Instagram",          value: "@aziz.a",      href: "https://instagram.com/aziz.a" },
  { key: "snapchat",  icon: "👻", color: "#FFBF00", label: "Snapchat",           value: "aziz_snap",    href: "https://snapchat.com/add/aziz_snap" },
  { key: "twitter",   icon: "🐦", color: "#1DA1F2", label: "X / Twitter",        value: "@azizx_sa",   href: "https://x.com/azizx_sa" },
  { key: "tiktok",    icon: "🎵", color: "#111111", label: "TikTok",             value: "@aziz.tok",    href: "https://tiktok.com/@aziz.tok" },
];

function PlatformRow({ platform, idx }: { platform: typeof platforms[0]; idx: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(platform.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      key={platform.key}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: SAND,
        border: `1px solid ${BORDER}`,
        animation: `fadeIn 0.3s ease ${idx * 0.07}s both`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: platform.color + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {platform.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 2 }}>
          {platform.label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: CHARCOAL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {platform.value}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: platform.color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            fontSize: 13,
          }}
          title="Open"
        >
          🔗
        </a>
        <button
          onClick={handleCopy}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: copied ? OLIVE + "20" : "#F0EBE4",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            transition: "all 0.2s",
          }}
          title="Copy"
        >
          {copied ? "✅" : "📋"}
        </button>
      </div>
    </div>
  );
}

export default function AzizContactPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: SAND,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "24px 16px 40px",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Screen label */}
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
        PROFILE SCREEN — معلومات التواصل
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20, animation: "fadeIn 0.4s ease" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 4px 16px rgba(184,146,74,0.25)",
          }}
        >
          ع
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: CHARCOAL }}>عزيز</div>
        <div style={{ fontSize: 13, color: MUTED }}>الدمام · 25–29</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: OLIVE + "18", borderRadius: 999,
          padding: "4px 12px", fontSize: 12, fontWeight: 700, color: OLIVE,
        }}>
          ✓ موثّق
        </div>
      </div>

      {/* Contact Info card */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: CARD,
          borderRadius: 18,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          animation: "fadeIn 0.4s ease 0.1s both",
        }}
      >
        {/* Card header */}
        <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: CHARCOAL }}>معلومات التواصل</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>تُكشف فقط لمن تبادلتم الإعجاب المتبادل</div>
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: OLIVE + "12", border: "none", borderRadius: 999,
            padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: OLIVE,
          }}>
            ✏️ تعديل
          </button>
        </div>

        {/* Platform rows */}
        <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {platforms.map((p, i) => (
            <PlatformRow key={p.key} platform={p} idx={i} />
          ))}
        </div>
      </div>

      {/* Privacy pill */}
      <div style={{
        marginTop: 14,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        borderRadius: 10,
        background: OLIVE + "0E",
        border: `1px solid ${OLIVE}22`,
        maxWidth: 380,
        width: "100%",
        animation: "fadeIn 0.4s ease 0.5s both",
      }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <span style={{ fontSize: 12, color: OLIVE, lineHeight: 1.5 }}>
          هذه المعلومات خاصة تماماً — لا تظهر إلا لمن تبادلتم معهم اختيار «تواصل»
        </span>
      </div>
    </div>
  );
}
