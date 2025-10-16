import React, { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiBell,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiKey,
} from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { logout, resetrequst } from "../config/api";
import logo from "../Images/Untitled design.png";
import "../../App.css";
import SettingsModal from "./SettingsModal";
import { toast } from "react-toastify";

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // ─── UI States ────────────────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ─── Forgot Password States ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // ─── Nav Links Configuration ────────────────────────────────────────────────
  const navLinks = [
    { to: "/admin/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/admin/tables", icon: <FiUsers />, label: "Tables" },
    { to: "/admin/orders", icon: <FiClipboard />, label: "Orders" },
    { to: "/admin/kitchen", icon: <FiBell />, label: "Kitchen" },
    { to: "/admin/billing", icon: <FiDollarSign />, label: "Billing" },
    { to: "/admin/analytics", icon: <FiBarChart2 />, label: "Analytics" },
  ];

  // ─── Sidebar & Modal Handlers ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error.message);
    } finally {
      localStorage.clear();
      toast.success("👋 Logged out successfully.");
      navigate("/", { replace: true });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setForgotMessage("❌ Please enter your email");
      return;
    }

    try {
      setForgotLoading(true);
      await resetrequst(email);
      setForgotMessage("✅ Reset link sent to your email");

      setTimeout(() => {
        setShowPasswordModal(false);
        setForgotMessage("");
        setEmail("");
      }, 1500);
    } catch (err) {
      console.error("Forgot password failed:", err.message);
      setForgotMessage(err.message || "❌ Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Google Translate Setup ─────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `.goog-te-combo option[value=""] { display: none !important; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.translate?.TranslateElement) {
        const alreadyInitialized = document.querySelector(
          "#google_translate_element .goog-te-gadget"
        );

        if (!alreadyInitialized) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,hi,gu",
              layout:
                window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            "google_translate_element"
          );
        }

        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // ─── Clone Translator for Mobile ────────────────────────────────────────────
  useEffect(() => {
    const sourceEl = document.querySelector("#google_translate_element");
    const targetEl = document.querySelector("#google_translate_element_mobile");

    if (showSidebar && sourceEl && targetEl && sourceEl.childNodes.length > 0) {
      setTimeout(() => {
        targetEl.innerHTML = "";
        targetEl.appendChild(sourceEl.firstChild);
      }, 100);
    }
  }, [showSidebar]);

  // ─── JSX Output ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── Top Navbar ─────────────────────────────────────────────────────── */}
      <Navbar expand="lg" bg="white" className="shadow-sm py-3">
        <Container fluid>
          {/* Brand */}
          <Navbar.Brand className="fw-bold text-success d-flex align-items-center gap-2">
            <img
              src={logo}
              alt="MK'S Food Logo"
              style={{ width: "50px", height: "50px", objectFit: "contain" }}
            />
            <div className="d-flex flex-column lh-sm">
              <span>MK'S Food</span>
              <small className="text-dark fw-medium">Admin Panel</small>
            </div>
          </Navbar.Brand>

          {/* Desktop Navigation */}
          <Nav className="mx-auto d-none d-lg-flex gap-4 text-center">
            {navLinks.map((link) => (
              <Nav.Link
                key={link.to}
                as={NavLink}
                to={link.to}
                className={`fw-bold ${
                  currentPath === link.to ? "text-success" : "text-dark"
                }`}
              >
                {link.icon} {link.label}
              </Nav.Link>
            ))}
          </Nav>

          {/* Right-side Actions */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <div id="google_translate_element" style={{ minWidth: "120px" }} />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <FiSettings className="me-1" /> Settings
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
            >
              <FiKey className="me-1" /> Forgot Password
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleLogout}>
              <FiLogOut className="me-1" /> Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="outline-dark"
            size="sm"
            className="d-lg-none"
            onClick={() => setShowSidebar(true)}
          >
            <FiMenu size={20} />
          </Button>
        </Container>
      </Navbar>

      {/* ─── Mobile Sidebar ─────────────────────────────────────────────────── */}
      {showSidebar && (
        <div
          className="d-lg-none position-fixed top-0 end-0 h-100 bg-white shadow"
          style={{ width: "280px", zIndex: 1050, overflowY: "auto" }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-2 py-3 border-bottom">
            <img
              src={logo}
              alt="MK'S Food Logo"
              style={{ width: "50px", height: "50px", objectFit: "contain" }}
            />
            <div className="fw-bold text-success fs-5 ps-2 flex-grow-1">
              MK'S Food
            </div>
            <span
              onClick={() => setShowSidebar(false)}
              style={{ fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </span>
          </div>

          {/* Sidebar Body */}
          <div className="p-3">
            <Nav className="flex-column gap-2">
              {navLinks.map((link) => (
                <Nav.Link
                  key={link.to}
                  as={NavLink}
                  to={link.to}
                  onClick={() => setShowSidebar(false)}
                  className={`fw-bold py-2 px-3 rounded d-flex align-items-center gap-2 ${
                    currentPath === link.to
                      ? "bg-primary text-white"
                      : "text-dark"
                  }`}
                >
                  {link.icon} {link.label}
                </Nav.Link>
              ))}
            </Nav>

            <div className="mt-4 border-top pt-3 d-flex flex-column gap-2">
              <div
                id="google_translate_element_mobile"
                style={{ minHeight: "30px", minWidth: "120px" }}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={() => {
                  setShowSidebar(false);
                  setShowSettingsModal(true);
                }}
              >
                <FiSettings /> Settings
              </Button>
              <Button
                variant="outline-warning"
                className="d-flex align-items-center gap-2"
                onClick={() => {
                  setShowSidebar(false);
                  setShowPasswordModal(true);
                }}
              >
                <FiKey /> Manage Password
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={handleLogout}
              >
                <FiLogOut /> Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ─────────────────────────────────────────────────── */}
      <SettingsModal
        show={showSettingsModal}
        onHide={() => setShowSettingsModal(false)}
      />

      {/* ─── Forgot Password Modal ──────────────────────────────────────────── */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Forgot Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <p>Select role and enter your email to reset password</p>

            <Form.Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mb-3"
            >
              <option value="admin">Admin</option>
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
            </Form.Select>

            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
            />

            <Button
              variant="primary"
              className="w-100 fw-bold"
              disabled={forgotLoading}
              onClick={handleForgotPassword}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            {forgotMessage && (
              <p
                className={`mt-3 text-center fw-semibold ${
                  forgotMessage.includes("✅") ? "text-success" : "text-danger"
                }`}
              >
                {forgotMessage}
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPasswordModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AdminNavbar;
