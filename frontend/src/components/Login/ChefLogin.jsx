// src/components/WaiterLogin.jsx
import React, { useState } from "react";
import { Eye, EyeSlash, PersonFill } from "react-bootstrap-icons";
import { loginUser } from "../config/api";
import { useNavigate } from "react-router-dom";

const WaiterLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();


  // ✅ Email validation function
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  const handleSubmit = async (e) => {
    // Input validations
    if (!email || !validateEmail(email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("🚀 Sending login request:", { email, password });


      const res = await loginUser({ email, password });
      console.log("📥 API Response:", res);


      const token = res?.data?.token;
      const role = res?.data?.role;
      const userEmail = res?.data?.email;

      if (token) {

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("email", userEmail);

        setMessage("✅ Login successful");
        console.log("🎉 Login success:", token);

        // ✅ Redirect based on role
        if (role === "chef") {
          navigate("/kitchen", { replace: true });

        } else {
          setMessage("❌ Only chef can login here");
        }
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
  return (
    <div style={{  height: "600px",display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: "60px", height: "60px", background: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <div className="fs-1 text-warning mb-3">👨‍🍳</div>
          </div>
          <h3 style={{ marginTop: "15px", fontWeight: "bold" }}>Chef Login</h3>
          <p style={{ color: "#6b7280" }}>Access waiter interface</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
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

          {/* Password Field */}
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

            {/* Eye Icon Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
              }}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
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


        {message && <p style={{ marginTop: "15px", textAlign: "center", color: message.includes("✅") ? "green" : "red" }}>{message}</p>}


      </div>
    </div>
  );
};

export default WaiterLogin;
