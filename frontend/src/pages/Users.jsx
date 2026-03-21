import { useEffect, useState } from "react";
import { authFetch } from "../services/api";
import { useToast } from "../context/ToastContext";

function RoleBadge({ role }) {
  const map = {
    ADMIN: "bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/30",
    TEACHER: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    STUDENT: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[role] || ""}`}>
      {role}
    </span>
  );
}

function Avatar({ name, email }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="skeleton w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
      </div>
      <div className="skeleton h-7 w-24 rounded-lg" />
    </div>
  );
}

function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await authFetch("/users"));
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await authFetch(`/users/${userId}/role?role=${newRole}`, { method: "PUT" });
      showToast(`Role updated to ${newRole}`, "success");
      loadUsers();
    } catch {
      showToast("Failed to update role", "error");
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    ALL: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    TEACHER: users.filter((u) => u.role === "TEACHER").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage campus users and their roles
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍  Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {["ALL", "ADMIN", "TEACHER", "STUDENT"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${roleFilter === r
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              {r}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${roleFilter === r
                  ? "bg-white text-brand-600"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                {counts[r]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT */}
      {!loading && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{users.length}</span>
          {" "}users
        </p>
      )}

      {/* USER LIST */}
      <div className="card overflow-hidden">
        {loading ? (
          [...Array(5)].map((_, i) => <UserSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No users found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {search ? `No results for "${search}"` : "No users in this role"}
            </p>
          </div>
        ) : (
          filtered.map((u, index) => (
            <div
              key={u.id}
              className={`flex items-center gap-4 p-4 transition
                hover:bg-slate-50 dark:hover:bg-slate-800/50
                ${index !== filtered.length - 1
                  ? "border-b border-slate-100 dark:border-slate-800"
                  : ""}`}
            >
              <Avatar name={u.name} email={u.email} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                    {u.name}
                  </p>
                  <RoleBadge role={u.role} />
                </div>
                <p className="text-xs truncate mt-0.5 text-slate-500 dark:text-slate-400">
                  {u.email}
                </p>
              </div>

              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value)}
                className="input w-32 text-xs py-1.5"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Users;