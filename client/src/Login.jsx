import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api"; // 引入雲端後端大網關 API
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginName: "",
    password: "",
    captchaAnswer: "",
  });
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  // Validation States for Login Form
  const [loginFormError, setLoginFormError] = useState("");

  // Validation States for Registration Form
  const [passwordError, setPasswordError] = useState("");
  const [loginNameError, setLoginNameError] = useState("");

  const [regFormData, setRegFormData] = useState({
    loginName: "",
    username: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });

  // 人類驗證碼狀態 (Captcha)
  const [captcha, setCaptcha] = useState({ captchaId: "", question: "" });

  // --- 頁面載入時：自動獲取雲端人類驗證碼 ---
  useEffect(() => {
    fetchCaptchaChallenge();
  }, []);

  const fetchCaptchaChallenge = async () => {
    try {
      const data = await api.getCaptcha();
      setCaptcha(data);
    } catch (err) {
      console.error("無法取得驗證碼:", err);
    }
  };

  // --- Validation Helpers ---

  const validateEnglishOnly = (text) => {
    // Allows English letters, numbers, underscores, periods, and hyphens
    const regex = /^[A-Za-z0-9_.-]+$/;
    return regex.test(text);
  };

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{14,}$/;
    return regex.test(password);
  };

  // ⚠️ 嚴格遵循指示：完全不更改此部分
  const validateEmail = (email) => {
    const allowedDomains = [
      "@icloud.com",
      "@gmail.com",
      "@yahoo.com",
      "@hotmail.com",
      "@outlook.com",
    ];
    const lowerEmail = email.toLowerCase();
    return allowedDomains.some((domain) => lowerEmail.endsWith(domain));
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Real-time check for login form login name
    if (id === "loginName") {
      if (value && !validateEnglishOnly(value)) {
        setLoginFormError(
          "Login name can only use English letters, numbers, and symbols (_, ., -).",
        );
      } else {
        setLoginFormError("");
      }
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRegChange = (e) => {
    const { id, value } = e.target;

    // Real-time Login Name check for registration
    if (id === "loginName") {
      if (value && !validateEnglishOnly(value)) {
        setLoginNameError(
          "Login name can only use English letters, numbers, and symbols (_, ., -).",
        );
      } else {
        setLoginNameError("");
      }
    }

    // Real-time Password check
    if (id === "password") {
      if (value && !validatePassword(value)) {
        setPasswordError(
          "Min 14 chars: need Uppercase, Lowercase, Number, and Symbol (@$!%*?&#)",
        );
      } else {
        setPasswordError("");
      }
    }

    setRegFormData((prev) => ({ ...prev, [id]: value }));
  };

  // --- 核心：處理雲端登入 ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEnglishOnly(formData.loginName)) {
      setLoginFormError("Login name must use English characters only.");
      return;
    }

    try {
      // 呼叫 Render 後端登入 API
      const res = await api.login({
        loginName: formData.loginName,
        password: formData.password,
        captchaId: captcha.captchaId,
        captchaAnswer: formData.captchaAnswer,
      });

      if (res.error) {
        setError(res.error);
        fetchCaptchaChallenge(); // 登入失敗自動刷新
      } else {
        localStorage.setItem("token", res.token);
        localStorage.setItem("currentUser", res.username);
        if (onLoginSuccess) onLoginSuccess(res.username);
        navigate("/dashboard");
      }
    } catch (err) {
      setError("System error: Could not verify credentials via cloud.");
    }
  };

  // --- 核心：處理忘記密碼與 2FA 雙重核驗變更密碼 ---
  const handleForgotPassword = async () => {
    const loginNameInput = prompt("Please enter your Login Name:");
    if (!loginNameInput) return;

    if (!validateEnglishOnly(loginNameInput)) {
      alert("Login name must use English characters only.");
      return;
    }

    const dobCheck = prompt(
      "Security Check: Verify Date of Birth (YYYY-MM-DD):",
    );
    const emailcheck = prompt("Security Check: Verify Email:");

    try {
      const checkRes = await api.forgotVerify({
        loginName: loginNameInput,
        dateOfBirth: dobCheck,
        email: emailcheck,
      });

      if (checkRes.error) {
        alert(checkRes.error);
        return;
      }

      alert(
        `${checkRes.message} \n[System Debug Hint] Your 2FA Verification Code is: ${checkRes.debug_code}`,
      );

      const securityCodeInput = prompt(
        "Please enter the 6-digit 2FA Security Code:",
      );
      const newPasswordInput = prompt(
        "Verified! Enter new password (min 14 chars, complex):",
      );

      if (!validatePassword(newPasswordInput)) {
        alert(
          "Password rejected! Must be 14+ characters with uppercase, lowercase, numbers, and symbols.",
        );
        return;
      }

      const resetRes = await api.resetPassword({
        loginName: loginNameInput,
        securityCode: securityCodeInput,
        newPassword: newPasswordInput,
      });

      if (resetRes.error) {
        alert(resetRes.error);
      } else {
        alert("Password updated successfully via Cloud 2FA Secure Pipeline!");
      }
    } catch (err) {
      alert("Failed to communicate with the authorization server.");
    }
  };

  // --- 核心：處理雲端帳戶註冊 ---
  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Check English-only Login Name
    if (!validateEnglishOnly(regFormData.loginName)) {
      setLoginNameError(
        "Login Name can only use English characters, numbers, and symbols (_, ., -).",
      );
      return;
    }

    // 3. Check Password Complexity
    if (!validatePassword(regFormData.password)) {
      alert("Password does not meet security requirements.");
      return;
    }

    // 4. Check Email Domain
    if (!validateEmail(regFormData.email)) {
      alert(
        "Invalid Email. Please use @iCloud, @gmail, @yahoo, @hotmail, or @outlook.",
      );
      return;
    }

    try {
      const res = await api.register(regFormData);
      if (res.error) {
        setLoginNameError(res.error);
      } else {
        alert(
          "Registration successful! Account generated permanently in Cloud.",
        );
        setShowRegister(false);
        setPasswordError("");
        setLoginNameError("");
      }
    } catch (err) {
      alert("Error during cloud registration sequence.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Secure Login</h2>
          <p>Access your personal dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="loginName">Login Name (English only)</label>
            <input
              type="text"
              id="loginName"
              className={`form-input ${loginFormError ? "input-error" : ""}`}
              placeholder="Enter login name"
              value={formData.loginName}
              onChange={handleChange}
              required
            />
            {loginFormError && (
              <p style={{ color: "red", fontSize: "11px", marginTop: "5px" }}>
                {loginFormError}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* 人類防護驗證區塊 (CAPTCHA) */}
          <div
            className="form-group captcha-wrapper"
            style={{
              marginTop: "15px",
              background: "#f5f5f7",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #d2d2d7",
            }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#1d1d1f",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {captcha.question || "Loading security verification..."}
            </label>
            <input
              type="number"
              id="captchaAnswer"
              className="form-input"
              placeholder="Enter calculated result"
              value={formData.captchaAnswer}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  captchaAnswer: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="button-stack">
            <button
              type="submit"
              className="btn btn-login"
              disabled={!!loginFormError}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn btn-forgot"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
            <hr className="divider" />
            <button
              type="button"
              className="btn btn-register"
              onClick={() => setShowRegister(true)}
            >
              Create New Account
            </button>
          </div>
        </form>
      </div>

      {/* ⚠️ 嚴格遵循指示：以下整個區塊百分之百完全複製保留，不做任何修改 */}
      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register New User</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="registerLoginName">
                  Login Name (English letters, numbers, and _ . - only)
                </label>
                <input
                  type="text"
                  id="registerLoginName"
                  value={regFormData.loginName}
                  onChange={(e) => {
                    const cleanedValue = e.target.value.replace(
                      /[^a-zA-Z0-9_.-]/g,
                      "",
                    );
                    setLoginNameError(
                      e.target.value !== cleanedValue
                        ? "Login name can only use English letters, numbers, and symbols (_, ., -)."
                        : "",
                    );
                    setRegFormData((prev) => ({
                      ...prev,
                      loginName: cleanedValue,
                    }));
                  }}
                  className={`form-input ${loginNameError ? "input-error" : ""}`}
                  required
                />
                {loginNameError && (
                  <p
                    style={{ color: "red", fontSize: "11px", marginTop: "5px" }}
                  >
                    {loginNameError}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="username">Display Name</label>
                <input
                  type="text"
                  id="username"
                  value={regFormData.username}
                  onChange={handleRegChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="registerPassword">
                  Password (Min 14 chars, Uppercase, Lowercase, Number, Symbol)
                </label>
                <input
                  type="password"
                  id="registerPassword"
                  value={regFormData.password}
                  onChange={(e) =>
                    handleRegChange({
                      target: { id: "password", value: e.target.value },
                    })
                  }
                  className={`form-input ${passwordError ? "input-error" : ""}`}
                  required
                />
                {passwordError && (
                  <p
                    style={{ color: "red", fontSize: "11px", marginTop: "5px" }}
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={regFormData.dateOfBirth}
                  onChange={handleRegChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email (@gmail, @icloud, @hotmail, @outlook, @yahoo)
                </label>
                <input
                  type="email"
                  id="email"
                  value={regFormData.email}
                  onChange={handleRegChange}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-login"
                disabled={!!loginNameError || !!passwordError}
              >
                Register
              </button>
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
