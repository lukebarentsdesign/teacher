import React from "react";

interface LogoProps {
  /** Pixel size of the square badge mark. */
  size?: number;
  /** Show the "TeachBase" wordmark next to the badge. */
  showWordmark?: boolean;
  /** Extra classes on the wordmark (e.g. text size / colour). */
  wordmarkClassName?: string;
  /** Extra classes on the wrapping flex container. */
  className?: string;
}

/**
 * TeachBase brand mark.
 *
 * The badge is a rounded "squircle" holding three rising bars and a spark node —
 * a field-neutral symbol of steady, smoothed growth (income that climbs evenly
 * month to month) and of a learner reaching the next step. Deliberately not tied
 * to any one discipline, so it reads for music teachers, tutors, coaches,
 * instructors and trainers alike.
 */
export function Logo({
  size = 32,
  showWordmark = true,
  wordmarkClassName = "text-xl text-neutral-900",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="relative inline-flex items-center justify-center rounded-[30%] bg-gradient-to-br from-brand-500 to-brand-700 shadow-card ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          {/* TeachBase Logo: A stylized 'T' rising from a solid base platform */}
          {/* Base platform */}
          <rect x="5" y="23" width="22" height="3.5" rx="1.75" fill="#ffffff" />
          {/* Stem of the T */}
          <rect x="14.25" y="10.5" width="3.5" height="12.5" rx="1" fill="#ffffff" fillOpacity="0.8" />
          {/* Top bar of the T (Open Book / Roof shape) */}
          <path d="M 6 10 L 16 5 L 26 10 L 16 13 Z" fill="#ffffff" />
        </svg>
      </span>
      {showWordmark && (
        <span className={`font-bold tracking-tight ${wordmarkClassName}`}>TeachBase</span>
      )}
    </div>
  );
}
