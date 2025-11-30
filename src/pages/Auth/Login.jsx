import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "borrower",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUsers = () => safeParseJSON("users", []);
  const saveUsers = (users) =>
    localStorage.setItem("users", JSON.stringify(users));

  // If already logged in, redirect to their dashboard
  useEffect(() => {
    try {
      const logged = JSON.parse(localStorage.getItem("user"));
      if (logged?.role) {
        switch (logged.role) {
          case "admin":
            navigate("/admin");
            break;
          case "lender":
            navigate("/lender");
            break;
          case "borrower":
            navigate("/borrower");
            break;
          case "analyst":
            navigate("/analyst");
            break;
          default:
            break;
        }
      }
    } catch {
      // ignore malformed user
    }
  }, [navigate]);

  const resetForm = (nextMode) => {
    setMode(nextMode);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "borrower",
    });
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  // ---------- Registration ----------
  const handleRegister = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!name) {
      toast.error("Please enter your full name.");
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setIsSubmitting(false);
      return;
    }

    const validRoles = ["admin", "lender", "borrower", "analyst"];
    const role = validRoles.includes(form.role) ? form.role : "borrower";

    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      toast.error("User already exists with this email.");
      setIsSubmitting(false);
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    toast.success("User registered successfully! Please login.");
    resetForm("login");
    setIsSubmitting(false);
  };

  // ---------- Login ----------
  const handleLogin = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      setIsSubmitting(false);
      return;
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email && u.password === password
    );

    if (!user) {
      toast.error("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    toast.success(`Welcome ${user.name}!`);

    switch (user.role) {
      case "admin":
        navigate("/admin");
        break;
      case "lender":
        navigate("/lender");
        break;
      case "borrower":
        navigate("/borrower");
        break;
      case "analyst":
        navigate("/analyst");
        break;
      default:
        navigate("/");
    }

    setIsSubmitting(false);
  };

  const onChangeField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = mode === "login" ? handleLogin : handleRegister;

  // ---------- Footer button popup handler ----------
  const handleFooterClick = (type) => {
    if (type === "terms") {
      toast("Terms & Conditions are for demo only in this loanSys prototype.", {
        icon: "📄",
      });
    } else if (type === "privacy") {
      toast("Privacy Policy: your data is stored only in browser localStorage.", {
        icon: "🔐",
      });
    } else if (type === "support") {
      toast("Support: contact your developer or project mentor for help. 😊", {
        icon: "🛠️",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#020617_100%)] opacity-80" />
      </div>

      {/* Page content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4">
        {/* HERO + AUTH */}
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center pt-10 pb-12">
          {/* Left Branding / Hero */}
          <div className="hidden lg:flex flex-col gap-6 pr-4 border-r border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                <span className="text-xs font-semibold tracking-widest text-slate-950 uppercase">
                  LS
                </span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  loanSys
                </p>
                <p className="text-[11px] text-slate-500">
                  Smart Loan Management Platform
                </p>
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
                Manage loans in real-time with loanSys.
              </h1>
              <p className="mt-3 text-sm text-slate-400 max-w-md">
                A unified space for{" "}
                <span className="text-sky-300">admins</span>,{" "}
                <span className="text-emerald-300">lenders</span>,{" "}
                <span className="text-indigo-300">borrowers</span>, and{" "}
                <span className="text-fuchsia-300">analysts</span> to monitor
                approvals, disbursals, and EMIs seamlessly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sky-100/90">
                • Real-time dashboards
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-100/90">
                • Role-based access
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-100/90">
                • EMI tracking
              </span>
            </div>

            <div className="mt-2 border-t border-slate-800/60 pt-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-2">
                Quick Roles
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <p className="font-semibold text-sky-300">Admin</p>
                  <p className="text-slate-400 text-[11px]">
                    Approve loans, assign lenders, manage users.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <p className="font-semibold text-emerald-300">Lender</p>
                  <p className="text-slate-400 text-[11px]">
                    Disburse funds and track repayments.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <p className="font-semibold text-indigo-300">Borrower</p>
                  <p className="text-slate-400 text-[11px]">
                    Request loans, pay EMIs on time.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <p className="font-semibold text-fuchsia-300">Analyst</p>
                  <p className="text-slate-400 text-[11px]">
                    Analyze trends and portfolio performance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="w-full">
            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 md:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.8)] backdrop-blur-xl">
              <div className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-sky-500/80 to-transparent" />

              {/* Main App Heading (for mobile / card context) */}
              <div className="mb-5 text-center lg:hidden">
                <h1 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-sky-400 via-blue-300 to-emerald-300 text-transparent bg-clip-text">
                  Welcome to loanSys
                </h1>
                <p className="text-[11px] text-slate-400">
                  Smart Loan Management System – Borrow • Lend • Track
                </p>
              </div>

              {/* Tabs */}
              <div className="flex mb-6 bg-slate-900/80 border border-slate-700 rounded-full p-1 text-xs">
                <button
                  className={`flex-1 py-2 font-medium rounded-full transition-all duration-200 ${
                    mode === "login"
                      ? "bg-slate-800 text-sky-300 shadow-inner shadow-slate-950/60"
                      : "text-slate-400 hover:text-sky-300"
                  }`}
                  onClick={() => resetForm("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`flex-1 py-2 font-medium rounded-full transition-all duration-200 ${
                    mode === "register"
                      ? "bg-slate-800 text-sky-300 shadow-inner shadow-slate-950/60"
                      : "text-slate-400 hover:text-sky-300"
                  }`}
                  onClick={() => resetForm("register")}
                  type="button"
                >
                  Register
                </button>
              </div>

              <h2 className="text-xl font-semibold text-slate-50 mb-1 text-center">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-center text-[11px] text-slate-500 mb-6">
                {mode === "login"
                  ? "Sign in with your registered email and password."
                  : "Register once and choose a role to continue using loanSys."}
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Venkat Sharma"
                      value={form.name}
                      onChange={(e) => onChangeField("name", e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => onChangeField("email", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        mode === "register"
                          ? "At least 6 characters"
                          : "Enter your password"
                      }
                      value={form.password}
                      onChange={(e) => onChangeField("password", e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 pr-16 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-2 flex items-center text-[11px] text-sky-400 hover:text-sky-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {mode === "register" && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Use a password that is easy for you to remember, but hard
                      to guess.
                    </p>
                  )}
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => onChangeField("role", e.target.value)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="lender">Lender</option>
                      <option value="borrower">Borrower</option>
                      <option value="analyst">Analyst</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-sky-500/60 bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 bg-size-200 bg-pos-0 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(56,189,248,0.45)] transition-all duration-200 hover:bg-pos-100 hover:shadow-[0_18px_60px_rgba(56,189,248,0.60)] ${
                    isSubmitting
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {isSubmitting
                    ? mode === "login"
                      ? "Logging in..."
                      : "Registering..."
                    : mode === "login"
                    ? "Login to loanSys"
                    : "Register on loanSys"}
                </button>
              </form>

              <p className="text-center text-[10px] text-slate-500 mt-4">
                Using browser localStorage for demo authentication only. Do not
                use real passwords.
              </p>
            </div>
          </div>
        </div>

        {/* EXPLORATION / ROLES SECTION */}
        <section className="w-full max-w-5xl mb-12 space-y-10">
          {/* Role Exploration */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-1">
                  Explore Roles
                </p>
                <h2 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-sky-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  Who uses loanSys?
                </h2>
                <p className="text-[11px] md:text-sm text-slate-400 mt-1 max-w-xl">
                  loanSys is built for end-to-end loan management. Each role has
                  a dedicated dashboard and responsibilities.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-950/60 border border-slate-700/70 px-3 py-1 text-[10px] text-slate-400">
                Borrow • Lend • Analyze • Approve
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
              {/* Admin */}
              <div className="rounded-2xl border border-sky-500/30 bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sky-300">Admin</p>
                  <span className="text-[10px] bg-sky-500/15 border border-sky-400/40 text-sky-100 px-2 py-[2px] rounded-full">
                    Control Center
                  </span>
                </div>
                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                  <li>Review and approve/reject loan requests.</li>
                  <li>Assign approved loans to available lenders.</li>
                  <li>Manage users and their roles (CRUD operations).</li>
                  <li>Monitor loan lifecycle from pending to completion.</li>
                </ul>
              </div>

              {/* Lender */}
              <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-300">Lender</p>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 px-2 py-[2px] rounded-full">
                    Funds Manager
                  </span>
                </div>
                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                  <li>View allocated borrowers and their loans.</li>
                  <li>Disburse funds once loans are approved.</li>
                  <li>Track repayment status of EMIs.</li>
                  <li>Assess risk across their loan portfolio.</li>
                </ul>
              </div>

              {/* Borrower */}
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-indigo-300">Borrower</p>
                  <span className="text-[10px] bg-indigo-500/15 border border-indigo-400/40 text-indigo-100 px-2 py-[2px] rounded-full">
                    Loan Seeker
                  </span>
                </div>
                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                  <li>Request new loans with basic details & purpose.</li>
                  <li>View loan status: Pending, Approved, Disbursed, etc.</li>
                  <li>Track EMI schedule and pay EMIs one by one.</li>
                  <li>See assigned lender and repayment history.</li>
                </ul>
              </div>

              {/* Analyst */}
              <div className="rounded-2xl border border-fuchsia-500/30 bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-fuchsia-300">Analyst</p>
                  <span className="text-[10px] bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-100 px-2 py-[2px] rounded-full">
                    Insights & Metrics
                  </span>
                </div>
                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                  <li>Visualize loan status distribution (pie chart).</li>
                  <li>View total disbursed vs total repaid amounts.</li>
                  <li>Analyze amounts per borrower (bar chart).</li>
                  <li>Help decision-makers understand portfolio health.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How loanSys works */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 md:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-1">
                App Flow
              </p>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
                How loanSys works in 4 steps
              </h2>
              <p className="text-[11px] md:text-sm text-slate-400 mt-1 max-w-2xl">
                From borrowing to analyzing — loanSys connects every role in a
                smooth, demo-friendly workflow.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px] md:text-sm">
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-sky-500/20 border border-sky-400/60 text-[11px] flex items-center justify-center text-sky-200">
                    1
                  </span>
                  <p className="font-semibold text-sky-200">
                    Borrower requests loan
                  </p>
                </div>
                <p className="text-slate-400 ml-8">
                  Borrower fills in amount, duration, purpose and identity
                  details like Aadhaar, PAN and address.
                </p>
              </li>

              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-[11px] flex items-center justify-center text-emerald-200">
                    2
                  </span>
                  <p className="font-semibold text-emerald-200">
                    Admin reviews & assigns
                  </p>
                </div>
                <p className="text-slate-400 ml-8">
                  Admin checks details, approves or rejects, and assigns an
                  available lender to the approved loan.
                </p>
              </li>

              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-[11px] flex items-center justify-center text-cyan-200">
                    3
                  </span>
                  <p className="font-semibold text-cyan-200">
                    Lender disburses & monitors
                  </p>
                </div>
                <p className="text-slate-400 ml-8">
                  Lender disburses funds and monitors EMIs, while the system
                  auto-updates statuses as repayments happen.
                </p>
              </li>

              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/20 border border-violet-400/60 text-[11px] flex items-center justify-center text-violet-200">
                    4
                  </span>
                  <p className="font-semibold text-violet-200">
                    Analyst visualizes performance
                  </p>
                </div>
                <p className="text-slate-400 ml-8">
                  Analyst dashboard shows charts of loan statuses, disbursed
                  amounts and repayments for quick insights.
                </p>
              </li>
            </ol>
          </div>

          {/* PROMO / HIGHLIGHTS STRIP */}
          <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-cyan-500/10 p-[1px] shadow-[0_20px_70px_rgba(34,197,94,0.5)]">
            <div className="rounded-3xl bg-slate-950/90 px-5 py-5 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300 mb-1">
                  Why loanSys?
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-slate-50">
                  Perfect for demos, projects & learning full-stack concepts.
                </h3>
                <ul className="mt-2 text-[11px] md:text-sm text-slate-300 space-y-1 list-disc list-inside max-w-xl">
                  <li>Frontend-only: data stored in localStorage, no backend.</li>
                  <li>Shows real-world flows: roles, dashboards, EMIs, approvals.</li>
                  <li>
                    Great for explaining system design, CRUD operations and role-based
                    UIs.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 text-[11px] md:text-sm text-slate-300 min-w-[190px]">
                <p className="font-semibold text-emerald-200">
                  Ready to explore?
                </p>
                <p className="text-slate-400">
                  Register as{" "}
                  <span className="text-sky-300 font-medium">Admin</span> to
                  manage everything, or as{" "}
                  <span className="text-indigo-300 font-medium">Borrower</span>{" "}
                  to experience the loan journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full mt-auto mb-4">
          <div className="max-w-5xl mx-auto border-t border-slate-800/80 pt-3 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="text-slate-300 font-medium">loanSys</span>. All
              rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleFooterClick("terms")}
                className="hover:text-slate-300 hover:underline underline-offset-4"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => handleFooterClick("privacy")}
                className="hover:text-slate-300 hover:underline underline-offset-4"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => handleFooterClick("support")}
                className="hidden sm:inline hover:text-slate-300 hover:underline underline-offset-4"
              >
                Support
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
