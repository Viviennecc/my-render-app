import React, { useState, useEffect, useCallback, useRef } from "react";
import "./AirportWeather.css";
import { useNavigate } from "react-router-dom";

const AirportWeather = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. RADAR ENGINE ---
  useEffect(() => {
    if (loading || !canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrame;

    const planes = [
      { id: "CPA401", x: 50, y: 105, speed: 0.18, type: "B773" },
      { id: "HDA220", x: 300, y: 205, speed: -0.12, type: "A321" },
      { id: "UAE062", x: 20, y: 60, speed: 0.3, type: "A388" },
      { id: "CRK112", x: 150, y: 150, speed: 0.08, type: "A333" },
    ];

    const render = () => {
      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = "rgba(52, 199, 89, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw Runways
      ctx.fillStyle = "#161618";
      ctx.fillRect(30, 100, 340, 10);
      ctx.fillRect(30, 200, 340, 10);

      // Update Planes
      planes.forEach((p) => {
        p.x += p.speed;
        if (p.x > 380) p.x = 20;
        if (p.x < 20) p.x = 380;

        ctx.fillStyle = "#34c759";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#34c759";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = "10px 'SF Mono', monospace";
        ctx.fillText(p.id, p.x + 8, p.y - 5);
        ctx.fillStyle = "rgba(52, 199, 89, 0.5)";
        ctx.fillText(p.type, p.x + 8, p.y + 8);
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [loading, data]);

  // --- 2. DATA UPLINK ---
  const fetchMetar = useCallback(async () => {
    try {
      const proxy = "https://corsproxy.io/?";
      const url = `https://aviationweather.gov/api/data/metar?ids=VHHH&format=raw&nocache=${Date.now()}`;

      const response = await fetch(proxy + encodeURIComponent(url));
      const raw = await response.text();

      if (!raw.includes("VHHH")) throw new Error("Station Unreachable");

      // Robust Regex Parsers
      const extract = (regex, fallback) => {
        const match = raw.match(regex);
        return match ? match[1] : fallback;
      };

      const zulu = extract(/(\d{6}Z)/, "0000Z").slice(2, 6);

      // Matches: 07010KT, VRB05KT, 07010G25KT
      const windMatch = raw.match(/(VRB|\d{3})(\d{2,3})(G\d{2})?KT/);
      const wind = windMatch ? `${windMatch[1]}/${windMatch[2]}KT` : "CALM";

      const qnh = extract(/Q(\d{4})/, "1013");
      const temp = extract(/ (\d{2})\//, "25");

      // Runway Base Logic
      const windDir = parseInt(windMatch?.[1]);
      const rwyBase =
        !isNaN(windDir) && windDir > 160 && windDir < 340 ? "25" : "07";

      setData({ zulu, wind, qnh, temp, rwyBase, raw });
      setError(null);
    } catch (err) {
      console.error("Uplink Error:", err);
      setError("UPLINK OFFLINE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetar();
    const timer = setInterval(fetchMetar, 600000); // 10 Min Sync
    return () => clearInterval(timer);
  }, [fetchMetar]);

  if (loading && !data)
    return <div className="lib-container loading">Syncing VHHH Center...</div>;

  return (
    <div className="lib-container">
      <aside className="lib-sidebar">
        <div className="lib-brand"> AeroDash</div>
        <nav className="lib-nav-menu">
          <button className="lib-nav-item lib-active">VHHH Center</button>
          <button
            className="lib-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </nav>
        <div className="radar-status">
          <span className="dot pulse"></span> GROUND RADAR
        </div>
      </aside>

      <main className="lib-main-content">
        <header className="lib-header">
          <div>
            <h1 className="lib-welcome-msg">Hong Kong International</h1>
            <p className="lib-time-info">{data?.zulu}Z • ACTIVE UPLINK</p>
          </div>
          <div className="atc-badge">VHHH_GND</div>
        </header>

        <div className="lib-dashboard-grid">
          {/* RADAR */}
          <div className="lib-card radar-full-width">
            <div className="card-header">
              <span className="card-badge obs">Surface Radar</span>
              <span className="card-time">Scan: 1050ms</span>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="radar-canvas"
            />
          </div>

          {/* DEPARTURE */}
          <div className="lib-card">
            <div className="card-header">
              <span className="card-badge dep">Departure</span>
            </div>
            <h2 className="card-title">Delivery Control</h2>
            <div className="data-row">
              <span className="data-label">Active Runway</span>
              <span className="data-value highlight">{data?.rwyBase}R</span>
            </div>
            <div className="data-row">
              <span className="data-label">Surface Wind</span>
              <span className="data-value">{data?.wind}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Altimeter</span>
              <span className="data-value">{data?.qnh} hPa</span>
            </div>
          </div>

          {/* ARRIVAL */}
          <div className="lib-card">
            <div className="card-header">
              <span className="card-badge arr">Arrival</span>
            </div>
            <h2 className="card-title">Approach Control</h2>
            <div className="data-row">
              <span className="data-label">Landing Runway</span>
              <span className="data-value highlight">{data?.rwyBase}L</span>
            </div>
            <div className="data-row">
              <span className="data-label">Wind Velocity</span>
              <span className="data-value">{data?.wind}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Temp / Dew</span>
              <span className="data-value">{data?.temp}°C</span>
            </div>
          </div>
        </div>
      </main>
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
};

export default AirportWeather;
