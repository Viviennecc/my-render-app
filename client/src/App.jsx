import React, { useState, useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Login";
import Dashboard from "./Dashboard";
import LibrarySystem from "./LibrarySystem";
import Blog from "./Blog";
import AirportWeather from "./components/AirportWeather"; // --- IGNORE ---
import DOHWeather from "./components/DOHWeather"; // --- IGNORE ---
import LHRWeather from "./components/LHRWeather";

function App() {
  // Initialize state from localStorage
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("currentUser"),
  );

  // Sync state if localStorage changes in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(localStorage.getItem("currentUser"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // SUCCESSFUL LOGIN HANDLER
  const onLoginSuccess = (userDisplayName) => {
    setCurrentUser(userDisplayName);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("encrypted_user_name");
    setCurrentUser(null);
  };

  return (
    /* ADDED BASENAME HERE */
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* If logged in, "/" sends you to dashboard. If not, show Login */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={onLoginSuccess} />
            )
          }
        />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <Dashboard userName={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Protected Library */}
        <Route
          path="/library"
          element={
            currentUser ? <LibrarySystem /> : <Navigate to="/" replace />
          }
        />
        {/* Protected Blog */}
        <Route
          path="/blog"
          element={
            currentUser ? (
              <Blog userName={currentUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Protected Airport Weather */}
        <Route
          path="/AirportWeather"
          element={
            currentUser ? <AirportWeather /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/DOHWeather"
          element={currentUser ? <DOHWeather /> : <Navigate to="/" replace />}
        />
        <Route
          path="/LHRWeather"
          element={currentUser ? <LHRWeather /> : <Navigate to="/" replace />}
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
