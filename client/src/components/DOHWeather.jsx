import React, { useState, useEffect, useCallback } from "react";
import "./AirportWeather.css";

const DOHWeather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // --- METAR DECODER LOGIC ---
  const decodeMetar = (raw) => {
    if (!raw) return "No data available";
    const parts = [];

    // Wind Translation
    const windMatch = raw.match(/(VRB|\d{3})(\d{2,3})(G\d{2})?KT/);
    if (windMatch) {
      const dir =
        windMatch[1] === "VRB"
          ? "Variable direction"
          : `Wind from ${windMatch[1]}°`;
      const speed = `${parseInt(windMatch[2], 10)} knots`;
      const gust = windMatch[3]
        ? ` gusting to ${windMatch[3].replace("G", "")} knots`
        : "";
      parts.push(`${dir} at ${speed}${gust}`);
    }

    // Visibility
    const visMatch = raw.match(/ (\d{4}) /);
    if (visMatch) {
      const vis = parseInt(visMatch[1], 10);
      parts.push(
        vis === 9999 ? "Visibility 10km or more" : `Visibility ${vis} meters`,
      );
    }

    // Sky Conditions (Clouds)
    if (raw.includes("CAVOK")) parts.push("Ceiling and Visibility OK");
    if (raw.includes("SKC") || raw.includes("CLR")) parts.push("Sky Clear");

    // Temperature
    const tempMatch = raw.match(/ (M?\d{2})\/(M?\d{2})/);
    if (tempMatch) {
      const t = tempMatch[1].replace("M", "-");
      parts.push(`Temperature ${t}°C`);
    }

    // Pressure
    const qnhMatch = raw.match(/Q(\d{4})/);
    if (qnhMatch) {
      parts.push(`Altimeter ${qnhMatch[1]} hPa`);
    }

    return parts.join(" • ");
  };

  const fetchDOHData = useCallback(async () => {
    const airportId = "OTHH";
    const proxy = "https://corsproxy.io/?";
    const targetUrl = `https://aviationweather.gov/api/data/metar?ids=${airportId}&format=raw&nocache=${Date.now()}`;

    try {
      const response = await fetch(proxy + encodeURIComponent(targetUrl), {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("PROXY_REJECTED");

      const metarRaw = await response.text();

      if (!metarRaw.includes(airportId)) throw new Error("DATA_MISSING");

      const extract = (regex, fallback) =>
        (metarRaw.match(regex) || [null, fallback])[1];

      // Extraction Engine
      const zulu = extract(/(\d{6}Z)/, "000000Z").slice(2, 6);
      const windMatch = metarRaw.match(/(VRB|\d{3})(\d{2,3})KT/);
      const windStr = windMatch ? `${windMatch[1]}/${windMatch[2]}KT` : "CALM";
      const qnh = extract(/Q(\d{4})/, "1010");
      const tempMatch = metarRaw.match(/ (M?\d{2})\/(M?\d{2})/);
      const temp = tempMatch ? tempMatch[1].replace("M", "-") : "--";

      // Doha Runway Logic: Wind 71-249 uses Rwy 16. Else Rwy 34.
      const windDirRaw = windMatch ? windMatch[1] : "340";
      const windDir = windDirRaw === "VRB" ? 340 : parseInt(windDirRaw, 10);
      const rwyBase = windDir > 70 && windDir < 250 ? "16" : "34";

      setData({
        id: "OTHH",
        name: "Hamad Intl",
        zulu,
        wind: windStr,
        qnh,
        rwy: rwyBase,
        raw: metarRaw,
        decoded: decodeMetar(metarRaw),
        temp,
      });
      setError(false);
    } catch (err) {
      console.error("DOH Link Error:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDOHData();
    const timer = setInterval(fetchDOHData, 600000);
    return () => clearInterval(timer);
  }, [fetchDOHData]);

  if (loading && !data)
    return (
      <div className="lib-card loading-state">Linking DOH Terminal...</div>
    );

  return (
    <div className={`lib-card airport-widget ${error ? "link-warning" : ""}`}>
      <div className="card-header">
        <span className="card-badge dep">DOH / OTHH</span>
        <span className="card-time">{data?.zulu || "--"}Z</span>
      </div>

      <div className="header-flex">
        <h2 className="card-title">{data?.name}</h2>
        <div className={`status-dot ${error ? "offline" : "pulse"}`}></div>
      </div>

      {error ? (
        <div className="offline-notice">
          <p>UPLINK INTERRUPTED</p>
          <button onClick={fetchDOHData} className="retry-btn">
            FORCE RECONNECT
          </button>
        </div>
      ) : (
        <>
          <div className="data-row">
            <span className="data-label">Primary Runways</span>
            <span className="data-value highlight">
              {data?.rwy}L / {data?.rwy}R
            </span>
          </div>

          <div className="decode-box">
            <span className="decode-label">DECODED TRANSMISSION</span>
            <p className="decode-text">{data?.decoded}</p>
          </div>

          <div className="raw-snippet">{data?.raw}</div>
        </>
      )}
    </div>
  );
};

export default DOHWeather;
