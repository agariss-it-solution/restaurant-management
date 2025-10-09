// src/components/AppNavbar.jsx

import React, { useState, useEffect } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { logout } from "../config/api";
import logo from "../Images/Untitled design.png";
import { toast } from "react-toastify";

export default function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() => {
    const savedState = localStorage.getItem("mobileMenuState");
    return savedState ? JSON.parse(savedState) : false;
  });

  // 🔓 Manual logout
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

  // Persist mobile menu toggle
  useEffect(() => {
    localStorage.setItem("mobileMenuState", JSON.stringify(isMobileMenuOpen));
  }, [isMobileMenuOpen]);

  // Hide empty language option
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `.goog-te-combo option[value=""] { display: none !important; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Initialize Google Translate
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.translate?.TranslateElement) {
        const alreadyInitialized = document.querySelector('#google_translate_element .goog-te-gadget');

        if (!alreadyInitialized) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,gu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          }, 'google_translate_element');
        }

        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Move translate element to mobile
  useEffect(() => {
    const sourceEl = document.querySelector("#google_translate_element");
    const targetEl = document.querySelector("#google_translate_element_mobile");

    if (isMobileMenuOpen && sourceEl && targetEl && sourceEl.childNodes.length > 0) {
      setTimeout(() => {
        targetEl.innerHTML = "";
        targetEl.appendChild(sourceEl.firstChild);
      }, 100);
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <>
      <Navbar expand="md" bg="white" className="shadow-sm py-3 px-4">
        <Container fluid className="d-flex justify-content-between align-items-center">
          <Navbar.Brand className="fw-bold text-success d-flex align-items-center gap-2">
            <img
              src={logo}
              alt="MK'S Food Logo"
              style={{ width: '50px', height: '50px', objectFit: 'contain' }}
            />
            <div className="d-flex flex-column lh-sm">
              <span>MK'S Food</span>
              <small className="text-dark fw-medium">waiter interface</small>
            </div>
          </Navbar.Brand>

          {/* Desktop Navigation */}
          <Nav className="mx-auto d-none d-md-flex gap-4">
            <Nav.Link as={Link} to="/waiter" className={`fw-bold ${currentPath === "/waiter" ? "text-success" : "text-dark"}`}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/tables" className={`fw-bold ${/^(\/tables|\/menu\/\d+)$/.test(currentPath) ? "text-success" : "text-dark"}`}>
              Tables
            </Nav.Link>
            <Nav.Link as={Link} to="/waiter/orders" className={`fw-bold ${currentPath.startsWith("/waiter/orders") ? "text-success" : "text-dark"}`}>
              Orders
            </Nav.Link>
          </Nav>

          {/* Desktop Actions */}
          <div className="d-none d-md-flex align-items-center gap-3">
            <div id="google_translate_element" style={{ minWidth: 120 }}></div>
            <Button variant="outline-dark" size="sm" onClick={handleLogout}>
              <FiLogOut className="me-1" /> Logout
            </Button>
          </div>

          {/* Mobile Toggle Button */}
          <div className="d-md-none">
            <span
              className="fw-bold"
              onClick={toggleMobileMenu}
              style={{ fontSize: '1.6rem', cursor: 'pointer' }}
            >
              ☰
            </span>
          </div>
        </Container>
      </Navbar>

      {/* --- Mobile Sidebar --- */}
      {isMobileMenuOpen && (
        <div
          className="position-fixed top-0 end-0 h-100 bg-white shadow"
          style={{ width: "280px", zIndex: 1050, overflowY: "auto" }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-2 py-3 border-bottom">
            <img src={logo} alt="MK'S Food Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            <div className="fw-bold text-success fs-5 text-start ps-2  flex-grow-1">MK'S Food</div>
            <span onClick={toggleMobileMenu} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>✕</span>
          </div>

          {/* Body */}
          <div className="d-flex flex-column px-3 gap-3 mt-3">
            <Nav.Link
              as={Link}
              to="/waiter"
              onClick={toggleMobileMenu}
              className={`fw-bold py-2 px-3 rounded ${currentPath === "/waiter" ? "bg-success text-white" : "text-dark"}`}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/tables"
              onClick={toggleMobileMenu}
              className={`fw-bold py-2 px-3 rounded ${/^(\/tables|\/menu\/\d+)$/.test(currentPath) ? "bg-success text-white" : "text-dark"}`}
            >
              Tables
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/waiter/orders"
              onClick={toggleMobileMenu}
              className={`fw-bold py-2 px-3 rounded ${currentPath.startsWith("/waiter/orders") ? "bg-success text-white" : "text-dark"}`}
            >
              Orders
            </Nav.Link>

            <div className="border-top pt-3 mt-3 d-flex flex-column gap-2">
              <div id="google_translate_element_mobile" style={{ minHeight: '30px', minWidth: '120px' }}></div>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  toggleMobileMenu();
                  handleLogout();
                }}
                className="fw-bold"
              >
                <FiLogOut className="me-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
