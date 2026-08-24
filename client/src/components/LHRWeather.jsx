import React, { useState, useEffect, useCallback } from "react";
import "./LHRAirportWeather.css";

const LHRWeather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const decodeMetar = (raw) => {
    if (!raw) return "";
    const parts = [];

    // Wind
    const windMatch = raw.match(/(VRB|\d{3})(\d{2,3})(G\d{2})?KT/);
    if (windMatch) {
      parts.push(`Wind ${windMatch[1]}° at ${windMatch[2]}kt`);
    }

    // Visibility (9999 = 10km+)
    if (raw.includes(" 9999 ")) parts.push("Visibility >10km");
    else {
      const vis = raw.match(/ (\d{4}) /);
      if (vis) parts.push(`Visibility ${vis[1]}m`);
    }

    // Clouds
    if (raw.includes("CAVOK")) parts.push("Clouds/Vis OK");
    const clouds = raw.match(/(FEW|SCT|BKN|OVC)(\d{3})/);
    if (clouds) parts.push(`${clouds[1]} at ${parseInt(clouds[2]) * 100}ft`);

    return parts.join(" • ");
  };

  const fetchLHRData = useCallback(async () => {
    const proxy = "https://corsproxy.io/?";
    const targetUrl =
      "https://aviationweather.gov/api/data/metar?ids=EGLL&format=raw";

    try {
      const response = await fetch(proxy + encodeURIComponent(targetUrl), {
        cache: "no-store",
      });
      const metarRaw = await response.text();

      if (!metarRaw || !metarRaw.includes("EGLL")) throw new Error("LINK_FAIL");

      const extract = (regex, fallback) =>
        (metarRaw.match(regex) || [null, fallback])[1];
      const zulu = extract(/(\d{6}Z)/, "000000Z").slice(2, 6);
      const windMatch = metarRaw.match(/(VRB|\d{3})(\d{2,3})KT/);

      // LHR Preference: 09L/R for winds 010-110, else 27L/R
      const windDir = windMatch
        ? windMatch[1] === "VRB"
          ? 270
          : parseInt(windMatch[1])
        : 270;
      const rwyBase = windDir >= 10 && windDir <= 110 ? "09" : "27";

      // LHR Alternation Logic
      // 06:00 to 15:00 -> Landing 27L, Take-off 27R (Example)
      // 15:00 to 23:30 -> Landing 27R, Take-off 27L
      const currentHour = new Date().getHours();
      const isAfternoonSwap = currentHour >= 15;

      setData({
        zulu,
        wind: windMatch ? `${windMatch[1]}/${windMatch[2]}KT` : "CALM",
        qnh: extract(/Q(\d{4})/, "1013"),
        landing: isAfternoonSwap ? `${rwyBase}R` : `${rwyBase}L`,
        takeoff: isAfternoonSwap ? `${rwyBase}L` : `${rwyBase}R`,
        raw: metarRaw,
        decoded: decodeMetar(metarRaw),
      });
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLHRData();
    const timer = setInterval(fetchLHRData, 600000);
    return () => clearInterval(timer);
  }, [fetchLHRData]);

  if (loading && !data)
    return <div className="lib-card loading-state">Linking EGLL...</div>;

  return (
    <div className={`lib-card airport-widget ${error ? "error-glow" : ""}`}>
      <div className="card-header">
        <span className="card-badge obs">LHR / EGLL</span>
        <span className="card-time">{data?.zulu}Z</span>
      </div>

      <h2 className="card-title">London Heathrow</h2>

      {error ? (
        <div className="offline-content">
          <p>UPLINK OFFLINE</p>
          <button className="retry-btn" onClick={fetchLHRData}>
            RETRY
          </button>
        </div>
      ) : (
        <>
          <div className="rwy-grid">
            <div className="rwy-item landing">
              <span className="rwy-label">ARR RWY</span>
              <span className="rwy-value">{data?.landing}</span>
            </div>
            <div className="rwy-item takeoff">
              <span className="rwy-label">DEP RWY</span>
              <span className="rwy-value">{data?.takeoff}</span>
            </div>
          </div>

          <div className="decode-box">
            <span className="decode-label">METAR DECODE</span>
            <p className="decode-text">{data?.decoded}</p>
            <p className="decode-text">Pressure: {data?.qnh}hPa</p>
          </div>

          <div className="raw-snippet">{data?.raw}</div>
        </>
      )}
    </div>
  );
};

export default LHRWeather;
