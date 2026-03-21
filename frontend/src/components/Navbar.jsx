import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div className="flex gap-6">
        <Link to="/">Dashboard</Link>
        <Link to="/rooms">Rooms</Link>
        <Link to="/bookings">Bookings</Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 capitalize">
          {user?.role}
        </span>

        <button
          onClick={handleLogout}
          className="text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
