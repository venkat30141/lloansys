import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

/**
 * DashboardLayout Component (Tailwind v4 compatible)
 * - Role-based sidebar & routes
 * - Responsive mobile menu
 * - Logout handler
 */
export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if no user session
  if (!user) {
    navigate("/");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = [
    { role: "admin", label: "Admin Dashboard", path: "/admin" },
    { role: "borrower", label: "Borrower Dashboard", path: "/borrower" },
    { role: "lender", label: "Lender Dashboard", path: "/lender" },
    { role: "analyst", label: "Analyst Dashboard", path: "/analyst" },
  ];

  const allowedRoutes = navItems.filter((i) => i.role === user.role);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed sm:static top-0 left-0 z-40 h-full w-64 bg-white shadow-lg border-r transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">LoanSys</h1>
          <button
            className="sm:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b">
          <p className="text-sm text-gray-500 capitalize">{user.role} panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {allowedRoutes.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="sm:hidden text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </h2>
          </div>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </header>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
