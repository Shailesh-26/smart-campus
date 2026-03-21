import { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
    return (
        <div className="card p-6 max-w-xl">
            <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

// ── Avatar with initials ─────────────────────────────────────────────────────
function Avatar({ name, email, size = "lg" }) {
    const initials = name
        ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : email?.slice(0, 2).toUpperCase();

    const sz = size === "lg"
        ? "w-16 h-16 text-xl"
        : "w-10 h-10 text-sm";

    return (
        <div className={`${sz} rounded-full bg-brand-600 text-white flex items-center justify-center font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
}

// ── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
    const map = {
        ADMIN: "bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/30",
        TEACHER: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
        STUDENT: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[role] || ""}`}>
            {role}
        </span>
    );
}

// ── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        password.length >= 6,
        password.length >= 10,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["", "bg-red-500", "bg-amber-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"];
    const textColors = ["", "text-red-500", "text-amber-500", "text-amber-400", "text-emerald-500", "text-emerald-600"];

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-slate-200 dark:bg-slate-700"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${textColors[score]}`}>
                {labels[score]}
            </p>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
function Profile() {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Profile info
    const [userInfo, setUserInfo] = useState(null);
    const [infoLoading, setInfoLoading] = useState(true);

    // Name form
    const [name, setName] = useState("");
    const [nameLoading, setNameLoading] = useState(false);

    // Password form
    const [pwForm, setPwForm] = useState({
        currentPassword: "", newPassword: "", confirmPassword: ""
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        setInfoLoading(true);
        try {
            const data = await authFetch("/users/me");
            setUserInfo(data);
            setName(data.name || "");
        } catch {
            showToast("Failed to load profile", "error");
        } finally {
            setInfoLoading(false);
        }
    };

    // ── Update name ────────────────────────────────────────────────────────────
    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { showToast("Name cannot be empty", "error"); return; }
        if (name.trim() === userInfo?.name) { showToast("No changes to save", "info"); return; }

        setNameLoading(true);
        try {
            const updated = await authFetch("/users/me/name", {
                method: "PUT",
                body: JSON.stringify({ name: name.trim() }),
            });
            setUserInfo(updated);
            showToast("Name updated successfully!", "success");
        } catch {
            showToast("Failed to update name", "error");
        } finally {
            setNameLoading(false);
        }
    };

    // ── Change password ────────────────────────────────────────────────────────
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = pwForm;

        if (!currentPassword) { showToast("Enter your current password", "error"); return; }
        if (newPassword.length < 6) { showToast("New password must be at least 6 characters", "error"); return; }
        if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
        if (newPassword === currentPassword) { showToast("New password must differ from current", "error"); return; }

        setPwLoading(true);
        try {
            await authFetch("/users/me/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            showToast("Password changed successfully!", "success");
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch {
            showToast("Current password is incorrect", "error");
        } finally {
            setPwLoading(false);
        }
    };

    const onPwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

    // ── Skeleton ───────────────────────────────────────────────────────────────
    if (infoLoading) {
        return (
            <div className="space-y-6 max-w-xl">
                <div className="skeleton h-8 w-40 rounded" />
                <div className="card p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="skeleton w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                            <div className="skeleton h-5 w-32 rounded" />
                            <div className="skeleton h-4 w-48 rounded" />
                        </div>
                    </div>
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-28 rounded-lg" />
                </div>
                <div className="card p-6 space-y-4">
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-28 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Manage your account details and security settings
                </p>
            </div>

            {/* ── IDENTITY CARD ── */}
            <div className="card p-6 max-w-xl">
                <div className="flex items-center gap-4">
                    <Avatar name={userInfo?.name} email={user?.email} size="lg" />
                    <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {userInfo?.name || "—"}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {userInfo?.email}
                        </p>
                        <div className="mt-2">
                            <RoleBadge role={userInfo?.role} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── UPDATE NAME ── */}
            <Section
                title="Display Name"
                subtitle="This is the name shown across the dashboard and bookings."
            >
                <form onSubmit={handleNameSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
              text-slate-500 dark:text-slate-400">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                            className="input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={nameLoading || name.trim() === userInfo?.name}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {nameLoading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : "Save Name"}
                    </button>
                </form>
            </Section>

            {/* ── CHANGE PASSWORD ── */}
            <Section
                title="Change Password"
                subtitle="Use a strong password with at least 6 characters."
            >
                <form onSubmit={handlePasswordSubmit} className="space-y-3">

                    {/* CURRENT PASSWORD */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
              text-slate-500 dark:text-slate-400">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                name="currentPassword"
                                value={pwForm.currentPassword}
                                onChange={onPwChange}
                                placeholder="••••••••"
                                required
                                className="input pr-16"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition
                  text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                {showCurrent ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* NEW PASSWORD */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
              text-slate-500 dark:text-slate-400">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                name="newPassword"
                                value={pwForm.newPassword}
                                onChange={onPwChange}
                                placeholder="••••••••"
                                required
                                className="input pr-16"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition
                  text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                {showNew ? "Hide" : "Show"}
                            </button>
                        </div>
                        {/* PASSWORD STRENGTH */}
                        <PasswordStrength password={pwForm.newPassword} />
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block
              text-slate-500 dark:text-slate-400">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                name="confirmPassword"
                                value={pwForm.confirmPassword}
                                onChange={onPwChange}
                                placeholder="••••••••"
                                required
                                className="input pr-16"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition
                  text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                {showConfirm ? "Hide" : "Show"}
                            </button>
                        </div>

                        {/* MATCH INDICATOR */}
                        {pwForm.confirmPassword && (
                            <p className={`text-xs mt-1.5 font-medium ${pwForm.newPassword === pwForm.confirmPassword
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : "text-red-500 dark:text-red-400"
                                }`}>
                                {pwForm.newPassword === pwForm.confirmPassword
                                    ? "✓ Passwords match"
                                    : "✗ Passwords do not match"}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {pwLoading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                            </>
                        ) : "Change Password"}
                    </button>
                </form>
            </Section>

            {/* ── ACCOUNT INFO (read-only) ── */}
            <Section
                title="Account Information"
                subtitle="These details are managed by your administrator."
            >
                <div className="space-y-3">
                    {[
                        { label: "Email Address", value: userInfo?.email },
                        { label: "Role", value: userInfo?.role },
                        { label: "Account ID", value: `#${userInfo?.id}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2.5 border-b
              border-slate-100 dark:border-slate-800 last:border-0">
                            <span className="text-xs font-semibold uppercase tracking-wider
                text-slate-400 dark:text-slate-500">
                                {label}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>

        </div>
    );
}

export default Profile;