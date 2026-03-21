import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { authFetch } from "../services/api";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "⊞", roles: ["ADMIN", "STUDENT", "TEACHER"] },
  { path: "/rooms", label: "Rooms", icon: "🏫", roles: ["ADMIN", "STUDENT", "TEACHER"] },
  { path: "/bookings", label: "Bookings", icon: "📅", roles: ["ADMIN", "STUDENT", "TEACHER"] },
  { path: "/my-bookings", label: "My Bookings", icon: "🔖", roles: ["ADMIN", "STUDENT", "TEACHER"] },
  { path: "/admin-bookings", label: "All Bookings", icon: "📋", roles: ["ADMIN"] },
  { path: "/users", label: "Users", icon: "👥", roles: ["ADMIN"] },
];

function Avatar({ name, email }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.slice(0, 2).toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN") loadPendingCount();
    loadUserInfo();
  }, [user]);

  const loadPendingCount = async () => {
    try {
      const bookings = await authFetch("/bookings");
      setPendingCount(bookings.filter((b) => b.status === "PENDING").length);
    } catch {
      setPendingCount(0);
    }
  };

  const loadUserInfo = async () => {
    try {
      setUserInfo(await authFetch("/users/me"));
    } catch {
      setUserInfo(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getBreadcrumb = () => {
    const map = {
      "/": "Dashboard",
      "/rooms": "Rooms",
      "/bookings": "Bookings",
      "/my-bookings": "My Bookings",
      "/admin-bookings": "All Bookings",
      "/users": "Users",
      "/profile": "Profile",
    };
    return map[location.pathname] || "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 h-screen flex flex-col
        bg-white dark:bg-slate-900
        border-r border-slate-100 dark:border-slate-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* LOGO */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">

            <button onClick={() => navigate("/")}>SC</button>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
              <button onClick={() => navigate("/")}>Smart Campus</button>
            </p>
            <p className="text-xs leading-tight text-slate-400 dark:text-slate-500">
              Room Booking System

            </p>
          </div>
        </div>
        {/* USER SECTION */}

        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition
      hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Avatar name={userInfo?.name} email={user?.email} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                {userInfo?.name || user?.email}
              </p>
              <p className="text-xs truncate text-brand-500 dark:text-brand-400">
                Edit profile →
              </p>
            </div>
          </Link>
        </div>


        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3
            text-slate-400 dark:text-slate-600">
            Navigation
          </p>

          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150
                ${isActive(item.path)
                  ? "bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === "/admin-bookings" && pendingCount > 0 && (
                <span className="ml-auto bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* USER SECTION */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition
            hover:bg-slate-50 dark:hover:bg-slate-800">
            <Avatar name={userInfo?.name} email={user?.email} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                {userInfo?.name || user?.email}
              </p>
              <p className="text-xs truncate text-slate-400 dark:text-slate-500">
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
              text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <span>→</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0
          bg-white dark:bg-slate-900
          border-b border-slate-100 dark:border-slate-800
          transition-colors duration-300">

          <div className="flex items-center gap-4">
            {/* HAMBURGER — mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden transition text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ☰
            </button>

            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 dark:text-slate-500">Smart Campus</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {getBreadcrumb()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* NOTIFICATION BELL — admin only */}
            {user?.role === "ADMIN" && (
              <Link
                to="/admin-bookings"
                className="relative p-2 rounded-lg transition
                  text-slate-500 dark:text-slate-400
                  hover:text-slate-700 dark:hover:text-white
                  hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-lg">🔔</span>
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}

            {/* ── THEME TOGGLE ── */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg transition-all duration-200
                text-slate-500 dark:text-slate-400
                hover:text-brand-600 dark:hover:text-brand-400
                hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* USER AVATAR */}
            <div className="flex items-center gap-2 pl-1">
              <Avatar name={userInfo?.name} email={user?.email} />
              <span className="text-sm font-medium hidden sm:block text-slate-700 dark:text-slate-200">
                {userInfo?.name || user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 page-transition">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="border-t mt-8 transition-colors duration-300
            bg-white dark:bg-slate-900
            border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-600">
                © 2026 Smart Campus Room Booking System
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                v1.0.0 · Built with React & Spring Boot
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;