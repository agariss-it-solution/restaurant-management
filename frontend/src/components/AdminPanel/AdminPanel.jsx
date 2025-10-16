// src/components/AdminPanel/AdminPanel.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

function AdminPanel() {
  return (
    <div className="min-vh-100 ">
      <AdminNavbar />
      <div className="">
        <Outlet /> 
      </div>
    </div>
  );
}

export default AdminPanel;
