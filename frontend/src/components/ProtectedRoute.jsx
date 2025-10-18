// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role: requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const expiry = localStorage.getItem("tokenExpiry");
  const now = Date.now();

  // No token or token expired
  if (!token || !expiry || now > Number(expiry)) {
    return <Navigate to={`/login/${requiredRole}`} replace />;
  }

  // Wrong role
  if (role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Access granted
  return children;
};

export default ProtectedRoute;
