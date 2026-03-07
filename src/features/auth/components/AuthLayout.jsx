import { Warehouse } from "lucide-react";
import logInLogo from "../../../assets/Login/logInLogo.svg";
import grozziieLogo from "../../../assets/Login/GrozziieLogo.svg";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-white font-body">
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
          className="hidden lg:flex flex-col items-center justify-center p-12 bg-[#E6ECF0] rounded-xl m-3"
          style={{
            width: "42%",

            borderRight: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Logo */}
          <div className="w-full text-center gap-3 mb-10 self-start">
            <img className="block mx-auto mb-6" src={grozziieLogo} alt="" />
            <p className="text-sm leading-relaxed text-primary">{subtitle}</p>
          </div>

          <img src={logInLogo} alt="" />
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
