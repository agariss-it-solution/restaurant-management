import React, { useState } from "react";
import { Eye, EyeSlash, PersonFill } from "react-bootstrap-icons";
import { loginUser, resetrequst } from "../config/api";
import { useNavigate } from "react-router-dom";

const WaiterLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Email validation function
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // 🔐 Login Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Input validations
    if (!email || !validateEmail(email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      const token = res?.data?.token;
      const role = res?.data?.role;

      if (token && role === "admin") {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        setMessage("✅ Login successful");
        navigate("/admin", { replace: true });
      } else {
        setMessage("❌ Only admin can login here");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err?.response?.data?.message ||
        "❌ Invalid email or password.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Forgot Password Handler
  const handleForgotPassword = async () => {
    setForgotMessage("");

    if (!email || !validateEmail(email)) {
      setForgotMessage("❌ Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await resetrequst(email);
      console.log("✅ Reset email response:", res);
      setForgotMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("❌ Reset email error:", err);
      setForgotMessage(
        err?.response?.data?.message ||
          "❌ Failed to send reset email. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "600px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
        {/* Header */}
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
            <div className="fs-1 text-purple mb-3">👑</div>
          </div>
          <h3 style={{ marginTop: "15px", fontWeight: "bold" }}>Admin  Login</h3>
        </div>

        {/* Login Form */}
        {!showForgot ? (
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
  <div
    style={{
      position: "relative",
      width: "100%",
      marginBottom: "15px",
    }}
  >
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      style={{
        width: "100%",
        padding: "10px 40px 10px 12px", // space for icon
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
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
    }}
  >
    {loading ? (
      "Signing in..."
    ) : (
      <>
        <PersonFill className="me-2" /> Sign In
      </>
    )}
  </button>

  <p
    style={{
      marginTop: "12px",
      textAlign: "center",
      cursor: "pointer",
      color: "#2563eb",
      fontWeight: "500",
    }}
    onClick={() => {
      setShowForgot(true);
      setMessage("");
    }}
  >
    Forgot Password?
  </p>
</form>

        ) : (
          // 🔁 Forgot Password UI
          <div style={{ textAlign: "center" }}>
            <p>Enter your email to reset your password</p>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                margin: "6px 0 15px 0",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />

            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              style={{
                width: "100%",
                background: "#9333ea",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <p
              style={{
                marginTop: "12px",
                textAlign: "center",
                cursor: "pointer",
                color: "#6b7280",
              }}
              onClick={() => {
                setShowForgot(false);
                setForgotMessage("");
              }}
            >
              ← Back to Login
            </p>

            {forgotMessage && (
              <p
                style={{
                  marginTop: "15px",
                  textAlign: "center",
                  color: forgotMessage.includes("✅") ? "green" : "red",
                }}
              >
                {forgotMessage}
              </p>
            )}
          </div>
        )}

        {/* Final Message (for login only) */}
        {message && !showForgot && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              color: message.includes("✅") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default WaiterLogin;
