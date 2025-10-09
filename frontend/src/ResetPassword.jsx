import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "./components/config/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { Eye, EyeSlash } from "react-bootstrap-icons";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const urlEmail = searchParams.get("email");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Set the email automatically from the URL, if present
  useEffect(() => {
    if (!token || !urlEmail) {
      setError("Token or email is missing in the URL.");
      return;
    }
    setEmail(urlEmail);
  }, [urlEmail, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validating inputs before calling API
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (!email || !token) {
      setError("Email or Token is missing.");
      return;
    }

    setLoading(true);
    try {
      // Pass the email, token, and new password to reset the password
      const res = await resetPassword(email, token, newPassword);
      setMessage(res.message || "Password reset successfully.");
      setTimeout(() => navigate("/"), 2500);  // Redirect to login page after success
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100 ">
      <div className="col-md-6 col-lg-5 shadow-lg p-4 bg-white rounded">
        <h3 className="text-center mb-4">🔐 Reset Password</h3>

        {/* Display message or error */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit}>
          {/* Email field (disabled, auto-filled from URL) */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              disabled
              placeholder="Email (auto-filled)"
            />
          </div>

          {/* New Password field */}
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
