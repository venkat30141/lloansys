import React from "react";

/**
 * Card Component (Tailwind v4 compatible)
 * Props:
 * - title: optional heading text
 * - subtitle: small secondary heading
 * - className: custom Tailwind classes for layout tweaks
 * - children: inner content
 */
export default function Card({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition duration-200 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
