import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../Images/Untitled design.png";
import "../../App.css"

function Home() {
  const navigate = useNavigate();

  const buttonStyle = {
   
    border: "none",
    borderRadius: "8px",
    width: "100%",
    height: "50px",
    cursor: "pointer",
  };

  return (
    <div className=" py-5" style={{ overflowX: "hidden", overflowY: "auto" }}>
      <div className="container">
        <h3 className="fw-bold text-success text-center mb-4 d-flex justify-content-center align-items-center gap-2">
          <img
            src={logo}
            alt="MK'S Food Logo"
            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
          />
          MK'S Food
        </h3>

        <p className="lead text-dark fw-medium text-center mb-5">
          Choose your role to manage restaurant operations
        </p>

        <div className="row g-4 justify-content-center align-items-stretch">
          {/* Owner Card */}
          <div className="col-12 col-md-6 col-lg-4 d-flex">
            <div
              className="w-100 text-center border-0 rounded shadow-sm card-owner d-flex flex-column justify-content-between"
              style={{
                backgroundColor: "#F0E0FF",
                padding: "20px",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                <div className="fs-1 text-purple mb-3">👑</div>
                <div className="fw-bold responsive-heading">Admin  </div>
                <div className="text-dark fw-medium responsive-subtitle">
                  Full access to all restaurant operations, orders, kitchen, and billing
                </div>
                <ul className="list-unstyled text-start responsive-text mt-3">
                  <li>✔ View all table orders</li>
                  <li>✔ Monitor kitchen operations</li>
                  <li>✔ Billing & revenue reports</li>
                  <li>✔ Staff management</li>
                  <li>✔ Complete restaurant oversight</li>
                </ul>
              </div>
              <button
                className="coustom-button mt-4 fw-semibold"
                style={{ ...buttonStyle, backgroundColor: "#8A4FFF" }}
                onClick={() => navigate("/login/owner")}
              >
                Login as Owner (Admin)
              </button>
            </div>
          </div>

          {/* Waiter Card */}
          <div className="col-12 col-md-6 col-lg-4 d-flex">
            <div
              className="w-100 text-center border-0 rounded shadow-sm d-flex flex-column justify-content-between"
              style={{
                backgroundColor: "#C0E6FF",
                padding: "20px",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                <div className="fs-1 text-primary mb-3">🧑‍💼</div>
                <div className="fw-bold responsive-heading">Waiter</div>
                <div className="text-dark fw-medium responsive-subtitle">
                  Take orders, manage tables, and handle customer service
                </div>
                <ul className="list-unstyled text-start responsive-text mt-3">
                  <li>✔ Table management</li>
                  <li>✔ Order taking</li>
                  <li>✔ Menu browsing</li>
                  <li>✔ Order status tracking</li>
                  <li>✔ Customer notifications</li>
                </ul>
              </div>
              <button
                className="coustom-button mt-4 fw-semibold"
                style={{ ...buttonStyle, backgroundColor: "#5DA9FF" }}
                onClick={() => navigate("/login/waiter")}
              >
                Login as Waiter
              </button>
            </div>
          </div>

          {/* Chef Card */}
          <div className="col-12 col-md-6 col-lg-4 d-flex">
            <div
              className="w-100 text-center border-0 rounded shadow-sm d-flex flex-column justify-content-between"
              style={{
                backgroundColor: "#FFF3D9",
                padding: "20px",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                <div className="fs-1 text-warning mb-3">👨‍🍳</div>
                <div className="fw-bold responsive-heading">Chef (Kitchen)</div>
                <div className="text-dark fw-medium responsive-subtitle">
                  Manage kitchen operations and food preparation
                </div>
                <ul className="list-unstyled text-start responsive-text mt-3">
                  <li>✔ Order queue management</li>
                  <li>✔ Cooking status updates</li>
                  <li>✔ Kitchen display system</li>
                  <li>✔ Food preparation tracking</li>
                  <li>✔ Order completion</li>
                </ul>
              </div>
              <button
                className="coustom-button mt-4 fw-semibold"
                style={{ ...buttonStyle, backgroundColor: "#FF7F50" }}
                onClick={() => navigate("/login/chef")}
              >
                Login as Chef (Kitchen)
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-dark fw-medium mt-5 small">
          © 2025 MK'S Food System
        </footer>
      </div>
    </div>
  );
}

export default Home;
