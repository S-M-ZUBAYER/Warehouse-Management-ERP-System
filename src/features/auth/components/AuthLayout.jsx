import { Warehouse } from "lucide-react";
import WarehouseIllustration from "./WarehouseIllustration";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gray-300"
      style={{
        // background:
        //   "linear-gradient(135deg, #0F2744 0%, #1A3A5C 50%, #0D1F38 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-150px",
          right: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Ambient glow bottom-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30,107,181,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full flex rounded-3xl overflow-hidden"
        style={{
          maxWidth: "1080px",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* ── Left Panel ── */}
        <div
          className="hidden lg:flex flex-col items-center justify-center p-12"
          style={{
            width: "42%",
            background:
              "linear-gradient(160deg, rgba(245,158,11,0.1) 0%, rgba(255,255,255,0.02) 60%)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 self-start">
            <div
              className="w-11 h-11 flex items-center justify-center rounded-xl"
              style={{ background: "#F59E0B" }}
            >
              <Warehouse size={20} color="#0F2744" />
            </div>
            <span
              className="text-white font-bold text-xl tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              WareERP
            </span>
          </div>

          <WarehouseIllustration />

          <div className="mt-10 text-center">
            <h2
              className="text-white font-bold text-2xl mb-3 leading-snug"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {title}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {subtitle}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              ["10K+", "SKUs"],
              ["99.9%", "Uptime"],
              ["50+", "Zones"],
            ].map(([val, label]) => (
              <div key={label} className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{ fontFamily: "'Sora', sans-serif", color: "#F59E0B" }}
                >
                  {val}
                </div>
                <div
                  className="text-xs uppercase tracking-widest mt-0.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-10 py-12 lg:px-14">
          {children}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input:focus { outline: none; }
        button { cursor: pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-fade-in { animation: fadeSlideUp 0.4s ease both; }
      `}</style>
    </div>
  );
}
