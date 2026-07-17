"use client";

import { useState, useTransition } from "react";
import { submitFeatureFeedbackAction } from "./actions";

type FeedbackFormProps = {
  featureKey: string;
  title: string;
  description: string;
  initialRating?: string;
  initialComment?: string;
};

export function FeatureFeedbackForm({
  featureKey,
  title,
  description,
  initialRating = "",
  initialComment = "",
}: FeedbackFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating option.");
      return;
    }
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const err = await submitFeatureFeedbackAction(featureKey, rating, comment);
      if (err) {
        setError(err);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm space-y-4 transition-all duration-150 hover:shadow-md"
    >
      <div>
        <h3 className="font-semibold text-neutral-900 text-sm leading-snug">{title}</h3>
        <p className="text-2xs text-neutral-500 mt-1 leading-normal">{description}</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-3xs font-semibold text-neutral-400 uppercase tracking-wider">How important is this to you?</p>
        <div className="flex gap-2">
          {[
            { value: "ESSENTIAL", label: "🔥 Essential" },
            { value: "USEFUL", label: "👍 Useful" },
            { value: "NOT_IMPORTANT", label: "💤 Not important" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 text-center py-2 px-1 text-xs rounded-lg border font-medium cursor-pointer transition-all duration-150 ${
                rating === opt.value
                  ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name={`rating-${featureKey}`}
                value={opt.value}
                checked={rating === opt.value}
                onChange={() => setRating(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`comment-${featureKey}`} className="block text-3xs font-semibold text-neutral-400 uppercase tracking-wider">
          Any specific requirements or notes?
        </label>
        <textarea
          id={`comment-${featureKey}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. 'I need Stripe to support Apple Pay' or 'I want Google Calendar only'"
          rows={2}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-neutral-500 focus:outline-none transition-colors duration-150 placeholder:text-neutral-400"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {error ? (
          <span className="text-2xs font-semibold text-red-600">{error}</span>
        ) : saved ? (
          <span className="text-2xs font-bold text-green-600 animate-pulse">✓ Saved successfully!</span>
        ) : (
          <span />
        )}
        
        <button
          type="submit"
          disabled={isPending || !rating}
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? "Saving..." : "Save Vote"}
        </button>
      </div>
    </form>
  );
}
