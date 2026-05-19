import { useState } from "react";

const SAND = "#F5EFE6";
const OLIVE = "#6B7A4E";
const GOLD = "#B8924A";
const CHARCOAL = "#2A2A2A";
const MUTED = "#8A8A8A";
const BORDER = "#E8DDD0";
const CARD = "#FFFFFF";

// ── Brand SVG icons ──────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2C8.268 2 2 8.268 2 16c0 2.478.65 4.801 1.785 6.813L2 30l7.383-1.754A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
        fill="#25D366"
      />
      <path
        d="M22.5 19.5c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z"
        fill="#fff"
      />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="26%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="74%" stopColor="#F56040" />
          <stop offset="88%" stopColor="#FD1D1D" />
          <stop offset="100%" stopColor="#E1306C" />
        </linearGradient>
        <linearGradient id="igGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#FCAF45" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#igGrad2)" />
      <rect x="7" y="7" width="18" height="18" rx="5" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="4.5" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="22" cy="10" r="1.2" fill="#fff" />
    </svg>
  );
}

function SnapchatIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FFFC00" />
      <path
        d="M16 6c-3.2 0-5.5 2.4-5.5 5.6v1.1l-.9.5c-.4.2-.5.5-.3.9l.3.6c.1.2.1.4-.1.5-.7.3-1.5.6-1.5 1.1 0 .4.3.7.8.9.2.1.4.2.4.4 0 .1-.1.3-.2.5-.5.9-1.4 1.8-2.3 2.1-.1 0-.2.1-.2.2s.1.2.2.2c.4.1 1.1.3 1.3.7.1.2.1.4 0 .5-.1.2-.3.3-.3.5 0 .3.3.5.7.5.4 0 .9-.1 1.5-.1.5 0 1 .1 1.4.4.7.5 1.2 1.3 3.1 1.3s2.4-.8 3.1-1.3c.4-.3.9-.4 1.4-.4.6 0 1.1.1 1.5.1.4 0 .7-.2.7-.5 0-.2-.2-.4-.3-.5-.1-.1-.1-.3 0-.5.2-.4.9-.6 1.3-.7.1 0 .2-.1.2-.2s-.1-.2-.2-.2c-.9-.3-1.8-1.2-2.3-2.1-.1-.2-.2-.4-.2-.5 0-.2.2-.3.4-.4.5-.2.8-.5.8-.9 0-.5-.8-.8-1.5-1.1-.2-.1-.2-.3-.1-.5l.3-.6c.2-.4.1-.7-.3-.9l-.9-.5v-1.1C21.5 8.4 19.2 6 16 6z"
        fill="#fff"
        stroke="#000"
        strokeWidth="0.3"
      />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#000" />
      <path
        d="M18.244 13.5L26.182 5h-1.89l-6.9 8.025L12 5H5.5l8.318 12.1L5.5 27h1.89l7.273-8.45L21.5 27H28L18.244 13.5zm-2.573 2.99l-.843-1.206-6.7-9.578H11l5.41 7.733.843 1.206 7.035 10.058H21L15.671 16.49z"
        fill="#fff"
      />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#010101" />
      <path
        d="M22 8h-3v10.5a3.5 3.5 0 11-3.5-3.5c.19 0 .38.02.5.05V11.5a7 7 0 107 7V13a8.96 8.96 0 005 1.5V11a5.96 5.96 0 01-6-3z"
        fill="#fff"
      />
      <path
        d="M22 8h-3v10.5a3.5 3.5 0 11-3.5-3.5c.19 0 .38.02.5.05V11.5a7 7 0 107 7V13a8.96 8.96 0 005 1.5V11a5.96 5.96 0 01-6-3z"
        fill="#EE1D52"
        opacity="0.5"
      />
      <path
        d="M19 8h3a5.96 5.96 0 006 3v3.5A8.96 8.96 0 0123 13v5.5a7 7 0 11-7-7c.19 0 .38.02.5.05V15a3.5 3.5 0 100 7 3.5 3.5 0 003.5-3.5V8z"
        fill="#69C9D0"
        opacity="0.6"
      />
    </svg>
  );
}

// ── Platform data ────────────────────────────────────────────────────────────

const platforms = [
  {
    key: "phone",
    Icon: WhatsAppIcon,
    bg: "#25D36622",
    label: "Mobile / WhatsApp",
    value: "0501234567",
    href: "https://wa.me/966501234567",
  },
  {
    key: "instagram",
    Icon: InstagramIcon,
    bg: "#E1306C18",
    label: "Instagram",
    value: "@aziz.a",
    href: "https://instagram.com/aziz.a",
  },
  {
    key: "snapchat",
    Icon: SnapchatIcon,
    bg: "#FFFC0022",
    label: "Snapchat",
    value: "aziz_snap",
    href: "https://snapchat.com/add/aziz_snap",
  },
  {
    key: "twitter",
    Icon: XIcon,
    bg: "#00000012",
    label: "X / Twitter",
    value: "@azizx_sa",
    href: "https://x.com/azizx_sa",
  },
  {
    key: "tiktok",
    Icon: TikTokIcon,
    bg: "#69C9D018",
    label: "TikTok",
    value: "@aziz.tok",
    href: "https://tiktok.com/@aziz.tok",
  },
];

// ── Copy SVG ─────────────────────────────────────────────────────────────────
function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Platform row ─────────────────────────────────────────────────────────────

function PlatformRow({ p, idx }: { p: typeof platforms[0]; idx: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(p.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
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
      {/* Brand icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: p.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <p.Icon size={20} />
      </div>

      {/* Label + value */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 2 }}>
          {p.label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: CHARCOAL,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.value}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#F0EBE4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: MUTED,
          }}
          title="Open"
        >
          <ExternalLinkIcon size={13} />
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
            color: copied ? OLIVE : MUTED,
            transition: "all 0.2s",
          }}
          title="Copy"
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
        a:hover { opacity: 0.8; }
        button:hover { opacity: 0.8; }
      `}</style>

      {/* Screen label */}
      <div
        style={{
          fontSize: 11,
          color: MUTED,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Profile — معلومات التواصل
      </div>

      {/* Avatar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          animation: "fadeIn 0.4s ease",
        }}
      >
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: OLIVE + "18",
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            color: OLIVE,
          }}
        >
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
        <div
          style={{
            padding: "16px 18px 12px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: CHARCOAL }}>
              معلومات التواصل
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
              تُكشف فقط لمن تبادلتم الإعجاب المتبادل
            </div>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: OLIVE + "12",
              border: "none",
              borderRadius: 999,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: OLIVE,
            }}
          >
            ✏️ تعديل
          </button>
        </div>

        {/* Platform rows */}
        <div
          style={{
            padding: "0 12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {platforms.map((p, i) => (
            <PlatformRow key={p.key} p={p} idx={i} />
          ))}
        </div>
      </div>

      {/* Privacy notice */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          background: OLIVE + "0E",
          border: `1px solid ${OLIVE}22`,
          maxWidth: 380,
          width: "100%",
          animation: "fadeIn 0.4s ease 0.5s both",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span style={{ fontSize: 12, color: OLIVE, lineHeight: 1.6 }}>
          هذه المعلومات خاصة تماماً — لا تظهر إلا لمن تبادلتم معهم اختيار «تواصل»
        </span>
      </div>
    </div>
  );
}
