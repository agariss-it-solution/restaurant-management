// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiCheckCircle,
  FiDollarSign,
  FiClipboard,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";
import { getAnalytics } from "../config/api";

function Dashboard() {
  const [data, setData] = useState({
    todayRevenue: "0.00",
    activeOrders: 0,
    ordersToday: 0,
  });

  useEffect(() => {
    const getRevenue = async () => {
      const result = await getAnalytics();
      console.log("API result:", result);

      if (result && result.success) {
        setData({
          todayRevenue: result.data.todayRevenue,
          activeOrders: result.data.activeOrders,
          ordersToday: result.data.ordersToday, 
        });
      } else {
        console.warn("API call was unsuccessful or result is invalid");
      }
    };

    getRevenue();
  }, []);

  return (

    <div className="py-4 " >
      {/* Top Cards */}
      <div className="row g-3 mb-4 justify-content-center">
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white shadow-sm rounded-4 text-center h-100">
            <h6 className="text-dark fw-medium">Today's Revenue</h6>
            <h5 className="fw-bold text-success">₹{data.todayRevenue}</h5>
            <span className="fs-1 fw-semibold text-success">₹</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white shadow-sm rounded-4 text-center h-100">
            <h6 className="text-dark fw-medium">Active Orders</h6>
            <h5 className="fw-bold text-primary">{data.activeOrders}</h5>
            <FiUsers className="fs-3 text-primary" />
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white shadow-sm rounded-4 text-center h-100">
            <h6 className="text-dark fw-medium">Completed Today</h6>
            <h5 className="fw-bold  text-warning">{data.ordersToday}</h5>
            <FiCheckCircle className="fs-3  text-warning" />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <Link
            to="/admin/tables"
            className="text-decoration-none"
            style={{ color: "inherit" }}
          >
            <div className="p-4 bg-white shadow-sm rounded-4 text-center h-100 card-hover">
              <FiUsers className="fs-1 text-primary mb-2" />
              <h5 className="fw-bold">Manage Tables</h5>
              <p className="text-dark fw-medium small">Take orders and manage table status</p>
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-3">
          <Link
            to="/admin/kitchen"
            className="text-decoration-none"
            style={{ color: "inherit" }}
          >
            <div className="p-4 bg-white shadow-sm rounded-4 text-center h-100 card-hover">
              <FaUtensils className="fs-1 text-warning mb-2" />
              <h5 className="fw-bold">Kitchen Display</h5>
              <p className="text-dark fw-medium small">Monitor cooking status and orders</p>
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-3">
          <Link to="/admin/managemenu" className="text-decoration-none" style={{ color: "inherit" }}>
            <div className="p-4 bg-white shadow-sm rounded-4 text-center h-100 card-hover">
              <FiClipboard className="fs-1 text-info  mb-2" />
              <h5 className="fw-bold">Manage Menu Items</h5>
              <p className="text-dark fw-medium small">Manage food categories and items</p>
            </div>
          </Link>
        </div>


        <div className="col-12 col-md-3">
          <Link
            to="/admin/billing"
            className="text-decoration-none"
            style={{ color: "inherit" }}
          >
            <div className="p-4 bg-white shadow-sm rounded-4 text-center h-100 card-hover">

              <span className="fs-1 text-success mb-2 fw-semibold">₹</span>
              <h5 className="fw-bold">Billing & Reports</h5>
              <p className="text-dark fw-medium small">View revenue and generate bills</p>
            </div>
          </Link>
        </div>
      </div>
    </div>

  );
}

export default Dashboard;
