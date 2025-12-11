import { Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import AdminShell from './components/AdminDashboard/AdminShell';
import Chatbot from "./components/Chatbot/Chatbot";
import Landing from "./components/LandingPage/Landing";
import LogIn from "./components/LandingPage/LogIn";
import ForgotPassword from "./components/LandingPage/ForgotPassword";
import ResetPassword from "./components/LandingPage/ResetPassword";
import UserInfoForm from "./components/UserRegistration/UserInfo";
import UserLookup from "./components/UserRegistration/UserLookup";

export default function App() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role"); // set during login
  const isAdmin = token && role === "Admin";
  return (
      <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* --- Public Routes --- */}
      <Route path="/login" element={<LogIn />} />
      <Route path="/register" element={<UserInfoForm />} />
      <Route path="/chatbot" element={<Chatbot />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/user-lookup" element={<UserLookup />} />

      {/* Admin Interface */}
      <Route path="/admin/*" element={isAdmin ? <AdminShell /> : <Navigate to="/" replace />} />
    </Routes>
  );
}