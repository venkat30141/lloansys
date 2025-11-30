import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function safeParseJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(data) ? fallback : data;
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`, err);
    return fallback;
  }
}

export default function LenderDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignedLoans, setAssignedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // -------- Initial load --------
  useEffect(() => {
    const loggedInUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();

    if (!loggedInUser) {
      navigate("/");
      return;
    }

    setUser(loggedInUser);

    const allLoans = safeParseJSON("loans", []);
    const myLoans = allLoans.filter(
      (loan) => loan.lenderId === loggedInUser.id
    );
    setAssignedLoans(myLoans);
    setIsLoading(false);
  }, [navigate]);

  // -------- Sync updates back to localStorage --------
  const updateLoans = (updatedLoans) => {
    setAssignedLoans(updatedLoans);

    const allLoans = safeParseJSON("loans", []);
    const merged = allLoans.map((loan) =>
      loan.lenderId === user?.id
        ? updatedLoans.find((l) => l.id === loan.id) || loan
        : loan
    );

    // include any newly added loans that didn't exist globally yet (safety)
    const newOnes = updatedLoans.filter(
      (l) => !merged.some((loan) => loan.id === l.id)
    );

    const finalList = [...merged, ...newOnes];
    localStorage.setItem("loans", JSON.stringify(finalList));
  };

  // -------- Derived stats (for header cards) --------
  const stats = useMemo(() => {
    const totalAssigned = assignedLoans.length;

    const totalPrincipal = assignedLoans.reduce(
      (sum, l) => sum + Number(l.amount || 0),
      0
    );

    const totalDisbursed = assignedLoans
      .filter(
        (l) =>
          l.status === "Funds Disbursed" ||
          l.status === "Completed" ||
          l.status === "Approved"
      )
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const totalExpected = assignedLoans.reduce((sum, l) => {
      if (!l.repayments) return sum;
      return (
        sum +
        l.repayments.reduce((s, r) => s + Number(r.amount || 0), 0)
      );
    }, 0);

    const totalReceived = assignedLoans.reduce((sum, l) => {
      if (!l.repayments) return sum;
      return (
        sum +
        l.repayments
          .filter((r) => r.paid)
          .reduce((s, r) => s + Number(r.amount || 0), 0)
      );
    }, 0);

    const pendingCollection = Math.max(totalExpected - totalReceived, 0);

    return {
      totalAssigned,
      totalPrincipal,
      totalDisbursed,
      totalExpected,
      totalReceived,
      pendingCollection,
    };
  }, [assignedLoans]);

  // -------- Handlers --------
  const handleDisburse = (loanId) => {
    const updated = assignedLoans.map((loan) => {
      if (loan.id !== loanId) return loan;

      // Only change if not already disbursed
      if (loan.status === "Funds Disbursed") return loan;

      return {
        ...loan,
        status: "Funds Disbursed",
        disbursedAt: new Date().toISOString(),
      };
    });

    updateLoans(updated);
    toast.success("Funds marked as disbursed!");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // -------- Render states --------
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-pulse text-slate-500 text-lg">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_45%,_#000_100%)] opacity-80" />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.7)]">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-950 uppercase">
                LN
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                loanSys
              </p>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Lender Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Welcome back,{" "}
                <span className="font-semibold text-slate-100">
                  {user.name}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-red-500/10 px-4 py-2 text-xs md:text-sm font-medium text-red-100 hover:bg-red-500/20 hover:border-red-400 transition"
          >
            Logout
          </button>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Assigned Loans"
            value={stats.totalAssigned.toString()}
            accent="from-sky-400 to-sky-500"
          />
          <StatCard
            label="Total Principal"
            value={`₹${stats.totalPrincipal.toFixed(2)}`}
            accent="from-indigo-400 to-indigo-500"
          />
          <StatCard
            label="EMI Received"
            value={`₹${stats.totalReceived.toFixed(2)}`}
            accent="from-emerald-400 to-emerald-500"
          />
          <StatCard
            label="Pending Collection"
            value={`₹${stats.pendingCollection.toFixed(2)}`}
            accent="from-amber-400 to-orange-500"
          />
        </section>

        {/* Assigned Loans */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-50">
              Assigned Loans
            </h2>
            <p className="text-[11px] text-slate-500">
              Disburse approved loans and monitor repayment progress.
            </p>
          </div>

          <AssignedLoanTable loans={assignedLoans} onDisburse={handleDisburse} />
        </section>

        {/* Repayments */}
        {assignedLoans.some(
          (loan) => loan.repayments && loan.repayments.length
        ) && (
          <section className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <h2 className="text-lg md:text-xl font-semibold text-slate-50 mb-2">
              Borrower Repayments
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Track EMI payments across all loans you've funded.
            </p>
            <RepaymentOverview loans={assignedLoans} />
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Small Components (styled to match Borrower/Login) ---------- */

function StatCard({ label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.85)] backdrop-blur-xl">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl`}
      />
      <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-2 text-xl md:text-2xl font-semibold text-slate-50 break-all">
        {value}
      </p>
    </div>
  );
}

