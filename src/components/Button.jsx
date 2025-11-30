import React from "react";

/**
 * Button Component (Tailwind v4 compatible)
 * Props:
 * - variant: "primary" | "success" | "danger" | "secondary"
 * - type: "button" | "submit" | "reset"
 * - disabled: boolean
 * - className: custom Tailwind classes
 * - onClick: click handler
 * - children: button label or icon
 */

export default function Button({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  variant = "primary",
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 focus:ring-2",
    success:
      "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 focus:ring-2",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 focus:ring-2",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 focus:ring-2",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
