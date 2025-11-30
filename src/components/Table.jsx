import React from "react";

/**
 * Table Component (Tailwind v4 compatible)
 * Props:
 * - columns: [{ header, accessor, key?, cell? }]
 * - data: array of objects
 * - rowKey: function(row) -> unique key
 * - renderRowActions: optional function(row) -> JSX (buttons etc.)
 */
export default function Table({
  columns = [],
  data = [],
  rowKey = (r) => r.id,
  renderRowActions,
  className = "",
}) {
  return (
    <div
      className={`overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200 ${className}`}
    >
      <table className="min-w-full border-collapse text-sm">
        {/* ===== Table Head ===== */}
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.accessor}
                scope="col"
                className="px-4 py-3 text-left text-gray-700 font-semibold uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
            {renderRowActions && (
              <th className="px-4 py-3 text-right text-gray-700 font-semibold uppercase tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* ===== Table Body ===== */}
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (renderRowActions ? 1 : 0)}
                className="px-4 py-6 text-center text-gray-500"
              >
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((col) => {
                  const value =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor];

                  return (
                    <td
                      key={col.accessor}
                      className="px-4 py-3 text-gray-700 align-top"
                    >
                      {col.cell ? col.cell(value, row) : value}
                    </td>
                  );
                })}

                {renderRowActions && (
                  <td className="px-4 py-3 text-right">
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
