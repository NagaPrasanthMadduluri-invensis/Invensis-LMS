"use client";

function WaveLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Primary horizontal flowing waves */}
      <path d="M-30,28  C45,6   105,54  185,32  C265,10  325,54  460,26"  stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" fill="none"/>
      <path d="M-30,70  C52,92  112,46  192,70  C272,94  334,54  460,74"  stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" fill="none"/>
      <path d="M-30,116 C50,96  118,140 194,114 C270,88  338,132 460,114" stroke="rgba(255,255,255,0.30)" strokeWidth="0.75" fill="none"/>
      <path d="M-30,160 C58,146 130,174 206,156 C282,138 344,168 460,156" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"  fill="none"/>
      <path d="M-30,200 C62,188 132,210 210,196 C288,182 350,204 460,198" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"  fill="none"/>

      {/* Secondary offset waves (layered depth) */}
      <path d="M-30,48  C64,32  128,68  212,48  C296,28  356,64  460,48"  stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"  fill="none"/>
      <path d="M-30,93  C66,112 128,76  208,96  C288,116 350,84  460,96"  stroke="rgba(255,255,255,0.16)" strokeWidth="0.48" fill="none"/>
      <path d="M-30,138 C60,122 124,158 204,138 C284,118 348,148 460,136" stroke="rgba(255,255,255,0.15)" strokeWidth="0.45" fill="none"/>
      <path d="M-30,182 C64,170 126,194 208,178 C290,162 352,186 460,178" stroke="rgba(255,255,255,0.13)" strokeWidth="0.42" fill="none"/>

      {/* Diagonal cross-waves (mesh intersections) */}
      <path d="M72,-15  C55,56  80,110  62,220"  stroke="rgba(255,255,255,0.20)" strokeWidth="0.55" fill="none"/>
      <path d="M162,-15 C180,56 156,116 174,220" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"  fill="none"/>
      <path d="M252,-15 C234,56 260,110 244,220" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" fill="none"/>
      <path d="M342,-15 C360,56 336,114 354,220" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"  fill="none"/>
      <path d="M432,-15 C414,56 438,110 422,220" stroke="rgba(255,255,255,0.12)" strokeWidth="0.45" fill="none"/>

      {/* Intersection glow rings */}
      <circle cx="162" cy="48"  r="6"   fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1"/>
      <circle cx="162" cy="48"  r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="252" cy="93"  r="5"   fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1"/>
      <circle cx="252" cy="93"  r="2"   fill="rgba(255,255,255,0.35)"/>
      <circle cx="72"  cy="116" r="4.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9"/>
      <circle cx="72"  cy="116" r="1.8" fill="rgba(255,255,255,0.32)"/>
      <circle cx="342" cy="138" r="5"   fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="1"/>
      <circle cx="342" cy="138" r="2"   fill="rgba(255,255,255,0.30)"/>
      <circle cx="162" cy="160" r="4"   fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8"/>
      <circle cx="162" cy="160" r="1.5" fill="rgba(255,255,255,0.26)"/>

      {/* Ambient highlight blobs */}
      <ellipse cx="100" cy="40"  rx="60" ry="30" fill="rgba(255,255,255,0.12)"/>
      <ellipse cx="300" cy="140" rx="70" ry="35" fill="rgba(80,80,80,0.08)"/>
    </svg>
  );
}

export function PremiumCard({ children, className = "", style = {}, ...props }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, #F0F0F0 0%, #E4E4E4 40%, #C8C8C8 100%)",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
        borderRadius: "16px",
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: "inherit" }}>
        {/* Highlight radial — top-left glint */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 15% -10%, rgba(255,255,255,0.8) 0%, transparent 55%)" }}
        />
        {/* Shadow radial — bottom-right depth */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 90% 110%, rgba(0,0,0,0.08) 0%, transparent 50%)" }}
        />
        <WaveLines />
      </div>

      <div className="relative z-10" style={{ minHeight: "100%", color: "#111111" }}>
        {children}
      </div>
    </div>
  );
}
