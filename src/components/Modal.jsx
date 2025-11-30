import React, { useEffect } from "react";

/**
 * Modal Component (Tailwind v4 compatible)
 * Props:
 * - isOpen: boolean → controls visibility
 * - onClose: function → called when backdrop or ESC is pressed
 * - title: string → optional header text
 * - children: ReactNode → modal body content
 * - footer: ReactNode → optional footer (buttons etc.)
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal content container */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 transform transition-all duration-200 scale-100 animate-fadeIn"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {title && (
            <h3
              id="modal-title"
              className="text-lg font-semibold text-gray-800"
            >
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 rounded-full p-1.5 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-gray-200">{footer}</div>}
      </div>
    </div>
  );
}
