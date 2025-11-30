import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * Safe JSON parser for localStorage values.
 */
function safeParseJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data ?? fallback;
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`, err);
    return fallback;
  }
}

/**
 * AdminDashboard
 * Handles loan approvals, lender assignments, and full CRUD for users & loans.
 * Frontend-only using localStorage (no backend required).
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLenders, setSelectedLenders] = useState({});
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "borrower",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // editing state for Users
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState({
    name: "",
    email: "",
    role: "borrower",
  });

  // editing state for Loans
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editingLoan, setEditingLoan] = useState({
    amount: "",
    duration: "",
    purpose: "",
    status: "",
  });

  // side panel selected loan
  const [selectedLoan, setSelectedLoan] = useState(null);

  // -------- Initial load & admin guard --------
  useEffect(() => {
    const logged = safeParseJSON("user", null);

    if (!logged || logged.role !== "admin") {
      toast.error("Unauthorized. Please login as admin.");
      navigate("/");
      return;
    }

    setCurrentUser(logged);

    const storedLoans = safeParseJSON("loans", []);
    const storedUsers = safeParseJSON("users", []);

    setLoans(storedLoans);
    setUsers(storedUsers);
    setIsLoading(false);
  }, [navigate]);

  // Helper to persist loan updates
  const updateLoans = (updated) => {
    setLoans(updated);
    localStorage.setItem("loans", JSON.stringify(updated));
  };

  // Helper to persist user updates
  const updateUsers = (updated) => {
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
  };

  // -------- Derived values --------
  const lenders = useMemo(
    () => users.filter((u) => u.role === "lender"),
    [users]
  );

  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const totalAmount = loans.reduce(
      (sum, l) => sum + Number(l.amount || 0),
      0
    );
    const pendingCount = loans.filter((l) => l.status === "Pending").length;
    const approvedCount = loans.filter((l) => l.status === "Approved").length;
    const rejectedCount = loans.filter((l) => l.status === "Rejected").length;
    const disbursedCount = loans.filter(
      (l) => l.status === "Funds Disbursed"
    ).length;
    const completedCount = loans.filter(
      (l) => l.status === "Completed"
    ).length;

    return {
      totalLoans,
      totalAmount,
      pendingCount,
      approvedCount,
      rejectedCount,
      disbursedCount,
      completedCount,
    };
  }, [loans]);

  const filteredLoans = useMemo(() => {
    if (filterStatus === "all") return loans;

    if (filterStatus === "pending") {
      return loans.filter((l) => l.status === "Pending");
    }
    if (filterStatus === "approved") {
      return loans.filter((l) => l.status === "Approved");
    }
    if (filterStatus === "completed") {
      return loans.filter((l) => l.status === "Completed");
    }
    if (filterStatus === "rejected") {
      return loans.filter((l) => l.status === "Rejected");
    }
    if (filterStatus === "active") {
      return loans.filter((l) =>
        ["Approved", "Funds Disbursed", "Assigned"].includes(l.status)
      );
    }

    return loans;
  }, [loans, filterStatus]);

  // -------- Loan Actions --------

  const handleApprove = (id) => {
    const updated = loans.map((loan) =>
      loan.id === id ? { ...loan, status: "Approved" } : loan
    );
    updateLoans(updated);
    toast.success("✅ Loan approved!");
  };

  const handleReject = (id) => {
    const updated = loans.map((loan) =>
      loan.id === id ? { ...loan, status: "Rejected" } : loan
    );
    updateLoans(updated);
    toast.error("❌ Loan rejected!");
  };

  const handleAssignLender = (loanId) => {
    const lenderId = selectedLenders[loanId];
    if (!lenderId) return toast.error("Please select a lender!");

    const lender = users.find((u) => u.id === Number(lenderId));
    if (!lender) return toast.error("Invalid lender!");

    const updated = loans.map((loan) => {
      if (loan.id !== loanId) return loan;

      const newStatus =
        loan.status === "Pending" || loan.status === "Assigned"
          ? "Approved"
          : loan.status;

      return {
        ...loan,
        lenderId: lender.id,
        lenderName: lender.name,
        status: newStatus,
      };
    });

    updateLoans(updated);
    toast.success(`Lender ${lender.name} assigned successfully!`);
  };

  const startEditLoan = (loan) => {
    setEditingLoanId(loan.id);
    setEditingLoan({
      amount: loan.amount.toString(),
      duration: loan.duration.toString(),
      purpose: loan.purpose,
      status: loan.status || "Pending",
    });
  };

  const handleSaveLoan = (loanId) => {
    const amountNum = Number(editingLoan.amount);
    const durationNum = Number(editingLoan.duration);

    if (amountNum <= 0 || durationNum <= 0) {
      toast.error("Amount and duration must be positive.");
      return;
    }

    const updated = loans.map((loan) =>
      loan.id === loanId
        ? {
            ...loan,
            amount: amountNum,
            duration: durationNum,
            purpose: editingLoan.purpose.trim(),
            status: editingLoan.status || loan.status,
          }
        : loan
    );

    updateLoans(updated);
    setEditingLoanId(null);
    toast.success("✅ Loan updated successfully.");
  };

  const handleDeleteLoan = (loanId) => {
    const updated = loans.filter((l) => l.id !== loanId);
    updateLoans(updated);
    toast.success("🗑 Loan deleted.");
    if (editingLoanId === loanId) setEditingLoanId(null);
    if (selectedLoan && selectedLoan.id === loanId) setSelectedLoan(null);
  };

  // -------- User Actions --------

  const handleAddUser = (e) => {
    e.preventDefault();

    const existing = safeParseJSON("users", []);
    if (
      existing.find(
        (u) => u.email === newUser.email.trim().toLowerCase()
      )
    ) {
      toast.error("User already exists!");
      return;
    }
    const user = {
      ...newUser,
      id: Date.now(),
      email: newUser.email.trim().toLowerCase(),
    };
    const updatedUsers = [...existing, user];
    updateUsers(updatedUsers);
    toast.success("User added successfully!");
    setShowUserForm(false);
    setNewUser({ name: "", email: "", password: "", role: "borrower" });
  };

  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditingUser({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveUser = (userId) => {
    const emailTrimmed = editingUser.email.trim().toLowerCase();

    if (!editingUser.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (!emailTrimmed) {
      toast.error("Email cannot be empty.");
      return;
    }

    const existsOther = users.some(
      (u) => u.id !== userId && u.email === emailTrimmed
    );
    if (existsOther) {
      toast.error("Another user already has this email.");
      return;
    }

    const updated = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            name: editingUser.name.trim(),
            email: emailTrimmed,
            role: editingUser.role,
          }
        : u
    );

    updateUsers(updated);
    setEditingUserId(null);
    toast.success("✅ User updated successfully.");
  };

  const handleDeleteUser = (userId) => {
    if (currentUser && currentUser.id === userId) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    const updated = users.filter((u) => u.id !== userId);
    updateUsers(updated);
    toast.success("🗑 User deleted.");
    if (editingUserId === userId) setEditingUserId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // -------- Render --------

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-pulse text-slate-500 text-lg">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_40%,_#020617_100%)] opacity-90" />
      </div>

      {/* Dark overlay for side panel on mobile */}
      {selectedLoan && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setSelectedLoan(null)}
        />
      )}

      <div className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 via-emerald-400 to-indigo-500 flex items-center justify-center shadow-[0_0_45px_rgba(56,189,248,0.9)]">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-950 uppercase">
                AD
              </span>
              <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  loanSys
                </p>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-400/40 px-2 py-[2px] text-[10px] font-medium text-emerald-200">
                  Admin
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Welcome back,{" "}
                <span className="font-semibold text-slate-100">
                  {currentUser.name}
                </span>
                . Monitor loans, users, and assignments in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-[10px] text-slate-500">
              <span>Environment: Demo (localStorage)</span>
              <span>Role: Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-red-500/10 px-4 py-2 text-xs md:text-sm font-medium text-red-100 hover:bg-red-500/20 hover:border-red-400 transition"
            >
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Loans"
            value={stats.totalLoans.toString()}
            sub={`₹${stats.totalAmount.toFixed(2)} total`}
            accent="from-sky-400 to-sky-500"
            badge="Overview"
          />
          <StatCard
            label="Pending"
            value={stats.pendingCount.toString()}
            sub="Awaiting approval"
            accent="from-amber-400 to-orange-500"
            badge="Queue"
          />
          <StatCard
            label="Approved / Disbursed"
            value={`${stats.approvedCount} / ${stats.disbursedCount}`}
            sub="Approved · Funds Disbursed"
            accent="from-emerald-400 to-emerald-500"
            badge="Active Flow"
          />
          <StatCard
            label="Completed / Rejected"
            value={`${stats.completedCount} / ${stats.rejectedCount}`}
            sub="Closed loans"
            accent="from-indigo-400 to-fuchsia-500"
            badge="Closed"
          />
        </section>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content (loans + users) */}
          <div className="flex-1 space-y-6">
            {/* Loan Management Section */}
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/75 p-5 md:p-6 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700/70 px-3 py-1 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                      Loan Workflow
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-50">
                    Loan Requests & Lifecycle
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Approve / reject requests, assign lenders, edit or delete
                    loans. Use{" "}
                    <span className="text-sky-300 font-semibold">
                      See User Profile
                    </span>{" "}
                    to view KYC details.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <span className="text-slate-400">View:</span>
                  <div className="flex rounded-full bg-slate-950/60 border border-slate-700/80 px-1">
                    {[
                      { id: "all", label: "All" },
                      { id: "pending", label: "Pending" },
                      { id: "active", label: "Active" },
                      { id: "completed", label: "Completed" },
                      { id: "rejected", label: "Rejected" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilterStatus(f.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                          filterStatus === f.id
                            ? "bg-sky-500/90 text-slate-950 font-semibold shadow-[0_0_14px_rgba(56,189,248,0.6)]"
                            : "text-slate-400 hover:text-sky-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loans.length === 0 ? (
                <p className="text-slate-500 text-center py-6 text-sm">
                  No loan requests available yet.
                </p>
              ) : filteredLoans.length === 0 ? (
                <p className="text-slate-500 text-center py-6 text-sm">
                  No loans match the selected filter.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300">
                        <th className="p-3 text-left">Borrower</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Duration</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Lender</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoans.map((loan, idx) => {
                        const isEditing = editingLoanId === loan.id;
                        const isStriped = idx % 2 === 1;

                        return (
                          <tr
                            key={loan.id}
                            className={`border-t border-slate-800 transition ${
                              isEditing
                                ? "bg-slate-900/90 ring-1 ring-sky-500/70"
                                : isStriped
                                ? "bg-slate-950/40 hover:bg-slate-900/70"
                                : "bg-slate-950/20 hover:bg-slate-900/70"
                            }`}
                          >
                            <td className="p-3 text-slate-100">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {loan.borrowerName}
                                </span>
                                {loan.createdAt && (
                                  <span className="text-[10px] text-slate-500">
                                    Created:{" "}
                                    {new Date(
                                      loan.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-medium text-slate-100">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editingLoan.amount}
                                  onChange={(e) =>
                                    setEditingLoan((prev) => ({
                                      ...prev,
                                      amount: e.target.value,
                                    }))
                                  }
                                  className="w-24 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <>₹{loan.amount}</>
                              )}
                            </td>
                            <td className="p-3 text-slate-200">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editingLoan.duration}
                                  onChange={(e) =>
                                    setEditingLoan((prev) => ({
                                      ...prev,
                                      duration: e.target.value,
                                    }))
                                  }
                                  className="w-24 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                              ) : (
                                <>{loan.duration} months</>
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <select
                                  value={editingLoan.status}
                                  onChange={(e) =>
                                    setEditingLoan((prev) => ({
                                      ...prev,
                                      status: e.target.value,
                                    }))
                                  }
                                  className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Funds Disbursed">
                                    Funds Disbursed
                                  </option>
                                  <option value="Completed">Completed</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Assigned">Assigned</option>
                                </select>
                              ) : (
                                <LoanStatusPill status={loan.status} />
                              )}
                            </td>
                            <td className="p-3">
                              {loan.lenderName ? (
                                <span className="text-sm text-slate-100">
                                  {loan.lenderName}
                                </span>
                              ) : lenders.length === 0 ? (
                                <span className="text-[11px] text-slate-500">
                                  No lenders available
                                </span>
                              ) : (
                                <select
                                  className="border border-slate-700 rounded-md bg-slate-900/80 px-2 py-1 text-xs md:text-sm text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                  value={selectedLenders[loan.id] || ""}
                                  onChange={(e) =>
                                    setSelectedLenders((prev) => ({
                                      ...prev,
                                      [loan.id]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select Lender</option>
                                  {lenders.map((l) => (
                                    <option key={l.id} value={l.id}>
                                      {l.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="p-3 space-x-1 md:space-x-2 whitespace-nowrap">
                              {/* See User Profile (opens side panel with KYC) */}
                              <button
                                onClick={() => setSelectedLoan(loan)}
                                className="bg-slate-900/80 hover:bg-slate-700 text-sky-200 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium border border-slate-700/80"
                              >
                                See User Profile
                              </button>

                              {/* Approve/Reject (only when not editing) */}
                              {!isEditing && loan.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(loan.id)}
                                    className="bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(loan.id)}
                                    className="bg-red-500/90 hover:bg-red-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Assign Lender (only when not editing) */}
                              {!isEditing &&
                                loan.status !== "Rejected" &&
                                !loan.lenderName &&
                                (loan.status === "Approved" ||
                                  loan.status === "Pending" ||
                                  loan.status === "Assigned") && (
                                  <button
                                    onClick={() => handleAssignLender(loan.id)}
                                    className="bg-sky-500/90 hover:bg-sky-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                  >
                                    Assign
                                  </button>
                                )}

                              {/* Edit / Save / Cancel */}
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveLoan(loan.id)}
                                    className="bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingLoanId(null)}
                                    className="bg-slate-700/90 hover:bg-slate-600 text-slate-50 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEditLoan(loan)}
                                  className="bg-slate-700/90 hover:bg-slate-600 text-slate-50 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                >
                                  Edit
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteLoan(loan.id)}
                                className="bg-red-500/90 hover:bg-red-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* User Management Section */}
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5 md:p-6 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-xl space-y-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 border border-slate-700/80 px-3 py-1 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                      Access Control
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-50">
                    Manage Users & Roles
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Add, edit or delete admins, lenders, borrowers, and
                    analysts.
                  </p>
                </div>
                <button
                  onClick={() => setShowUserForm(!showUserForm)}
                  className="bg-sky-500/90 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-full text-xs md:text-sm font-medium shadow-[0_0_18px_rgba(56,189,248,0.6)]"
                >
                  {showUserForm ? "Close" : "Add User"}
                </button>
              </div>

              {showUserForm && (
                <form
                  onSubmit={handleAddUser}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-4 grid md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="border border-slate-700 rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    className="border border-slate-700 rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Temporary password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    className="border border-slate-700 rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="border border-slate-700 rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="lender">Lender</option>
                    <option value="borrower">Borrower</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>

                  <div className="md:col-span-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      Users are stored in browser localStorage for demo only.
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-full text-[11px] md:text-xs font-semibold shadow-[0_0_18px_rgba(52,211,153,0.6)]"
                    >
                      Add User
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                <table className="w-full text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300">
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => {
                      const isEditing = editingUserId === u.id;
                      const isStriped = idx % 2 === 1;

                      return (
                        <tr
                          key={u.id}
                          className={`border-t border-slate-800 transition ${
                            isEditing
                              ? "bg-slate-900/90 ring-1 ring-sky-500/70"
                              : isStriped
                              ? "bg-slate-950/40 hover:bg-slate-900/70"
                              : "bg-slate-950/20 hover:bg-slate-900/70"
                          }`}
                        >
                          <td className="p-3 text-slate-100">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingUser.name}
                                onChange={(e) =>
                                  setEditingUser((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            ) : (
                              <span className="font-medium">{u.name}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-200">
                            {isEditing ? (
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) =>
                                  setEditingUser((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            ) : (
                              u.email
                            )}
                          </td>
                          <td className="p-3 capitalize text-slate-300">
                            {isEditing ? (
                              <select
                                value={editingUser.role}
                                onChange={(e) =>
                                  setEditingUser((prev) => ({
                                    ...prev,
                                    role: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              >
                                <option value="admin">Admin</option>
                                <option value="lender">Lender</option>
                                <option value="borrower">Borrower</option>
                                <option value="analyst">Analyst</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium ${
                                  u.role === "admin"
                                    ? "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30"
                                    : u.role === "lender"
                                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                                    : u.role === "analyst"
                                    ? "bg-sky-500/15 text-sky-200 border border-sky-400/30"
                                    : "bg-slate-500/15 text-slate-200 border border-slate-400/30"
                                }`}
                              >
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="p-3 space-x-1 md:space-x-2 whitespace-nowrap">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveUser(u.id)}
                                  className="bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="bg-slate-700/90 hover:bg-slate-600 text-slate-50 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditUser(u)}
                                className="bg-slate-700/90 hover:bg-slate-600 text-slate-50 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="bg-red-500/90 hover:bg-red-400 text-slate-950 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* SIDE PANEL: Loan + User Profile Details */}
          <LoanDetailsPanel
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Small Components ---------- */

