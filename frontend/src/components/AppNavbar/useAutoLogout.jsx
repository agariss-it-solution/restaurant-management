// src/hooks/useAutoLogout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAutoLogout = (tokenKey = "token", checkInterval = 5000) => {
  const navigate = useNavigate();

  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const checkExpiry = () => {
      const token = localStorage.getItem(tokenKey);
      const localExpiry = localStorage.getItem("tokenExpiry");

      // If no token found → logout
      if (!token) {
        localStorage.clear();
        navigate("/waiter-login", { replace: true });
        return;
      }

      // Try to decode JWT expiry
      const decoded = parseJwt(token);
      const jwtExp = decoded?.exp ? decoded.exp * 1000 : null;

      // Prefer JWT expiry if available, otherwise fallback to local expiry
      const expiryTime = jwtExp || (localExpiry ? Number(localExpiry) : null);

      if (!expiryTime) return; // if no expiry data, skip

      if (Date.now() >= expiryTime) {
        localStorage.clear();
        navigate("/waiter-login", { replace: true });
      }
    };

    // Check immediately and every few seconds
    checkExpiry();
    const interval = setInterval(checkExpiry, checkInterval);

    return () => clearInterval(interval);
  }, [navigate, tokenKey, checkInterval]);
};
