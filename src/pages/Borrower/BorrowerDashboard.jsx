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

// 🔹 Added aadhar, pan, address here
const initialLoanForm = {
  amount: "",
  duration: "",
  purpose: "",
  aadhar: "",
  pan: "",
  address: "",
};

export default function BorrowerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loanData, setLoanData] = useState(initialLoanForm);
  const [isLoading, setIsLoading] = useState(true);

  // ---------- Helpers ----------
  const generateEMISchedule = (amount, duration) => {
    const principal = Number(amount) || 0;
    const months = Number(duration) || 1;
    const perMonth = (principal / months).toFixed(2);
    return Array.from({ length: months }, (_, i) => ({
      month: `Month ${i + 1}`,
      amount: perMonth,
      paid: false,
    }));
  };

  // Sync borrower loans + global loans in localStorage
  const updateLoans = (updatedBorrowerLoans) => {
    setLoans(updatedBorrowerLoans);

    const allLoans = safeParseJSON("loans", []);
    const merged = allLoans.map((loan) =>
      loan.borrowerId === user?.id
        ? updatedBorrowerLoans.find((l) => l.id === loan.id) || loan
        : loan
    );

    const newOnes = updatedBorrowerLoans.filter(
      (bLoan) => !merged.some((loan) => loan.id === bLoan.id)
    );
    const finalList = [...merged, ...newOnes];

    localStorage.setItem("loans", JSON.stringify(finalList));
  };

  // ---------- Initial load ----------
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
      (loan) => loan.borrowerId === loggedInUser.id
    );
    setLoans(myLoans);
    setIsLoading(false);
  }, [navigate]);

  // ---------- Ensure EMIs exist for active loans ----------
  useEffect(() => {
    if (!user || loans.length === 0) return;

    const updated = loans.map((loan) => {
      const isActiveStatus =
        loan.status === "Approved" || loan.status === "Funds Disbursed";

      if (
        isActiveStatus &&
        (!loan.repayments || loan.repayments.length === 0)
      ) {
        return {
          ...loan,
          repayments: generateEMISchedule(loan.amount, loan.duration),
        };
      }
      return loan;
    });

    const hasChanges = updated.some((loan, idx) => loan !== loans[idx]);
    if (hasChanges) updateLoans(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, user]);

  // ---------- Derived stats ----------
  const stats = useMemo(() => {
    const totalBorrowed = loans.reduce(
      (sum, l) => sum + Number(l.amount || 0),
      0
    );
    const totalPaid = loans.reduce((sum, l) => {
      if (!l.repayments) return sum;
      return (
        sum +
        l.repayments
          .filter((r) => r.paid)
          .reduce((s, r) => s + Number(r.amount || 0), 0)
      );
    }, 0);
    const totalOutstanding = Math.max(totalBorrowed - totalPaid, 0);

    const totalEmiCount = loans.reduce(
      (sum, l) => sum + (l.repayments?.length || 0),
      0
    );
    const paidEmiCount = loans.reduce(
      (sum, l) => sum + (l.repayments?.filter((r) => r.paid).length || 0),
      0
    );

    return {
      totalBorrowed,
      totalOutstanding,
      paidEmiCount,
      totalEmiCount,
    };
  }, [loans]);

  // ---------- Handlers ----------
  const handleRequestLoan = (e) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = Number(loanData.amount);
    const durationNum = Number(loanData.duration);

    if (amountNum <= 0 || durationNum <= 0) {
      toast.error("Amount and duration must be positive.");
      return;
    }

    // Basic presence validation for new fields
    if (!loanData.aadhar.trim()) {
      toast.error("Please enter your Aadhar number.");
      return;
    }
    if (!loanData.pan.trim()) {
      toast.error("Please enter your PAN number.");
      return;
    }
    if (!loanData.address.trim()) {
      toast.error("Please enter your address.");
      return;
    }

    const newLoan = {
      id: Date.now(),
      borrowerId: user.id,
      borrowerName: user.name,
      amount: amountNum,
      duration: durationNum,
      purpose: loanData.purpose.trim(),
      // 🔹 Store new fields on loan
      aadhar: loanData.aadhar.trim(),
      pan: loanData.pan.trim(),
      address: loanData.address.trim(),
      status: "Pending",
      lenderId: null,
      lenderName: null,
      repayments: [],
      createdAt: new Date().toISOString(),
    };

    const updatedLoans = [...loans, newLoan];
    updateLoans(updatedLoans);

    toast.success("Loan request submitted!");
    setLoanData(initialLoanForm);
    setShowForm(false);
  };

  const handleRepayment = (loanId, index) => {
    const updatedLoans = loans.map((loan) => {
      if (loan.id !== loanId) return loan;

      const repayments = loan.repayments ? [...loan.repayments] : [];
      if (!repayments[index] || repayments[index].paid) return loan;

      repayments[index] = { ...repayments[index], paid: true };

      const allPaid = repayments.every((r) => r.paid);
      return {
        ...loan,
        repayments,
        status: allPaid ? "Completed" : loan.status,
      };
    });

    updateLoans(updatedLoans);
    toast.success("EMI paid successfully ✅");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // ---------- Render ----------
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
      {/* Background glows (match login style) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_45%,_#000_100%)] opacity-80" />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-400 to-cyan-500 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.6)]">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-950 uppercase">
                BR
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                loanSys
              </p>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-sky-300 to-teal-200 bg-clip-text text-transparent">
                Borrower Dashboard
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Borrowed"
            value={`₹${stats.totalBorrowed.toFixed(2)}`}
            accent="from-emerald-400 to-emerald-500"
          />
          <StatCard
            label="Outstanding Amount"
            value={`₹${stats.totalOutstanding.toFixed(2)}`}
            accent="from-amber-400 to-orange-500"
          />
          <StatCard
            label="EMIs Paid"
            value={`${stats.paidEmiCount} / ${stats.totalEmiCount || 0}`}
            accent="from-sky-400 to-blue-500"
          />
        </section>

        {/* Loan Request + Table */}
        <section className="mb-6 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-50 flex items-center gap-2">
              My Loans
              <span className="text-[11px] font-normal text-slate-500">
                View your requests & status
              </span>
            </h2>
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-4 py-1.5 text-xs md:text-sm font-medium text-emerald-100 hover:bg-emerald-500/25 transition"
            >
              {showForm ? "Close" : "Request New Loan"}
            </button>
          </div>

          {showForm && (
            <LoanForm
              loanData={loanData}
              setLoanData={setLoanData}
              onSubmit={handleRequestLoan}
            />
          )}

          <LoanTable loans={loans} />
        </section>

        {/* Repayment Tracker */}
        {loans.some(
          (loan) =>
            loan.status === "Approved" ||
            loan.status === "Funds Disbursed" ||
            loan.status === "Completed"
        ) && (
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <h2 className="text-lg md:text-xl font-semibold text-slate-50 mb-2">
              Repayment Tracker
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Track your active EMIs and mark payments as completed.
            </p>
            <RepaymentTracker loans={loans} onRepayment={handleRepayment} />
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- Small Components ----------

function StatCard({ label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.85)] backdrop-blur-xl">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl`}
      />
      <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-2 text-xl md:text-2xl font-semibold text-slate-50">
        {value}
      </p>
    </div>
  );
}

// 🔹 UPDATED: LoanForm now has Aadhar, PAN, Address
function LoanForm({ loanData, setLoanData, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Loan Amount
          </label>
          <input
            type="number"
            min="1"
            placeholder="Enter amount"
            value={loanData.amount}
            onChange={(e) =>
              setLoanData((prev) => ({ ...prev, amount: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Duration (months)
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 12"
            value={loanData.duration}
            onChange={(e) =>
              setLoanData((prev) => ({ ...prev, duration: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Purpose
          </label>
          <input
            type="text"
            placeholder="e.g. Education, Business..."
            value={loanData.purpose}
            onChange={(e) =>
              setLoanData((prev) => ({ ...prev, purpose: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* NEW ROW: Aadhar + PAN */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Aadhar Number
          </label>
          <input
            type="text"
            placeholder="Enter Aadhar number"
            value={loanData.aadhar}
            onChange={(e) =>
              setLoanData((prev) => ({ ...prev, aadhar: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            PAN Number
          </label>
          <input
            type="text"
            placeholder="Enter PAN number"
            value={loanData.pan}
            onChange={(e) =>
              setLoanData((prev) => ({ ...prev, pan: e.target.value }))
            }
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
          />
        </div>
      </div>

      {/* NEW: Address */}
      <div className="mt-3">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Address
        </label>
        <textarea
          rows={3}
          placeholder="Enter your full residential address"
          value={loanData.address}
          onChange={(e) =>
            setLoanData((prev) => ({ ...prev, address: e.target.value }))
          }
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-xs md:text-sm font-semibold text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.75)] transition"
        >
          Submit Loan Request
        </button>
      </div>
    </form>
  );
}

function LoanTable({ loans }) {
  if (!loans || loans.length === 0) {
    return (
      <p className="text-slate-500 text-center text-sm">
        You haven’t requested any loans yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
      <table className="w-full border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-slate-900/80 text-slate-300">
            <th className="p-2.5 text-left">Amount</th>
            <th className="p-2.5 text-left">Duration</th>
            <th className="p-2.5 text-left">Purpose</th>
            <th className="p-2.5 text-left">Status</th>
            <th className="p-2.5 text-left">Lender</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr
              key={loan.id}
              className="border-t border-slate-800 hover:bg-slate-900/70 transition"
            >
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
                    loan.status === "Approved"
                      ? "bg-emerald-500/90"
                      : loan.status === "Rejected"
                      ? "bg-red-500/90"
                      : loan.status === "Completed"
                      ? "bg-blue-500/90"
                      : loan.status === "Funds Disbursed"
                      ? "bg-teal-500/90"
                      : "bg-amber-500/90"
                  }`}
                >
                  {loan.status}
                </span>
              </td>
              <td className="p-2.5">
                {loan.lenderName ? (
                  <span className="text-slate-200 text-xs md:text-sm">
                    {loan.lenderName}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">
                    Not assigned yet
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RepaymentTracker({ loans, onRepayment }) {
  const repayableLoans = loans.filter(
    (loan) =>
      loan.status === "Approved" ||
      loan.status === "Funds Disbursed" ||
      loan.status === "Completed"
  );

  if (repayableLoans.length === 0) return null;

  return (
    <>
      {repayableLoans.map((loan) => (
        <div
          key={loan.id}
          className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
        >
          <h3 className="text-sm md:text-lg font-semibold mb-2 text-slate-50">
            Loan ₹{loan.amount} ({loan.duration} months){" "}
            <span className="text-[11px] md:text-xs font-normal text-slate-400">
              – {loan.status}
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-900/70 text-slate-300">
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments?.map((emi, index) => (
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
                    <td className="p-2">
                      {!emi.paid && loan.status !== "Completed" && (
                        <button
                          onClick={() => onRepayment(loan.id, index)}
                          className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] font-medium text-slate-950 hover:bg-sky-400 transition"
                        >
                          Pay EMI
                        </button>
                      )}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-2 text-center text-slate-500 text-sm"
                    >
                      No repayment schedule available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
