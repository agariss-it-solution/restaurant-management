// src/components/WaiterLogin.jsx
import React, { useState, useEffect } from "react";
import { Eye, EyeSlash, PersonFill } from "react-bootstrap-icons";
import { loginUser } from "../config/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const WaiterLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Check if already logged in and set auto logout timer
  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("tokenExpiry");

    if (token && expiry) {
      const now = new Date().getTime();
      if (now < Number(expiry)) {
        navigate("/waiter", { replace: true });

        // Calculate remaining time until expiry and set logout timer
        const timeout = Number(expiry) - now;
        const timerId = setTimeout(() => {
          localStorage.clear();
          toast.info("🔒 Session expired. Please login again.");
          navigate("/login/waiter", { replace: true });
        }, timeout);

        return () => clearTimeout(timerId);
      } else {
        // Token expired, clear storage
        localStorage.clear();
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/\S+@\S+\.\S+/.test(email)) {
      return toast.error("❌ Please enter a valid email address.");
    }

    if (password.length < 6) {
      return toast.error("❌ Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      const token = res?.data?.token;
      const role = res?.data?.role;
      const userEmail = res?.data?.email;

      if (token && role === "waiter") {
        // Set expiry time 24 hours from now (in ms)
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("email", userEmail);
        localStorage.setItem("tokenExpiry", expiryTime.toString());

        // Set auto logout timer
        setTimeout(() => {
          localStorage.clear();
          toast.info("🔒 Session expired. Please login again.");
          navigate("/login/waiter", { replace: true });
        }, 24 * 60 * 60 * 1000); // 24 hours in ms

        toast.success("Login successful!");
        navigate("/waiter", { replace: true });
      } else {
        toast.error(" Only waiter can login here.");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg =
        err?.response?.data?.message || "❌ Invalid email or password.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f3f4f6",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "#e0e7ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <div className="fs-1 text-primary mb-3">🧑‍💼</div>
          </div>
          <h3 style={{ marginTop: "15px", fontWeight: "bold" }}>Waiter Login</h3>
          <p style={{ color: "#6b7280" }}>Access waiter interface</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              margin: "6px 0 15px 0",
              borderRadius: "8px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
              fontSize: "15px",
            }}
          />

          <label>Password</label>
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                boxSizing: "border-box",
                fontSize: "15px",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "15px",
            }}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <PersonFill /> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WaiterLogin;