function AssignedLoanTable({ loans, onDisburse }) {
  if (!loans || loans.length === 0) {
    return (
      <p className="text-slate-500 text-center text-sm">
        No assigned loans yet.
      </p>
    );
  }

  const getRepaymentSummary = (loan) => {
    const totalEmis = loan.repayments?.length || 0;
    const paidEmis = loan.repayments?.filter((r) => r.paid).length || 0;

    if (totalEmis === 0) {
      return <span className="text-slate-500 text-xs">Not started</span>;
    }

    return (
      <span className="text-xs md:text-sm text-slate-200">
        {paidEmis} / {totalEmis} EMIs paid
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
      <table className="w-full border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-slate-900/80 text-slate-300">
            <th className="p-2.5 text-left">Borrower</th>
            <th className="p-2.5 text-left">Amount</th>
            <th className="p-2.5 text-left">Duration</th>
            <th className="p-2.5 text-left">Purpose</th>
            <th className="p-2.5 text-left">Status</th>
            <th className="p-2.5 text-left">Repayment</th>
            <th className="p-2.5 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr
              key={loan.id}
              className="border-t border-slate-800 hover:bg-slate-900/70 transition"
            >
              <td className="p-2.5 whitespace-nowrap text-slate-100">
                {loan.borrowerName}
              </td>
              <td className="p-2.5 whitespace-nowrap text-slate-100">
                ₹{loan.amount}
              </td>
              <td className="p-2.5 text-slate-200">
                {loan.duration} months
              </td>
              <td className="p-2.5 text-slate-300">{loan.purpose}</td>
              <td className="p-2.5">
                <span
                  className={`px-2 py-1 rounded-full text-[11px] font-medium text-white ${
                    loan.status === "Completed"
                      ? "bg-emerald-500/90"
                      : loan.status === "Funds Disbursed"
                      ? "bg-sky-500/90"
                      : loan.status === "Approved"
                      ? "bg-blue-500/90"
                      : loan.status === "Rejected"
                      ? "bg-red-500/90"
                      : "bg-amber-500/90"
                  }`}
                >
                  {loan.status}
                </span>
              </td>
              <td className="p-2.5">{getRepaymentSummary(loan)}</td>
              <td className="p-2.5">
                {loan.status !== "Funds Disbursed" &&
                  loan.status !== "Completed" &&
                  loan.status !== "Rejected" && (
                    <button
                      onClick={() => onDisburse(loan.id)}
                      className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] md:text-xs font-medium text-slate-950 hover:bg-sky-400 transition"
                    >
                      Mark Disbursed
                    </button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RepaymentOverview({ loans }) {
  const loansWithRepayments = loans.filter(
    (loan) => loan.repayments && loan.repayments.length > 0
  );

  if (loansWithRepayments.length === 0) {
    return (
      <p className="text-slate-500 text-center text-sm">
        No repayment data available yet.
      </p>
    );
  }

  return (
    <>
      {loansWithRepayments.map((loan) => (
        <div
          key={loan.id}
          className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
        >
          <h3 className="text-sm md:text-lg font-semibold mb-2 text-slate-50">
            {loan.borrowerName} — ₹{loan.amount}{" "}
            <span className="text-[11px] md:text-xs font-normal text-slate-400">
              ({loan.duration} months · {loan.status})
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-900/70 text-slate-300">
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments.map((emi, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-800 hover:bg-slate-900/60 transition"
                  >
                    <td className="p-2 text-slate-100">{emi.month}</td>
                    <td className="p-2 text-slate-100">₹{emi.amount}</td>
                    <td className="p-2">
                      {emi.paid ? (
                        <span className="text-emerald-400 font-semibold text-xs">
                          Paid
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold text-xs">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
