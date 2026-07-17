import React from "react";

interface LogoProps {
  /** Pixel size of the square badge mark. */
  size?: number;
  /** Show the "Learnio" wordmark next to the badge. */
  showWordmark?: boolean;
  /** Extra classes on the wordmark (e.g. text size / colour). */
  wordmarkClassName?: string;
  /** Extra classes on the wrapping flex container. */
  className?: string;
}

/**
 * Learnio brand mark.
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
          {/* rising bars — steady, smoothed growth */}
          <rect x="5.4" y="18" width="4.3" height="9" rx="2.15" fill="#ffffff" fillOpacity="0.6" />
          <rect x="13.85" y="12.5" width="4.3" height="14.5" rx="2.15" fill="#ffffff" fillOpacity="0.8" />
          <rect x="22.3" y="7" width="4.3" height="20" rx="2.15" fill="#ffffff" />
          {/* spark node — the next lesson / the learner reaching further */}
          <circle cx="24.45" cy="4.3" r="2.7" fill="#ffffff" />
        </svg>
      </span>
      {showWordmark && (
        <span className={`font-bold tracking-tight ${wordmarkClassName}`}>Learnio</span>
      )}
    </div>
  );
}
