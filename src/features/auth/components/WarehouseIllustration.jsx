export default function WarehouseIllustration() {
  return (
    <svg
      width="200"
      height="175"
      viewBox="0 0 200 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground */}
      <rect
        x="10"
        y="155"
        width="180"
        height="3"
        rx="1.5"
        fill="rgba(245,158,11,0.2)"
      />

      {/* Main warehouse body */}
      <rect
        x="25"
        y="90"
        width="150"
        height="65"
        rx="4"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(245,158,11,0.5)"
        strokeWidth="1.5"
      />

      {/* Roof */}
      <polygon
        points="100,28 18,90 182,90"
        fill="rgba(245,158,11,0.1)"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Roof ridge line */}
      <line
        x1="100"
        y1="28"
        x2="100"
        y2="90"
        stroke="rgba(245,158,11,0.3)"
        strokeWidth="1"
        strokeDasharray="5 4"
      />

      {/* Ridge dot */}
      <circle cx="100" cy="28" r="4" fill="#F59E0B" />
      <circle cx="100" cy="28" r="8" fill="rgba(245,158,11,0.2)" />

      {/* Door */}
      <rect
        x="82"
        y="112"
        width="36"
        height="43"
        rx="3"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="155"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <circle cx="95" cy="133" r="2" fill="rgba(245,158,11,0.6)" />
      <circle cx="105" cy="133" r="2" fill="rgba(245,158,11,0.6)" />

      {/* Left window */}
      <rect
        x="35"
        y="100"
        width="32"
        height="26"
        rx="3"
        fill="rgba(245,158,11,0.12)"
        stroke="rgba(245,158,11,0.4)"
        strokeWidth="1"
      />
      <line
        x1="51"
        y1="100"
        x2="51"
        y2="126"
        stroke="rgba(245,158,11,0.3)"
        strokeWidth="1"
      />
      <line
        x1="35"
        y1="113"
        x2="67"
        y2="113"
        stroke="rgba(245,158,11,0.3)"
        strokeWidth="1"
      />

      {/* Right window */}
      <rect
        x="133"
        y="100"
        width="32"
        height="26"
        rx="3"
        fill="rgba(245,158,11,0.12)"
        stroke="rgba(245,158,11,0.4)"
        strokeWidth="1"
      />
      <line
        x1="149"
        y1="100"
        x2="149"
        y2="126"
        stroke="rgba(245,158,11,0.3)"
        strokeWidth="1"
      />
      <line
        x1="133"
        y1="113"
        x2="165"
        y2="113"
        stroke="rgba(245,158,11,0.3)"
        strokeWidth="1"
      />

      {/* Left shelf rack */}
      <rect
        x="33"
        y="104"
        width="8"
        height="14"
        rx="1"
        fill="rgba(245,158,11,0.5)"
      />
      <rect
        x="42"
        y="107"
        width="8"
        height="11"
        rx="1"
        fill="rgba(245,158,11,0.35)"
      />
      {/* Right shelf rack */}
      <rect
        x="135"
        y="104"
        width="8"
        height="14"
        rx="1"
        fill="rgba(245,158,11,0.5)"
      />
      <rect
        x="144"
        y="107"
        width="8"
        height="11"
        rx="1"
        fill="rgba(245,158,11,0.35)"
      />

      {/* Forklift outline (right side) */}
      <rect
        x="158"
        y="130"
        width="22"
        height="16"
        rx="2"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <rect
        x="173"
        y="120"
        width="3"
        height="22"
        rx="1"
        fill="rgba(245,158,11,0.4)"
      />
      <rect
        x="162"
        y="118"
        width="14"
        height="3"
        rx="1"
        fill="rgba(245,158,11,0.4)"
      />
      <circle
        cx="163"
        cy="148"
        r="4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <circle
        cx="174"
        cy="148"
        r="4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />

      {/* Floating boxes */}
      <rect
        x="12"
        y="60"
        width="14"
        height="14"
        rx="2"
        fill="rgba(245,158,11,0.2)"
        stroke="rgba(245,158,11,0.4)"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0;0,-5;0,0"
          dur="3s"
          repeatCount="indefinite"
        />
      </rect>
      <rect
        x="174"
        y="52"
        width="12"
        height="12"
        rx="2"
        fill="rgba(245,158,11,0.15)"
        stroke="rgba(245,158,11,0.35)"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0;0,-6;0,0"
          dur="4s"
          repeatCount="indefinite"
        />
      </rect>
      <rect
        x="160"
        y="68"
        width="10"
        height="10"
        rx="2"
        fill="rgba(245,158,11,0.1)"
        stroke="rgba(245,158,11,0.25)"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0;0,-4;0,0"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Signal/wifi arcs above building */}
      <path
        d="M88 18 Q100 8 112 18"
        stroke="rgba(245,158,11,0.4)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M82 22 Q100 6 118 22"
        stroke="rgba(245,158,11,0.25)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
