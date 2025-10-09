// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role"); // store role as "admin", "waiter", "chef"

  if (!token || userRole !== role) {
    return <Navigate to={`/login/${role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
