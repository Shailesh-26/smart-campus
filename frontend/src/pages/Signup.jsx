import { useState } from "react";
import { signup } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

const STATS = [
  { value: "500+", label: "Rooms managed" },
  { value: "12k+", label: "Bookings made" },
  { value: "99.9%", label: "Uptime" },
];

const QUOTE = {
  text: "Smart Campus cut our room-conflict issues to zero. Booking approvals that used to take hours now happen in minutes.",
  author: "Dr. Meera Nair",
  role: "Head of Academic Affairs",
};

function GridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-signup" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-signup)" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "STUDENT",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      showToast("Account created successfully!", "success");
      setTimeout(() =>
        navigate("/login", { state: { success: "Registration completed successfully!" } })
        , 1000);
    } catch {
      showToast("Signup failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── THEME TOGGLE ── */}
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
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        <div className="absolute inset-0 bg-white dark:bg-slate-950 transition-colors duration-300" />
        <GridPattern />

        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none
          bg-brand-600 opacity-[0.08] dark:opacity-[0.12]" />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none
          bg-brand-400 opacity-[0.06] dark:opacity-[0.10]" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-brand-400 to-transparent opacity-20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/30">
            SC
          </div>
          <div>
            <p className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Smart Campus</p>
            <p className="text-xs leading-tight text-slate-500">Room Booking System</p>
          </div>
        </div>

        {/* Hero + stats + quote */}
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight mb-4
            text-slate-900 dark:text-white">
            Your campus,<br />
            <span className="text-brand-600 dark:text-brand-400">your schedule.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm mb-10 text-slate-500 dark:text-slate-400">
            Join thousands of students and teachers who manage their campus
            space with zero friction, right from their browser.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center transition-colors duration-300
                bg-slate-50 dark:bg-white/[0.04]
                border border-slate-200 dark:border-white/[0.07]">
                <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{s.value}</p>
                <p className="text-xs mt-1 leading-tight text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="rounded-2xl p-5 transition-colors duration-300
            bg-brand-50 dark:bg-brand-600/10
            border border-brand-200 dark:border-brand-500/20">
            <svg className="w-7 h-7 mb-3 text-brand-500 opacity-60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-sm leading-relaxed italic mb-4 text-slate-600 dark:text-slate-300">
              "{QUOTE.text}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                bg-brand-100 dark:bg-brand-600/40
                border border-brand-200 dark:border-brand-500/30
                text-brand-700 dark:text-brand-300">
                {QUOTE.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{QUOTE.author}</p>
                <p className="text-xs text-slate-500">{QUOTE.role}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-400 dark:text-slate-600">
          © 2026 Smart Campus Room Booking System
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden
        bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl
            bg-brand-400 opacity-10 dark:opacity-10" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl
            bg-brand-600 opacity-10 dark:opacity-10" />
        </div>

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
              Create your account
            </h2>
            <p className="text-sm mb-6 text-slate-500 dark:text-slate-400">
              Join Smart Campus and start booking rooms
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NAME */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
                  text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200
                    bg-slate-50 dark:bg-white/5
                    border border-slate-200 dark:border-white/10
                    text-slate-900 dark:text-white
                    placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:border-brand-400 dark:focus:border-brand-500/60
                    focus:ring-2 focus:ring-brand-400/10 dark:focus:ring-0"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
                  text-slate-500 dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
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
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
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

              {/* ROLE SELECTOR */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block
                  text-slate-500 dark:text-slate-400">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "STUDENT", label: "Student", icon: "🎓" },
                    { value: "TEACHER", label: "Teacher", icon: "👨‍🏫" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${form.role === r.value
                          ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/60 dark:bg-brand-600/20 dark:text-brand-300"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-300"
                        }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
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
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold transition
                text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300">
                Sign in
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

export default Signup;