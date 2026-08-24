// src/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encryptData } from "./utils/crypto";
import "./Login.css";

const Register = () => {
  const navigate = useNavigate();

  // Initialize users in localStorage if missing
  React.useEffect(() => {
    if (!localStorage.getItem("users")) {
      localStorage.setItem("users", JSON.stringify([]));
      console.log("Initialized users in localStorage");
    }
  }, []);

  const [formData, setFormData] = useState({
    loginName: "",
    username: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation State for Login Name
  const [loginNameError, setLoginNameError] = useState("");

  // --- Validation Helpers ---
  const validateEnglishOnly = (text) => {
    // Allows English letters, numbers, underscores, periods, and hyphens
    const regex = /^[A-Za-z0-9_.-]+$/;
    return regex.test(text);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Real-time Login Name validation
    if (id === "loginName") {
      if (value && !validateEnglishOnly(value)) {
        setLoginNameError(
          "Login name can only use English letters, numbers, and symbols (_, ., -).",
        );
      } else {
        setLoginNameError("");
      }
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
    console.log(`Input change - ${id}: ${value}`);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check English-only Login Name before submission
    if (!validateEnglishOnly(formData.loginName)) {
      setLoginNameError(
        "Login Name can only use English characters, numbers, and symbols (_, ., -).",
      );
      return;
    }

    setLoading(true);
    console.log("Registration started");

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Existing users:", users);

      // Check for duplicate loginName (case-insensitive check is often safer)
      const duplicate = users.some(
        (u) =>
          u.loginName.trim().toLowerCase() ===
          formData.loginName.trim().toLowerCase(),
      );
      if (duplicate) {
        console.log("Duplicate loginName found:", formData.loginName);
        setError("Login Name already exists");
        setLoading(false);
        return;
      }

      // Encrypt password
      const encryptedPassword = encryptData(formData.password);
      console.log("Encrypted password:", encryptedPassword);

      // Create new user object
      const newUser = {
        ...formData,
        loginName: formData.loginName.trim(),
        password: encryptedPassword,
      };
      users.push(newUser);

      // Save back to localStorage
      localStorage.setItem("users", JSON.stringify(users));
      console.log("User saved:", newUser);
      console.log("All users after save:", users);

      // Show success message
      setTimeout(() => {
        setSuccess("Registration successful! You can now log in.");
        setLoading(false);
        console.log("Registration successful");
      }, 500);
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration");
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleRegister}>
          {/* Input fields */}
          <div className="form-group">
            <label htmlFor="loginName">
              Login Name (English letters, numbers, and _ . - only)
            </label>
            <input
              type="text"
              id="loginName"
              value={formData.loginName}
              onChange={handleChange}
              className={`form-input ${loginNameError ? "input-error" : ""}`}
              required
            />
            {loginNameError && (
              <p style={{ color: "red", fontSize: "11px", marginTop: "5px" }}>
                {loginNameError}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username">User Name</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading || !!loginNameError}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <button onClick={handleBackToLogin}>Back to Login</button>
      </div>
    </div>
  );
};

export default Register;
