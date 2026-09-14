import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // "student" | "admin" | null
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedStudent = localStorage.getItem("student");
      const storedAdmin = localStorage.getItem("admin");

      if (storedToken && storedStudent) {
        try {
          const parsedStudent = JSON.parse(storedStudent);
          setToken(storedToken);
          setUser(parsedStudent);
          setRole("student");
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        } catch (e) {
          localStorage.clear();
        }
      } else if (storedToken && storedAdmin) {
        try {
          const parsedAdmin = JSON.parse(storedAdmin);
          setToken(storedToken);
          setUser(parsedAdmin);
          setRole("admin");
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        } catch (e) {
          localStorage.clear();
        }
      } else {
        // Clear any orphan tokens or partial state
        localStorage.removeItem("token");
        localStorage.removeItem("student");
        localStorage.removeItem("admin");
        delete api.defaults.headers.common["Authorization"];
      }
    } catch (err) {
      console.error("Error loading auth state:", err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken, userData, userRole = "student") => {
    setToken(newToken);
    setUser(userData);
    setRole(userRole);

    try {
      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      if (userRole === "admin") {
        localStorage.setItem("admin", JSON.stringify(userData));
        localStorage.removeItem("student");
      } else {
        localStorage.setItem("student", JSON.stringify(userData));
        localStorage.removeItem("admin");
      }
    } catch (e) {
      console.error("Failed to persist auth data:", e);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("student");
      localStorage.removeItem("admin");
      delete api.defaults.headers.common["Authorization"];
    } catch (e) {
      console.error("Failed to clear auth storage:", e);
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedUserData };
      try {
        if (role === "admin") {
          localStorage.setItem("admin", JSON.stringify(nextUser));
        } else {
          localStorage.setItem("student", JSON.stringify(nextUser));
        }
      } catch (e) {
        console.error("Failed to update user in storage:", e);
      }
      return nextUser;
    });
  }, [role]);

  const value = {
    user,
    token,
    role,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: role === "admin",
    isStudent: role === "student",
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
