import { useState } from "react";
import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Instant Booking",
    desc: "Reserve rooms in seconds with real-time availability.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Role-Based Access",
    desc: "Separate workflows for students, teachers, and admins.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Email Notifications",
    desc: "Get notified when bookings are approved, rejected, or upcoming.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Analytics Dashboard",
    desc: "Visualize usage trends, peak hours, and booking history.",
  },
];

function GridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-login" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-login)" />
    </svg>
  );
}

// Sun icon
function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

// Moon icon
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function Login() {
  const { login: saveToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.success;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      saveToken(data.token);
      navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── THEME TOGGLE — fixed top-right ── */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          text-slate-500 dark:text-slate-400
          hover:text-brand-600 dark:hover:text-brand-400
          shadow-sm hover:shadow-md"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden
        bg-slate-950 dark:bg-slate-950
        light:bg-white">

        {/* Light mode: solid white bg override */}
        <div className="absolute inset-0 bg-white dark:bg-slate-950 transition-colors duration-300" />

        <GridPattern />

        {/* Glows — different color in light mode */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none
          bg-brand-600 opacity-[0.08] dark:opacity-[0.12]" />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none
          bg-brand-400 opacity-[0.06] dark:opacity-[0.10]" />

        {/* Vertical accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-brand-400 to-transparent
          opacity-20 dark:opacity-20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/30">
            SC
          </div>
          <div>
            <p className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Smart Campus</p>
            <p className="text-xs leading-tight text-slate-500 dark:text-slate-500">Room Booking System</p>
          </div>
        </div>

        {/* Hero + features */}
        <div className="relative">
          <div className="mb-10">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
              Book smarter,<br />
              <span className="text-brand-600 dark:text-brand-400">collaborate better.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed max-w-sm text-slate-500 dark:text-slate-400">
              The all-in-one platform for managing campus room reservations —
              seamlessly, transparently, and in real time.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                  bg-brand-50 dark:bg-brand-600/15
                  border border-brand-200 dark:border-brand-500/20
                  text-brand-600 dark:text-brand-400">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{f.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed text-slate-500 dark:text-slate-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400 dark:text-slate-600">
          © 2026 Smart Campus Room Booking System
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden
        bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        {/* Ambient glow (mobile only) */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl
            bg-brand-400 opacity-10 dark:opacity-10" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl
            bg-brand-600 opacity-10 dark:opacity-10" />
        </div>

        {/* Subtle separator */}
        <div className="hidden lg:block absolute top-0 left-0 w-px h-full
          bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-white
          opacity-60 dark:opacity-[0.04]" />

        <div className="relative w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              SC
            </div>
            <div>
              <p className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Smart Campus</p>
              <p className="text-xs leading-tight text-slate-500">Room Booking System</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 shadow-2xl transition-colors duration-300
            bg-white dark:bg-white/[0.04]
            border border-slate-200 dark:border-white/[0.08]
            backdrop-blur-sm">

            <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm mb-6 text-slate-500 dark:text-slate-400">
              Sign in to your account to continue
            </p>

            {/* SUCCESS */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2
                bg-emerald-50 dark:bg-emerald-500/10
                border border-emerald-200 dark:border-emerald-500/20">
                <span className="text-sm">✅</span>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Account created. Please sign in.
                </p>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2
                bg-red-50 dark:bg-red-500/10
                border border-red-200 dark:border-red-500/20">
                <span className="text-sm">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
                  text-slate-500 dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200
                    bg-slate-50 dark:bg-white/5
                    border border-slate-200 dark:border-white/10
                    text-slate-900 dark:text-white
                    placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:border-brand-400 dark:focus:border-brand-500/60
                    focus:ring-2 focus:ring-brand-400/10 dark:focus:ring-0"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
                  text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-2.5 pr-16 text-sm transition-all duration-200
                      bg-slate-50 dark:bg-white/5
                      border border-slate-200 dark:border-white/10
                      text-slate-900 dark:text-white
                      placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:border-brand-400 dark:focus:border-brand-500/60
                      focus:ring-2 focus:ring-brand-400/10 dark:focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition
                      text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2
                  shadow-lg shadow-brand-600/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold transition
                text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300">
                Create one
              </Link>
            </p>
          </div>

          <p className="lg:hidden text-center text-xs mt-6 text-slate-400 dark:text-slate-600">
            © 2026 Smart Campus Room Booking System
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;