import React, { useState, useEffect } from "react";

const WorldClock = () => {
  const [times, setTimes] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const formatTime = (tz) =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);

      setTimes({
        newYork: formatTime("America/New_York"),
        london: formatTime("Europe/London"),
        iceland: formatTime("Atlantic/Reykjavik"),
        tokyo: formatTime("Asia/Tokyo"),
        sydney: formatTime("Australia/Sydney"),
        doha: formatTime("Asia/Qatar"),
        edmonton: formatTime("America/Edmonton"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const boxStyle = {
    marginTop: "20px",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    display: "inline-block",
    fontFamily: "'Courier New', monospace",
    backgroundColor: "#fff",
    minWidth: "100%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  };

  const itemStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "8px",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "4px",
  };

  return (
    <div style={boxStyle}>
      <h3
        style={{
          margin: "0 0 15px 0",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        World Times
      </h3>

      <div style={itemStyle}>
        <span>🗽 New York:</span>
        <span>{times.newYork}</span>
      </div>

      <div style={itemStyle}>
        <span>🎡 London:</span>
        <span>{times.london}</span>
      </div>

      <div style={itemStyle}>
        <span>🌋 Iceland:</span>
        <span>{times.iceland}</span>
      </div>

      <div style={itemStyle}>
        <span>🗼 Tokyo:</span>
        <span>{times.tokyo}</span>
      </div>

      <div style={itemStyle}>
        <span>🐨 Sydney:</span>
        <span>{times.sydney}</span>
      </div>

      <div style={itemStyle}>
        <span>🏁 Doha:</span>
        <span>{times.doha}</span>
      </div>

      <div style={{ ...itemStyle, marginBottom: 0, borderBottom: "none" }}>
        <span>🌲 Edmonton:</span>
        <span>{times.edmonton}</span>
      </div>
    </div>
  );
};

export default WorldClock;
