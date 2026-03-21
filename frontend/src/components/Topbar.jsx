import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
      <h2 className="font-semibold text-gray-200">
        Welcome {user?.name || "User"}
      </h2>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
