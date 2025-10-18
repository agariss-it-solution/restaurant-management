import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./ProtectedRoute"
// Navbar
import AppNavbar from "./components/AppNavbar/AppNavbar";

// Waiter Views
import WaiterView from "./components/WaiterView/WaiterView";
import TableManagement from "./components/WaiterView/tableManagement";
import MenuPage from "./components/WaiterView/MenuPage";
import Order from "./components/WaiterView/Order";

// Kitchen
import KitchenView from "./components/KitchenView/KitchenView";

// Admin
import AdminPanel from "./components/AdminPanel/AdminPanel";
import Dashboard from "./components/AdminPanel/Dashboard";
import Tables from "./components/AdminPanel/Tables";
import Orders from "./components/AdminPanel/Orders";
import Kitchen from "./components/AdminPanel/Kitchen";
import Billing from "./components/AdminPanel/Billing";
import Analytics from "./components/AdminPanel/Analytics";
import ManageMenuPage from "./components/AdminPanel/ManageMenuPage";
import AdminMenuPage from "./components/AdminPanel/AdminMenuPage";
import OrderHistory from "./components/AdminPanel/OrderHisroy";
import TakeawayOrders from "./components/AdminPanel/TakeawayOrders";

// Public
import Home from "./components/Home/Home";
import OwnerLogin from "./components/Login/OwnerLogin";
import WaiterLogin from "./components/Login/WaiterLogin";
import ChefLogin from "./components/Login/ChefLogin";
import ResetPassword from "./ResetPassword";

// --- Waiter Layout ---
// IMPORTANT: Add <Outlet /> for nested routes to render
const WaiterLayout = () => (
  <>
    <AppNavbar />
    <div >
      <Outlet />
    </div>
  </>
);

// --- Routes Wrapper ---
function AppRoutes() {
  return (
    <div className="container-lg">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/login/owner" element={<OwnerLogin />} />
        <Route path="/login/waiter" element={<WaiterLogin />} />
        <Route path="/login/chef" element={<ChefLogin />} />

        {/* Waiter Routes with Navbar */}
        <Route
          element={
            <ProtectedRoute role="waiter">
              <WaiterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/waiter" element={<WaiterView />} />
          <Route path="/tables" element={<TableManagement />} />
          <Route path="/menu/:tableId" element={<MenuPage />} />
          <Route path="/waiter/orders" element={<Order />} />
        </Route>

        {/* Kitchen */}
        <Route path="/kitchen" element={<KitchenView />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tables" element={<Tables />} />
          <Route path="orders" element={<Orders />} />
          <Route path="kitchen" element={<Kitchen />} />
          <Route path="billing" element={<Billing />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="managemenu" element={<ManageMenuPage />} />
          <Route path="adminmenu/:tableId" element={<AdminMenuPage />} />
          <Route path="order-history" element={<OrderHistory />} />
          <Route path="takeaway" element={<TakeawayOrders />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

// --- App ---
export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
