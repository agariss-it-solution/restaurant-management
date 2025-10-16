// Dashboard.jsx
import React from "react";
import {
  FiUsers,
  FiClipboard,
  FiClock,
  FiGlobe,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import '../../App.css'

function Dashboard() {
      const navigate = useNavigate();
  return (
    <div className="container">
   

      {/* CONTENT */}
      <div className="py-5 text-center">
        <h2 className="fw-bold">Welcome to MK'S Food</h2>
        <p className="text-dark fw-medium">
          Please select your role to access the appropriate interface
        </p>

        {/* ACTION CARDS */}
       <div className="mt-4">
      <div className="row justify-content-center g-4">
        {/* Card 1 */}
        <div className="col-12 col-sm-6 col-md-4">
          <div className="h-100 shadow-sm border-0 rounded-4 text-center py-4 px-2 border-start border-5 border-success bg-white" 
            onClick={() => navigate("/tables")}
            role="button">
            <div className="fs-1 text-success">
              <FiUsers />
            </div>
            <div className="fw-bold fs-5 mt-2">Manage Tables</div>
            <div className="text-dark fw-medium small">view table status</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="col-12 col-sm-6 col-md-4">
          <div className="h-100 shadow-sm border-0 rounded-4 text-center py-4 px-2 border-start border-5 border-primary bg-white"
           onClick={() => navigate("/waiter/orders")}  role="button">
            <div className="fs-1 text-primary">
              
              <FiClipboard />
            </div>
            <div className="fw-bold fs-5 mt-2">View Orders</div>
            <div className="text-dark fw-medium small">track all orders</div>
          </div>
        </div>

      
      </div>
    </div>

       
      </div>
    </div>
  );
}

export default Dashboard;
