import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

// Safe parser
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

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ------- Initial Load -------
  useEffect(() => {
    const user = safeParseJSON("user", null);
    if (!user || user.role !== "analyst") {
      navigate("/");
      return;
    }

    const storedLoans = safeParseJSON("loans", []);
    setLoans(storedLoans);
    setIsLoading(false);
  }, [navigate]);

  // ------- Derived Metrics -------
  const {
    totalDisbursed,
    totalRepaid,
    totalLoans,
    activeLoans,
    completedLoans,
    rejectedLoans,
    pendingLoans,
  } = useMemo(() => {
    const totalLoans = loans.length;

    const totalDisbursed = loans
      .filter((l) => l.status === "Funds Disbursed" || l.status === "Completed")
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const totalRepaid = loans.reduce((sum, l) => {
      if (!l.repayments) return sum;
      const paid = l.repayments
        .filter((r) => r.paid)
        .reduce((s, r) => s + Number(r.amount || 0), 0);
      return sum + paid;
    }, 0);

    const pendingLoans = loans.filter((l) => l.status === "Pending").length;
    const approvedLoans = loans.filter((l) => l.status === "Approved").length;
    const disbursedLoans = loans.filter(
      (l) => l.status === "Funds Disbursed"
    ).length;
    const completedLoans = loans.filter((l) => l.status === "Completed").length;
    const rejectedLoans = loans.filter((l) => l.status === "Rejected").length;

    const activeLoans = approvedLoans + disbursedLoans;

    return {
      totalDisbursed,
      totalRepaid,
      totalLoans,
      activeLoans,
      completedLoans,
      rejectedLoans,
      pendingLoans,
    };
  }, [loans]);

  // ------- Chart Data -------
  const statusData = [
    { name: "Pending", value: pendingLoans },
    { name: "Approved / Active", value: activeLoans },
    {
      name: "Funds Disbursed",
      value: loans.filter((l) => l.status === "Funds Disbursed").length,
    },
    { name: "Completed", value: completedLoans },
    { name: "Rejected", value: rejectedLoans },
  ];

  const COLORS = ["#FACC15", "#22C55E", "#0EA5E9", "#6366F1", "#EF4444"];

  // aggregate loan amount per borrower
  const borrowerData = useMemo(() => {
    const map = new Map();
    for (const l of loans) {
      const key = l.borrowerName || "Unknown";
      const current = map.get(key) || 0;
      map.set(key, current + Number(l.amount || 0));
    }
    return Array.from(map.entries()).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [loans]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // ------- Loading -------
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-pulse text-slate-500 text-lg">
          Loading analyst dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glows (match login style) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 -left-24 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_45%,_#000_100%)] opacity-80" />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 via-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_45px_rgba(56,189,248,0.8)]">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-950 uppercase">
                AN
              </span>
              <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  loanSys
                </p>
                <span className="rounded-full bg-sky-500/10 border border-sky-400/40 px-2 py-[2px] text-[10px] font-medium text-sky-200">
                  Analyst
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Analyst Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Deep-dive into portfolio health, repayments and loan status
                trends.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-[10px] text-slate-500">
              <span>Environment: Demo (localStorage)</span>
              <span>Role: Analyst</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-red-500/10 px-4 py-2 text-xs md:text-sm font-medium text-red-100 hover:bg-red-500/20 hover:border-red-400 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Loans"
            value={totalLoans.toString()}
            sub="Overall portfolio size"
            accent="from-sky-400 to-sky-500"
          />
          <StatCard
            label="Active Loans"
            value={activeLoans.toString()}
            sub="Approved · Running"
            accent="from-emerald-400 to-emerald-500"
          />
          <StatCard
            label="Total Disbursed"
            value={`₹${totalDisbursed.toFixed(2)}`}
            sub="Principal released"
            accent="from-cyan-400 to-teal-500"
          />
          <StatCard
            label="Total Repaid"
            value={`₹${totalRepaid.toFixed(2)}`}
            sub="EMIs collected"
            accent="from-violet-400 to-fuchsia-500"
          />
        </section>

        {/* Charts + right panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Charts (take 2 columns on xl) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Pie Chart Card */}
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5 md:p-6 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-50">
                    Loan Status Distribution
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Visual breakdown of loans across different lifecycle stages.
                  </p>
                </div>
                <span className="hidden md:inline-flex items-center rounded-full bg-slate-950/70 border border-slate-700/70 px-3 py-1 text-[10px] text-slate-400">
                  Updated from localStorage
                </span>
              </div>
              <div className="h-72 md:h-80">
                {totalLoans === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No loan data available to visualize.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="#020617"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #1e293b",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                          color: "#e5e7eb",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Bar Chart Card */}
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-5 md:p-6 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-50">
                    Loan Amount by Borrower
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Aggregated disbursed amounts per borrower.
                  </p>
                </div>
              </div>
              <div className="h-72 md:h-80">
                {borrowerData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No borrower data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={borrowerData} barSize={28}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#cbd5f5" }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#cbd5f5" }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        formatter={(value) => [`₹${value}`, "Amount"]}
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #1e293b",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                          color: "#e5e7eb",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        name="Amount (₹)"
                        radius={[8, 8, 0, 0]}
                        fill="#38bdf8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* Right column: quick insights / KPI panel */}
          <aside className="space-y-4">
            {/* Health Card */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em] mb-2">
                Portfolio Snapshot
              </p>
              <div className="space-y-2 text-[12px]">
                <InsightRow
                  label="Completion Ratio"
                  value={
                    totalLoans > 0
                      ? `${((completedLoans / totalLoans) * 100).toFixed(1)}%`
                      : "N/A"
                  }
                  hint={`${completedLoans} of ${totalLoans} loans completed`}
                />
                <InsightRow
                  label="Rejection Rate"
                  value={
                    totalLoans > 0
                      ? `${((rejectedLoans / totalLoans) * 100).toFixed(1)}%`
                      : "N/A"
                  }
                  hint={`${rejectedLoans} loans rejected`}
                />
                <InsightRow
                  label="Pending Queue"
                  value={pendingLoans.toString()}
                  hint="Awaiting admin approval"
                />
                <InsightRow
                  label="Recovery Efficiency"
                  value={
                    totalDisbursed > 0
                      ? `${((totalRepaid / totalDisbursed) * 100).toFixed(1)}%`
                      : "N/A"
                  }
                  hint="Repaid vs disbursed"
                />
              </div>
            </div>

            {/* Raw counts mini tiles */}
            <div className="grid grid-cols-2 gap-3">
              <MiniTile
                label="Completed"
                value={completedLoans}
                accent="from-indigo-500 to-violet-500"
              />
              <MiniTile
                label="Rejected"
                value={rejectedLoans}
                accent="from-rose-500 to-red-500"
              />
              <MiniTile
                label="Pending"
                value={pendingLoans}
                accent="from-amber-400 to-orange-500"
              />
              <MiniTile
                label="Active"
                value={activeLoans}
                accent="from-emerald-400 to-teal-500"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* -------- Small UI Components -------- */

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.9)] backdrop-blur-xl">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`}
      />
      <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
        {label}
      </p>
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

function InsightRow({ label, value, hint }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <p className="text-slate-300 text-[11px]">{label}</p>
        {hint && <p className="text-slate-500 text-[10px]">{hint}</p>}
      </div>
      <p className="font-semibold text-sky-200 text-[12px]">{value}</p>
    </div>
  );
}

function MiniTile({ label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`}
      />
      <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}
