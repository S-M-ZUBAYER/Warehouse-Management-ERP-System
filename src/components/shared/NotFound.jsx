import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NotFound — 404 page for Warehouse ERP
// Design: Dark navy + amber accent, warehouse SVG illustration,
//         animated floating boxes, staggered text reveal
// Only Tailwind CSS + inline keyframe styles
// ─────────────────────────────────────────────────────────────────────────────

export default function NotFound() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F2744] flex items-center justify-center px-6 overflow-hidden relative">
      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* ── Ambient glow blobs ── */}
      <div
        className="absolute top-[-120px] right-[-120px] w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-80px] left-[-80px] w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── Floating animated boxes (decorative) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          {
            size: "w-10 h-10",
            pos: "top-[15%] left-[8%]",
            delay: "0s",
            duration: "4s",
          },
          {
            size: "w-7  h-7",
            pos: "top-[25%] right-[10%]",
            delay: "0.8s",
            duration: "3.5s",
          },
          {
            size: "w-14 h-14",
            pos: "bottom-[20%] left-[12%]",
            delay: "0.4s",
            duration: "5s",
          },
          {
            size: "w-6  h-6",
            pos: "bottom-[30%] right-[15%]",
            delay: "1.2s",
            duration: "3s",
          },
          {
            size: "w-8  h-8",
            pos: "top-[60%] left-[4%]",
            delay: "0.6s",
            duration: "4.5s",
          },
          {
            size: "w-5  h-5",
            pos: "top-[10%] left-[45%]",
            delay: "1.5s",
            duration: "3.8s",
          },
        ].map((box, i) => (
          <div
            key={i}
            className={`absolute ${box.size} ${box.pos} rounded-lg border border-amber-400/20 bg-amber-400/5`}
            style={{
              animation: `floatBox ${box.duration} ease-in-out infinite`,
              animationDelay: box.delay,
            }}
          />
        ))}
      </div>

      {/* ── Main card ── */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-xl w-full transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Warehouse SVG illustration */}
        <div
          className="mb-8"
          style={{ animation: "floatBox 4s ease-in-out infinite" }}
        >
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
            {/* Ground */}
            <rect
              x="8"
              y="125"
              width="144"
              height="3"
              rx="1.5"
              fill="rgba(245,158,11,0.2)"
            />
            {/* Body */}
            <rect
              x="20"
              y="72"
              width="120"
              height="53"
              rx="3"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(245,158,11,0.4)"
              strokeWidth="1.5"
            />
            {/* Roof */}
            <polygon
              points="80,18 14,72 146,72"
              fill="rgba(245,158,11,0.08)"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Ridge */}
            <circle cx="80" cy="18" r="4" fill="#F59E0B" />
            <circle cx="80" cy="18" r="9" fill="rgba(245,158,11,0.15)" />
            {/* Door */}
            <rect
              x="64"
              y="90"
              width="32"
              height="35"
              rx="2"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
            <line
              x1="80"
              y1="90"
              x2="80"
              y2="125"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Windows */}
            <rect
              x="26"
              y="80"
              width="26"
              height="20"
              rx="2"
              fill="rgba(245,158,11,0.1)"
              stroke="rgba(245,158,11,0.35)"
              strokeWidth="1"
            />
            <rect
              x="108"
              y="80"
              width="26"
              height="20"
              rx="2"
              fill="rgba(245,158,11,0.1)"
              stroke="rgba(245,158,11,0.35)"
              strokeWidth="1"
            />
            {/* X marks on windows — "not found" detail */}
            <line
              x1="29"
              y1="83"
              x2="49"
              y2="97"
              stroke="rgba(239,68,68,0.5)"
              strokeWidth="1.2"
            />
            <line
              x1="49"
              y1="83"
              x2="29"
              y2="97"
              stroke="rgba(239,68,68,0.5)"
              strokeWidth="1.2"
            />
            <line
              x1="111"
              y1="83"
              x2="131"
              y2="97"
              stroke="rgba(239,68,68,0.5)"
              strokeWidth="1.2"
            />
            <line
              x1="131"
              y1="83"
              x2="111"
              y2="97"
              stroke="rgba(239,68,68,0.5)"
              strokeWidth="1.2"
            />
            {/* Search icon floating above */}
            <circle
              cx="116"
              cy="40"
              r="14"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(245,158,11,0.4)"
              strokeWidth="1.5"
            />
            <circle
              cx="114"
              cy="38"
              r="6"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <line
              x1="119"
              y1="43"
              x2="123"
              y2="47"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 404 number */}
        <div
          className="relative mb-2"
          style={{
            animation: `fadeSlideUp 0.5s ease both`,
            animationDelay: "0.1s",
          }}
        >
          <span
            className="block font-black leading-none select-none"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(80px, 18vw, 130px)",
              color: "transparent",
              WebkitTextStroke: "2px rgba(245,158,11,0.25)",
              letterSpacing: "-4px",
            }}
          >
            404
          </span>
          {/* Filled 404 on top — offset */}
          <span
            className="absolute top-1 left-1 block font-black leading-none select-none pointer-events-none"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(80px, 18vw, 130px)",
              background:
                "linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-4px",
              opacity: 0.15,
            }}
          >
            404
          </span>
        </div>

        {/* Divider line with dot */}
        <div
          className="flex items-center gap-3 mb-6 w-48"
          style={{
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0.2s",
          }}
        >
          <div className="flex-1 h-px bg-amber-400/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          <div className="flex-1 h-px bg-amber-400/20" />
        </div>

        {/* Heading */}
        <h1
          className="text-2xl font-bold text-white mb-3 leading-tight"
          style={{
            fontFamily: "'Sora', sans-serif",
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0.25s",
          }}
        >
          Page Not Found
        </h1>

        {/* Subtext */}
        <p
          className="text-sm leading-relaxed mb-10 max-w-xs"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "'DM Sans', sans-serif",
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0.3s",
          }}
        >
          The route you're looking for doesn't exist in the warehouse. It may
          have been moved, removed, or you may have mistyped the address.
        </p>

        {/* Buttons row */}
        <div
          className="flex items-center gap-3 flex-wrap justify-center"
          style={{
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0.38s",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            {/* Arrow left */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7L9 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Go Back
          </button>

          {/* Back to Dashboard — primary CTA */}
          <button
            onClick={() => navigate("/warehouse_management")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group"
            style={{
              background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
              border: "none",
              color: "#0F2744",
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 28px rgba(245,158,11,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(245,158,11,0.35)";
            }}
          >
            {/* Dashboard grid icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="1"
                width="5"
                height="5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="8"
                y="1"
                width="5"
                height="5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="1"
                y="8"
                width="5"
                height="5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="8"
                y="8"
                width="5"
                height="5"
                rx="1"
                fill="currentColor"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Path hint */}
        <p
          className="mt-8 text-xs font-mono px-4 py-2 rounded-lg"
          style={{
            color: "rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "'JetBrains Mono', monospace",
            animation: "fadeSlideUp 0.5s ease both",
            animationDelay: "0.45s",
          }}
        >
          Error 404 ·{" "}
          {typeof window !== "undefined"
            ? window.location.pathname
            : "/unknown-route"}
        </p>
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;900&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono&display=swap');

        @keyframes floatBox {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(3deg); }
          66%       { transform: translateY(-6px) rotate(-2deg); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
