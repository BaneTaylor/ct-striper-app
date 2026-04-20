'use client';

interface WaveBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function WaveBackground({
  className = '',
  opacity = 0.08,
}: WaveBackgroundProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Wave layer 1 — slowest, furthest back */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] animate-wave-slow"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: '80px', opacity: opacity * 0.6 }}
      >
        <path
          d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
          fill="#14b8a6"
        />
      </svg>

      {/* Wave layer 2 — medium */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] animate-wave-mid"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: '60px', opacity }}
      >
        <path
          d="M0,80 C360,40 720,100 1080,50 C1260,30 1380,70 1440,80 L1440,120 L0,120 Z"
          fill="#14b8a6"
        />
      </svg>

      {/* Wave layer 3 — fastest, foreground */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] animate-wave-fast"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: '40px', opacity: opacity * 1.2 }}
      >
        <path
          d="M0,90 C180,70 360,110 540,80 C720,50 900,100 1080,70 C1260,40 1380,90 1440,90 L1440,120 L0,120 Z"
          fill="#14b8a6"
        />
      </svg>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-mid {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave-slow {
          animation: wave-slow 25s linear infinite;
        }
        .animate-wave-mid {
          animation: wave-mid 18s linear infinite;
        }
        .animate-wave-fast {
          animation: wave-fast 12s linear infinite;
        }
      ` }} />
    </div>
  );
}
