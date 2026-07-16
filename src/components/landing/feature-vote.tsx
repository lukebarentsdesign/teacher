"use client";

import { useState } from "react";

interface FeatureVoteProps {
  title: string;
  description: string;
  initialVotes: number;
}

export function FeatureVote({ title, description, initialVotes }: FeatureVoteProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (hasVoted) return;
    setVotes((v) => v + 1);
    setHasVoted(true);
  };

  return (
    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm transition-shadow hover:shadow-card">
      <div>
        <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={handleVote}
        disabled={hasVoted}
        aria-label={`Vote for ${title}`}
        className={`flex flex-col items-center justify-center min-w-[3.5rem] px-2 py-2 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          hasVoted
            ? "bg-brand-50 border-brand-200 text-brand-700"
            : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-brand-300 hover:bg-white hover:text-brand-600"
        }`}
      >
        <svg
          className={`w-5 h-5 mb-0.5 ${hasVoted ? "text-brand-600" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        <span className="font-medium text-sm">{votes}</span>
      </button>
    </div>
  );
}
