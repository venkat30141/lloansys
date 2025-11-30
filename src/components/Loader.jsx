import React from "react";

/**
 * Loader Component (Tailwind v4 compatible)
 * Props:
 * - size: number (spinner size in rem, default 2)
 * - color: Tailwind color keyword ("blue", "green", "red", "gray", "white")
 * - className: additional Tailwind classes
 */

export default function Loader({ size = 2, color = "blue", className = "" }) {
  const s = `${size}rem`;
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-500",
    red: "text-red-500",
    gray: "text-gray-400",
    white: "text-white",
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`flex items-center justify-center ${colorClasses[color]} ${className}`}
    >
      <svg
        style={{ width: s, height: s }}
        className="animate-spin"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeOpacity="0.2"
          fill="none"
        />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
