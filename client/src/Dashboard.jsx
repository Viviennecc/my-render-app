import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "./api"; // 引入雲端後端大網關 API

// Components (完全保留你原本的組件)
import HKWeather from "./components/HKWeather";
import CalendarEmbed from "./components/CalendarEmbed";
import WorldClock from "./components/WorldClock";
import FlightAwareWidget from "./components/FlightAwareWidget";
import Appearance from "./Appearance";
import Profile from "./Profile";
import Message from "./components/SecureMessagingSystem";
import LHRWeather from "./components/LHRWeather";
import DOHWeather from "./components/DOHWeather";

import "./Dashboard.css";

const Dashboard = ({ userName: propUserName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- States ---
  const [dateTime, setDateTime] = useState(new Date());
  const [displayUserName, setDisplayUserName] = useState("Guest");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Appearance States (對接雲端)
  const [background, setBackground] = useState({
    type: "color",
    value: "#F0F2F2",
  });
  const [textColor, setTextColor] = useState("#1d1d1f");
  const [textSize, setTextSize] = useState(16);

  // Temporary States (Modals 暫存區，完全保留)
  const [tempTextColor, setTempTextColor] = useState("#1d1d1f");
  const [tempTextSize, setTempTextSize] = useState(16);
  const [tempBgColor, setTempBgColor] = useState("#F0F2F2");
  const [tempImageBase64, setTempImageBase64] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // --- 核心：從 Render PostgreSQL 雲端載入設定與用戶資料 ---
  useEffect(() => {
    if (!propUserName) return;

    const initCloudData = async () => {
      try {
        // 1. 從後端獲取該用戶的永久外觀偏好設定
        const savedSettings = await api.getSettings();

        if (
          savedSettings &&
          !savedSettings.error &&
          savedSettings.background_type
        ) {
          setBackground({
            type: savedSettings.background_type,
            value: savedSettings.background_value,
          });
          if (savedSettings.text_color) setTextColor(savedSettings.text_color);
          if (savedSettings.text_size) setTextSize(savedSettings.text_size);

          // 同步初始化彈出視窗(Modal)的暫存預設值
          setTempBgColor(savedSettings.background_value);
          setTempTextColor(savedSettings.text_color);
          setTempTextSize(savedSettings.text_size);
        }

        // 2. 設定要顯示的用戶名稱（優先使用 localStorage 緩存的當前登入者名稱）
        const cachedUser = localStorage.getItem("currentUser");
        setDisplayUserName(cachedUser || propUserName);
      } catch (err) {
        console.error("雲端數據初始化失敗:", err);
      }
    };

    initCloudData();
  }, [propUserName, location]);

  // 時鐘更新計時器
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 核心：將新設定同步寫入雲端資料庫保存 ---
  const handleFinalSave = async () => {
    let finalBg;
    if (tempImageBase64) {
      finalBg = { type: "image", value: tempImageBase64 };
    } else {
      finalBg = { type: "color", value: tempBgColor };
    }

    // 更新前端當前狀態以立即呈現效果
    setBackground(finalBg);
    setTextColor(tempTextColor);
    setTextSize(tempTextSize);

    try {
      // 發送至 Render 後端 API 永久儲存至 Postgres
      await api.saveSettings({
        background_type: finalBg.type,
        background_value: finalBg.value,
        text_color: tempTextColor,
        text_size: tempTextSize,
      });
    } catch (err) {
      console.error("同步至雲端資料庫失敗:", err);
      alert("外觀設定儲存失敗，請檢查網路連線");
    }

    setShowAppearance(false);
  };

  // 外觀容器樣式（動態綁定雲端下載的設定）
  const containerStyle = {
    color: textColor,
    fontSize: `${textSize}px`,
    minHeight: "100vh",
    backgroundColor:
      background.type === "color" ? background.value : "transparent",
    backgroundImage:
      background.type === "image" ? `url(${background.value})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    transition: "background 0.3s ease, color 0.3s ease",
  };

  // 處理背景圖片上傳（轉換為 Base64 字串以利傳輸與存入 Postgres 欄位）
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE) {
      alert("檔案太大！請選擇 10MB 以下的圖片。");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTempImageBase64(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const timeString = dateTime.toLocaleTimeString("en-GB", { hour12: false });
  const dateString = dateTime.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="lib-container" style={containerStyle}>
      {/* 側邊導航欄 - 完全保留你原有的排版與功能 */}
      <aside className="lib-sidebar">
        <div className="lib-brand">💻 Dashboard</div>
        <div className="lib-welcome-msg">Welcome Back, {displayUserName}</div>
        <div className="lib-time-info">
          {dateString} | <strong>{timeString}</strong>
        </div>
        <nav className="lib-nav-menu">
          <button className="lib-nav-item" onClick={() => setShowProfile(true)}>
            👤 Profile
          </button>
          <button
            className="lib-nav-item"
            onClick={() => setShowMessages(true)}
          >
            💬 Messages
          </button>
          <button
            className="lib-nav-item"
            onClick={() => setShowAppearance(true)}
          >
            🎨 Appearance
          </button>
          <hr style={{ opacity: 0.1, margin: "10px 0" }} />
          <button
            className={`lib-nav-item ${location.pathname === "/dashboard" ? "lib-active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/library")}>
            Library
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/Blog")}>
            Blog
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/medical")}>
            Medical
          </button>
          <button
            className="lib-nav-item"
            onClick={() => navigate("/AirportWeather")}
          >
            Airport Weather
          </button>
        </nav>
        <div className="lib-footer">
          <button className="lib-nav-item logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* 主要內容區 - 包含你所有的 Widget 組件 */}
      <main className="lib-main-content">
        <header className="lib-header">
          <div></div>
          <div className="lib-user-section">
            <div
              className="lib-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {displayUserName.charAt(0).toUpperCase()}
            </div>
            {showUserMenu && (
              <div className="lib-user-menu">
                <div
                  className="lib-user-menu-item"
                  onClick={() => setShowProfile(true)}
                >
                  Profile Settings
                </div>
                <div className="lib-user-menu-item" onClick={onLogout}>
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 儀表板元件網格 */}
        <div className="lib-dashboard-grid">
          <div className="lib-card">
            <CalendarEmbed />
          </div>
          <div className="lib-card">
            <WorldClock />
          </div>
          <div className="lib-card">
            <FlightAwareWidget />
          </div>
          <div className="lib-card">
            <LHRWeather />
          </div>
          <div className="lib-card">
            <DOHWeather />
          </div>
          <div className="lib-card spotify-card">
            <iframe
              src="https://spotify.com"
              width="100%"
              height="300"
              frameBorder="0"
              title="Spotify"
              allow="encrypted-media"
              style={{ borderRadius: "12px" }}
            ></iframe>
          </div>
          <div className="lib-card-hkweather">
            <HKWeather />
          </div>
        </div>
      </main>

      {/* 彈出視窗組件連動 - 參數完全兼容 */}
      <Appearance
        show={showAppearance}
        onClose={() => setShowAppearance(false)}
        textColor={textColor}
        textSize={textSize}
        background={background}
        tempTextColor={tempTextColor}
        setTempTextColor={setTempTextColor}
        tempTextSize={tempTextSize}
        setTempTextSize={setTempTextSize}
        tempBgColor={tempBgColor}
        setTempBgColor={setTempBgColor}
        handleFileChange={handleFileChange}
        handleFinalSave={handleFinalSave}
        tempImageBase64={tempImageBase64}
        setTempImageBase64={setTempImageBase64}
      />

      <Profile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onSave={(u) => setDisplayUserName(u.username)}
      />

      {showMessages && (
        <div className="modal-overlay" onClick={() => setShowMessages(false)}>
          <div
            className="modal-content secure-msg-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowMessages(false)}
            >
              ✕
            </button>
            <Message currentUser={displayUserName} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