function StatCard({ label, value, sub, accent, badge }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)] backdrop-blur-xl">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
          {label}
        </p>
        {badge && (
          <span className="rounded-full bg-slate-900/80 border border-slate-700/70 px-2 py-[2px] text-[10px] text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-xl md:text-2xl font-semibold text-slate-50 break-all">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-slate-500 mt-1 truncate" title={sub}>
          {sub}
        </p>
      )}
    </div>
  );
}

function LoanStatusPill({ status }) {
  const normalized = status || "Pending";

  const colorClass =
    normalized === "Approved"
      ? "bg-emerald-500/90 text-slate-950"
      : normalized === "Rejected"
      ? "bg-red-500/90 text-slate-950"
      : normalized === "Funds Disbursed"
      ? "bg-sky-500/90 text-slate-950"
      : normalized === "Completed"
      ? "bg-indigo-500/90 text-slate-950"
      : normalized === "Assigned"
      ? "bg-blue-500/90 text-slate-950"
      : "bg-amber-500/90 text-slate-950";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium ${colorClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-950/70" />
      {normalized}
    </span>
  );
}

/* ---------- Loan Details Side Panel (with User Profile) ---------- */

function LoanDetailsPanel({ loan, onClose }) {
  if (!loan) return null;

  const status = loan.status || "Pending";

  const steps =
    status === "Rejected"
      ? [
          { key: "created", label: "Request Created", active: true, done: true },
          { key: "rejected", label: "Rejected by Admin", active: true, done: true },
        ]
      : [
          { key: "created", label: "Request Created", active: true, done: true },
          {
            key: "approved",
            label: "Approved by Admin",
            active: ["Approved", "Assigned", "Funds Disbursed", "Completed"].includes(
              status
            ),
            done: ["Approved", "Assigned", "Funds Disbursed", "Completed"].includes(
              status
            ),
          },
          {
            key: "assigned",
            label: "Lender Assigned",
            active: ["Assigned", "Funds Disbursed", "Completed"].includes(status),
            done: ["Assigned", "Funds Disbursed", "Completed"].includes(status),
          },
          {
            key: "disbursed",
            label: "Funds Disbursed",
            active: ["Funds Disbursed", "Completed"].includes(status),
            done: ["Funds Disbursed", "Completed"].includes(status),
          },
          {
            key: "completed",
            label: "EMIs Completed",
            active: status === "Completed",
            done: status === "Completed",
          },
        ];

  const createdAt = loan.createdAt
    ? new Date(loan.createdAt).toLocaleString()
    : "N/A";
  const disbursedAt = loan.disbursedAt
    ? new Date(loan.disbursedAt).toLocaleString()
    : null;

  const totalEmis = loan.repayments?.length || 0;
  const paidEmis = loan.repayments?.filter((r) => r.paid).length || 0;
  const emiAmount =
    totalEmis > 0 ? Number(loan.repayments?.[0]?.amount || 0) : null;

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 right-0 z-40
        w-full sm:w-[22rem] md:w-[24rem] lg:w-[22rem]
        transform transition-transform duration-300
        lg:translate-x-0
        ${loan ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="h-full lg:h-auto bg-slate-950/95 border-l border-slate-800/80 lg:rounded-3xl lg:border lg:shadow-[0_0_40px_rgba(15,23,42,0.95)] backdrop-blur-xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">
              Loan & User Profile
            </p>
            <h3 className="text-lg font-semibold text-slate-50">
              {loan.borrowerName}
            </h3>
            <p className="text-[11px] text-slate-500">
              Loan ID:{" "}
              <span className="font-mono text-slate-300">
                {String(loan.id).slice(-8)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {/* Amount & summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">
                Principal
              </p>
              <p className="text-xl font-semibold text-sky-300">
                ₹{Number(loan.amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <p>Duration: {loan.duration} months</p>
              <p className="truncate">
                Purpose:{" "}
                <span className="text-slate-200">{loan.purpose || "-"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Created: {createdAt}</span>
            {disbursedAt && <span>Disbursed: {disbursedAt}</span>}
          </div>
        </div>

        {/* 🔹 Borrower Profile (Aadhar, PAN, Address) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] space-y-2">
          <p className="text-slate-400 uppercase tracking-[0.16em]">
            Borrower Profile
          </p>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Aadhar Number</span>
              <span className="text-slate-100 font-mono">
                {loan.aadhar || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">PAN Number</span>
              <span className="text-slate-100 font-mono uppercase">
                {loan.pan || "Not provided"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-slate-500 block mb-1">Address</span>
              <p className="text-slate-100 text-[11px] whitespace-pre-line max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                {loan.address || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* EMI summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between text-[11px]">
          <div>
            <p className="text-slate-400 uppercase tracking-[0.16em]">
              EMI Status
            </p>
            <p className="text-slate-200 mt-1">
              {paidEmis} / {totalEmis || 0} EMIs paid
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 uppercase tracking-[0.16em]">
              Per EMI
            </p>
            <p className="text-emerald-300 mt-1">
              {emiAmount ? `₹${emiAmount.toFixed(2)}` : "N/A"}
            </p>
          </div>
        </div>

        {/* Lender info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] space-y-1">
          <p className="text-slate-400 uppercase tracking-[0.16em]">
            Lender
          </p>
          {loan.lenderName ? (
            <>
              <p className="text-slate-100 text-sm">{loan.lenderName}</p>
              <p className="text-slate-500">
                Lender ID:{" "}
                <span className="font-mono">
                  {loan.lenderId || "N/A"}
                </span>
              </p>
            </>
          ) : (
            <p className="text-slate-500">No lender assigned yet.</p>
          )}
          <div className="mt-1">
            <span className="text-slate-400 mr-1">Status:</span>
            <LoanStatusPill status={status} />
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em] mb-2">
            Activity Timeline
          </p>
          <ol className="relative ml-3 border-l border-slate-700/70 space-y-2">
            {steps.map((step, index) => (
              <li key={step.key} className="pl-3">
                <div className="absolute -left-1.5 mt-[3px] flex h-3 w-3 items-center justify-center">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      step.done
                        ? "bg-emerald-400"
                        : step.active
                        ? "bg-sky-400"
                        : "bg-slate-600"
                    }`}
                  />
                </div>
                <p
                  className={`text-[11px] ${
                    step.done
                      ? "text-emerald-200"
                      : step.active
                      ? "text-sky-200"
                      : "text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
                {index === 0 && loan.createdAt && (
                  <p className="text-[10px] text-slate-500">
                    {new Date(loan.createdAt).toLocaleString()}
                  </p>
                )}
                {step.key === "disbursed" && disbursedAt && (
                  <p className="text-[10px] text-slate-500">{disbursedAt}</p>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[11px]">
          <p className="text-slate-400 uppercase tracking-[0.16em] mb-1">
            Notes
          </p>
          <p className="text-slate-300">
            Purpose:{" "}
            <span className="text-slate-100 font-medium">
              {loan.purpose || "Not specified"}
            </span>
          </p>
          <p className="text-slate-500 mt-1">
            This panel is read-only for now. Use the table actions to update
            status, assign lenders, or edit the core loan fields.
          </p>
        </div>
      </div>
    </aside>
  );
}
