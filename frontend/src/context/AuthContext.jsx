import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

// Helper function to read auth state synchronously from localStorage
function getInitialAuthState() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { user: null, token: null, role: null };
    }

    const studentJson = localStorage.getItem("student");
    if (studentJson) {
      const student = JSON.parse(studentJson);
      // Ensure the student object actually has identifying fields
      if (student && (student._id || student.rollno || student.email || student.username)) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return { user: student, token, role: "student" };
      }
    }

    const adminJson = localStorage.getItem("admin");
    if (adminJson) {
      const admin = JSON.parse(adminJson);
      // Ensure the admin object actually has identifying fields
      if (admin && (admin._id || admin.adminid || admin.email || admin.username)) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return { user: admin, token, role: "admin" };
      }
    }

    // Corrupted or incomplete storage: clean up immediately
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    localStorage.removeItem("admin");
    delete api.defaults.headers.common["Authorization"];
    return { user: null, token: null, role: null };
  } catch (err) {
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
    return { user: null, token: null, role: null };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { user, token, role } = authState;

  const login = useCallback((newToken, userData, userRole = "student") => {
    setAuthState({
      token: newToken,
      user: userData,
      role: userRole,
    });

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
    setAuthState({
      token: null,
      user: null,
      role: null,
    });

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
    setAuthState((prev) => {
      const nextUser = { ...prev.user, ...updatedUserData };
      try {
        if (prev.role === "admin") {
          localStorage.setItem("admin", JSON.stringify(nextUser));
        } else {
          localStorage.setItem("student", JSON.stringify(nextUser));
        }
      } catch (e) {
        console.error("Failed to update user in storage:", e);
      }
      return { ...prev, user: nextUser };
    });
  }, []);

  const value = {
    user,
    token,
    role,
    loading: false, // Initialized synchronously so no loading flash
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
