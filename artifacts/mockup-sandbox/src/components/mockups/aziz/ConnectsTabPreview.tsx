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
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.65 4.801 1.785 6.813L2 30l7.383-1.754A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366" />
      <path d="M22.5 19.5c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z" fill="#fff" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="igG2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#FCAF45" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#igG2)" />
      <rect x="7" y="7" width="18" height="18" rx="5" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="4.5" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="22" cy="10" r="1.2" fill="#fff" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#000" />
      <path d="M18.244 13.5L26.182 5h-1.89l-6.9 8.025L12 5H5.5l8.318 12.1L5.5 27h1.89l7.273-8.45L21.5 27H28L18.244 13.5zm-2.573 2.99l-.843-1.206-6.7-9.578H11l5.41 7.733.843 1.206 7.035 10.058H21L15.671 16.49z" fill="#fff" />
    </svg>
  );
}

// ── Small icons ───────────────────────────────────────────────────────────────

function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function HeartIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? OLIVE : "none"} stroke={OLIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function LinkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ── Platforms for مها ─────────────────────────────────────────────────────────

const mahaContacts = [
  { key: "phone",     Icon: WhatsAppIcon, bg: "#25D36622", label: "Mobile / WhatsApp", value: "0551122334", href: "https://wa.me/966551122334" },
  { key: "instagram", Icon: InstagramIcon, bg: "#E1306C18", label: "Instagram",        value: "@maha.sa",   href: "https://instagram.com/maha.sa" },
  { key: "twitter",   Icon: XIcon,        bg: "#00000012", label: "X / Twitter",       value: "@maha_x",    href: "https://x.com/maha_x" },
];

function ContactRow({ c, idx }: { c: typeof mahaContacts[0]; idx: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 12,
      background: SAND, border: `1px solid ${BORDER}`,
      animation: `fadeIn 0.3s ease ${0.35 + idx * 0.08}s both`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: c.bg, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <c.Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: CHARCOAL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.value}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a href={c.href} target="_blank" rel="noopener noreferrer"
          style={{ width: 28, height: 28, borderRadius: 8, background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: MUTED }}>
          <ExternalIcon size={13} />
        </a>
        <button onClick={() => { navigator.clipboard.writeText(c.value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ width: 28, height: 28, borderRadius: 8, background: copied ? OLIVE + "20" : "#F0EBE4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? OLIVE : MUTED, transition: "all 0.2s" }}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ConnectsTabPreview() {
  return (
    <div style={{
      minHeight: "100vh", background: SAND,
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 0,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        a:hover, button:hover { opacity: 0.8; }
      `}</style>

      {/* Top bar */}
      <div style={{
        width: "100%", padding: "16px 20px 12px",
        background: SAND, borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10,
        animation: "fadeIn 0.3s ease",
      }}>
        <HeartIcon size={18} filled />
        <span style={{ fontSize: 17, fontWeight: 800, color: CHARCOAL }}>معارفي</span>
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
          background: OLIVE + "12", borderRadius: 999,
          padding: "4px 12px", fontSize: 12, fontWeight: 700, color: OLIVE,
        }}>
          <HeartIcon size={12} filled />
          2 معارف متبادلون
        </div>
      </div>

      <div style={{ width: "100%", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Event label */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, animation: "fadeIn 0.3s ease 0.1s both" }}>
          <span style={{ fontSize: 13, color: MUTED }}>☕</span>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
            من طلعة الدمام · مارس 2025
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: OLIVE, cursor: "pointer" }}>
            ↗
          </span>
        </div>

        {/* Mutual connect card — مها */}
        <div style={{
          background: CARD, borderRadius: 18,
          border: `1px solid ${OLIVE}25`,
          backgroundColor: OLIVE + "06",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          animation: "fadeIn 0.35s ease 0.15s both",
        }}>
          {/* Member header */}
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: GOLD + "33",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: GOLD,
            }}>
              م
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: CHARCOAL }}>مها</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>هادئة · فضولية · منظّمة</div>
            </div>
            <LinkIcon size={15} />
          </div>

          {/* Contact rows */}
          <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {mahaContacts.map((c, i) => (
              <ContactRow key={c.key} c={c} idx={i} />
            ))}
          </div>
        </div>

        {/* Second connect — شذى (no contact info added) */}
        <div style={{
          background: CARD, borderRadius: 18,
          border: `1px solid ${OLIVE}25`,
          backgroundColor: OLIVE + "06",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          animation: "fadeIn 0.35s ease 0.2s both",
        }}>
          <div style={{ padding: "14px 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: GOLD + "33",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: GOLD,
            }}>
              ش
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: CHARCOAL }}>شذى</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={OLIVE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>اجتماعية · مبدعة</div>
            </div>
            <LinkIcon size={15} />
          </div>

          {/* No contact info state */}
          <div style={{ padding: "0 12px 14px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", borderRadius: 10, background: "#F5EFE6",
              border: `1px dashed ${BORDER}`,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: 12, color: MUTED }}>لم تُضف شذى معلومات تواصل بعد</span>
            </div>
          </div>
        </div>

        {/* Nudge to fill own contact info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 14,
          background: GOLD + "10", border: `1px solid ${GOLD}30`,
          cursor: "pointer", animation: "fadeIn 0.35s ease 0.4s both",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>أضف معلومات تواصلك</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>حتى يتمكن معارفك من التواصل معك</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

      </div>
    </div>
  );
}
