import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import MyBookings from "./pages/MyBookings";
import AdminBookings from "./pages/AdminBookings";
import Profile from "./pages/Profile";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={
              <ProtectedRoute><DashboardLayout><Home /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/rooms" element={
              <ProtectedRoute><DashboardLayout><Rooms /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute><DashboardLayout><Bookings /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/my-bookings" element={
              <ProtectedRoute><DashboardLayout><MyBookings /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/admin-bookings" element={
              <ProtectedRoute adminOnly={true}><DashboardLayout><AdminBookings /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute adminOnly={true}><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;