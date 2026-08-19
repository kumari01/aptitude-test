import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Lock, ArrowRight, User, Mail, Shield, Eye, EyeOff } from "lucide-react";
import Logo from "../components/common/Logo";
import GoogleG from "../components/common/GoogleG";
import { BRAND, INK, FONT_DISPLAY, FONT_BODY } from "../constants/theme";
import { useToast } from "../context/ToastContext";
import axios from "axios";

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [tab, setTab] = useState("Student");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roll, setRoll] = useState("");
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setRoll("");
    setAdminId("");
    setPassword("");
  };

  const handleToggleMode = (signUpState) => {
    setIsSignUp(signUpState);
    resetForm();
  };

  const handleSubmit = async () => {
    if (isSignUp) {
      // Validation for Sign Up
      if (!username || !password || (tab === "Student" ? (!roll || !email) : (!adminId || !email))) {
        toast.warning(`Please fill in all form fields for ${tab} registration`);
        return;
      }

      if (!email.toLowerCase().endsWith("@sasi.ac.in")) {
        toast.warning("Only @sasi.ac.in email addresses are allowed!");
        return;
      }

      try {
        const endpoint = tab === "Student" ? "/auth/student/signup" : "/auth/admin/signup";
        const payload =
          tab === "Student"
            ? { username, rollno: roll, email, password }
            : { username, email, adminid: adminId, password };

        const response = await axios.post(
          `http://localhost:3000/api${endpoint}`,
          payload,
          { withCredentials: true }
        );

        console.log("Signup successful:", response.data);
        toast.success(response.data.message || "Account created successfully! Switching to sign in...");

        // Switch to sign in mode after successful signup
        setTimeout(() => {
          setIsSignUp(false);
          setPassword("");
        }, 1500);
      } catch (error) {
        console.error("Signup error:", error);
        toast.error(error.response?.data?.message || "Registration failed. Please check your inputs.");
      }
    } else {
      // Sign In Logic
      if (!roll || !password) {
        toast.warning(`Please enter both ${tab === "Student" ? "roll number" : "email/Admin ID"} and password`);
        return;
      }

      try {
        const endpoint = tab === "Student" ? "/auth/student/login" : "/auth/admin/login";
        const payload =
          tab === "Student"
            ? { rollno: roll, password }
            : roll.includes("@")
            ? { email: roll, password }
            : { adminid: roll, password };

        const response = await axios.post(
          `http://localhost:3000/api${endpoint}`,
          payload,
          { withCredentials: true }
        );

        console.log("Login successful:", response.data);
        toast.success("Logged in successfully!");

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        if (response.data.student) {
          localStorage.setItem("student", JSON.stringify(response.data.student));
        } else if (response.data.admin) {
          localStorage.setItem("admin", JSON.stringify(response.data.admin));
        }

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } catch (error) {
        console.error("Login error:", error);
        if (error.response) {
          toast.error(error.response.data.message || "Login failed");
        } else {
          toast.error("Unable to connect to server. Please check if the server is running.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ fontFamily: FONT_BODY }}>
      {/* LEFT — dark hero panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden px-16 pt-10 pb-12"
        style={{
          background: "radial-gradient(circle at 30% 20%, #1a1a1a 0%, #000 65%)",
          borderRight: `3px solid ${BRAND}`,
        }}
      >
        <div
          className="absolute rounded-full border border-white/10"
          style={{ width: 420, height: 420, top: -80, right: -120 }}
        />
        <div
          className="absolute rounded-full border border-white/5"
          style={{ width: 260, height: 260, bottom: -60, left: -80 }}
        />

        <Logo dark />

        <div className="relative z-10 my-auto">
          <h1
            className="text-5xl leading-[1.15] font-bold text-white mb-6"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            CampVex
            <br />
            <span style={{ color: BRAND }}>Examination Portal</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Practice and take your weekly aptitude exams. Track your progress across Verbal,
            Reasoning, and Quantitative sections.
          </p>
        </div>

        <div className="relative z-10 flex gap-10 pt-5 border-t border-white/10">
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: FONT_DISPLAY }}>
              Verbal
            </div>
            <div className="text-gray-500 text-sm mt-1">
              Vocabulary &amp;
              <br />
              Logic
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: FONT_DISPLAY }}>
              Reasoning
            </div>
            <div className="text-gray-500 text-sm mt-1">
              Patterns &amp;
              <br />
              Series
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: FONT_DISPLAY }}>
              Aptitude
            </div>
            <div className="text-gray-500 text-sm mt-1">Quant &amp; Data</div>
          </div>
        </div>
      </div>

      {/* RIGHT — sign in / sign up form */}
      <div className="flex-1 flex items-center justify-center px-6 pt-8 pb-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: FONT_DISPLAY }}>
            {isSignUp ? "Create an Account" : "Sign in"}
          </h2>
          <p className="text-gray-500 mb-5">
            {isSignUp
              ? `Register as a ${tab} to get started`
              : "Use your SASI college credentials to continue"}
          </p>

          {/* Role selection tab */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-5">
            {["Student", "Admin"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t ? "text-white" : "text-gray-500"
                }`}
                style={tab === t ? { background: INK } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {!isSignUp && (
            <>
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 font-medium text-gray-700 hover:bg-gray-50 mb-2"
              >
                <GoogleG /> Sign in with Google
              </button>
              <p className="text-center text-xs text-gray-400 mb-5">
                Only <span className="font-semibold text-gray-600">@sasi.ac.in</span> accounts are allowed
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[11px] tracking-wide text-gray-400 font-medium">
                  {tab === "Student" ? "OR USE ROLL NUMBER" : "OR USE EMAIL / ADMIN ID"}
                </span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
            </>
          )}

          {/* FORM FIELDS */}
          {isSignUp && (
            <>
              <label className="text-sm font-semibold text-gray-800">Full Name</label>
              <div className="mt-1.5 mb-4 flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-gray-400">
                <User size={16} className="text-gray-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400"
                />
              </div>

              <label className="text-sm font-semibold text-gray-800">Email Address</label>
              <div className="mt-1.5 mb-4 flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-gray-400">
                <Mail size={16} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sasi.ac.in"
                  className="w-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Identifier field */}
          {(!isSignUp || tab === "Student") && (
            <>
              <label className="text-sm font-semibold text-gray-800">
                {tab === "Student"
                  ? "Roll Number"
                  : isSignUp
                  ? "Admin ID"
                  : "Email / Admin ID"}
              </label>
              <div className="mt-1.5 mb-4 flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-gray-400">
                <Hash size={16} className="text-gray-400" />
                <input
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  placeholder={
                    tab === "Student"
                      ? "Enter roll number (e.g. 21A12A0123)"
                      : "Enter email or Admin ID"
                  }
                  className="w-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {isSignUp && tab === "Admin" && (
            <>
              <label className="text-sm font-semibold text-gray-800">Admin ID</label>
              <div className="mt-1.5 mb-4 flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-gray-400">
                <Shield size={16} className="text-gray-400" />
                <input
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter your Admin ID"
                  className="w-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          <label className="text-sm font-semibold text-gray-800">Password</label>
          <div className="mt-1.5 mb-6 flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-gray-400">
            <Lock size={16} className="text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full outline-none text-gray-800 bg-transparent placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 shrink-0"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: INK }}
          >
            {isSignUp ? "Sign Up" : "Sign In"} <ArrowRight size={16} />
          </button>

          {/* Mode Switcher Footer */}
          <div className="text-center text-sm text-gray-500 mt-6 flex flex-col gap-2">
            <div>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => handleToggleMode(!isSignUp)}
                className="font-semibold underline cursor-pointer"
                style={{ color: BRAND }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
            {!isSignUp && (
              <div>
                Forgot your password?{" "}
                <span className="font-semibold cursor-pointer" style={{ color: BRAND }}>
                  Contact your department
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
