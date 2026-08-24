import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import LibrarySystem from "./LibrarySystem";
import Blog from "./Blog";

// 保留你原本的天氣與其餘組件引用 (如果沒用到可以放著不影響)
import AirportWeather from "./components/AirportWeather";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // 初始化檢查雲端登入狀態憑證
  useEffect(() => {
    const token = localStorage.getItem("token");
    const cachedUser = localStorage.getItem("currentUser");

    if (token && cachedUser) {
      setIsAuthenticated(true);
      setUserName(cachedUser);
    } else {
      setIsAuthenticated(false);
      setUserName("");
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (username) => {
    setIsAuthenticated(true);
    setUserName(username);
  };

  const handleLogout = () => {
    localStorage.clear(); // 清空所有緩存憑證
    setIsAuthenticated(false);
    setUserName("");
    window.location.href = "/"; // 物理重置回根目錄
  };

  if (loading) {
    return (
      <div style={{ color: "#fff", padding: "20px" }}>
        Loading Security Context...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 首頁路由保護：如果未登入，直接渲染 Login，拒絕使用 Navigate 導向防止死循環 */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* 核心工作路由保護 */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard userName={userName} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/library"
          element={
            isAuthenticated ? (
              <LibrarySystem userName={userName} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/Blog"
          element={isAuthenticated ? <Blog /> : <Navigate to="/" replace />}
        />

        {/* 萬能降級攔截：如果路徑打錯，一律回到首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
