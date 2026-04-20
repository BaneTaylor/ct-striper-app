'use client';

interface FishIllustrationProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function FishIllustration({
  size = 120,
  color = '#14b8a6',
  className = '',
}: FishIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 80"
      width={size}
      height={size * 0.4}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Striped bass illustration"
    >
      {/* Body */}
      <path
        d="M 30,40 Q 50,15 90,18 Q 130,15 160,30 Q 175,36 180,40 Q 175,44 160,50 Q 130,65 90,62 Q 50,65 30,40 Z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.8"
      />
      {/* Tail */}
      <path
        d="M 30,40 Q 15,25 5,15 Q 18,30 15,40 Q 18,50 5,65 Q 15,55 30,40 Z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.8"
      />
      {/* Dorsal fin */}
      <path
        d="M 80,18 Q 90,5 110,10 Q 120,12 130,18"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Ventral fin */}
      <path
        d="M 100,62 Q 105,72 115,70 Q 120,68 120,60"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Pectoral fin */}
      <path
        d="M 140,42 Q 148,50 155,55 Q 150,48 145,42"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Eye */}
      <circle cx="160" cy="37" r="3" fill={color} opacity="0.9" />
      <circle cx="160.5" cy="36.5" r="1" fill="#0a1628" />
      {/* Stripes */}
      <line x1="60" y1="30" x2="130" y2="25" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="55" y1="36" x2="140" y2="33" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="55" y1="44" x2="140" y2="47" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="50" x2="130" y2="55" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Mouth */}
      <path
        d="M 175,38 Q 180,40 175,42"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.7"
      />
      {/* Gill line */}
      <path
        d="M 148,28 Q 145,40 148,52"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}
