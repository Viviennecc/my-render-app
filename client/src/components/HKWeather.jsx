import React, { useState, useEffect, useCallback } from "react";
import "./WeatherWidget.css";

const HKWeather = () => {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [localForecast, setLocalForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("current");

  const targetPlaces = [
    "Tseung Kwan O",
    "Chek Lap Kok",
    "Hong Kong Observatory",
    "Sha Tin",
    "Tai Po",
  ];

  const formatIcon = (icon) =>
    icon ? icon.toString().padStart(3, "0") : "050";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // This points to your local-cors-proxy bridge
    const proxyBase =
      "http://localhost:8010/proxy/weatherAPI/opendata/weather.php?lang=en";

    try {
      const [resCurrent, res9Day, resLocal] = await Promise.all([
        fetch(`${proxyBase}&dataType=rhrread`),
        fetch(`${proxyBase}&dataType=fnd`),
        fetch(`${proxyBase}&dataType=flw`),
      ]);

      if (!resCurrent.ok)
        throw new Error("Local Bridge Offline. Run 'npx lcp' in terminal.");

      const dataCurrent = await resCurrent.json();
      const data9Day = await res9Day.json();
      const dataLocal = await resLocal.json();

      const filtered = dataCurrent.temperature.data.filter((item) =>
        targetPlaces.includes(item.place),
      );
      const sortedTemps = filtered.sort(
        (a, b) => targetPlaces.indexOf(a.place) - targetPlaces.indexOf(b.place),
      );

      const hkoStation = dataCurrent.temperature.data.find(
        (item) => item.place === "Hong Kong Observatory",
      );

      setCurrent({
        hkoTemp: hkoStation?.value || "--",
        localTemps: sortedTemps,
        humidity: dataCurrent.humidity?.data?.[0]?.value || "--",
        maxTemp: data9Day.weatherForecast?.[0]?.forecastMaxtemp?.value || "--",
        minTemp: data9Day.weatherForecast?.[0]?.forecastMintemp?.value || "--",
        updateTime: dataCurrent.updateTime,
        icon: formatIcon(dataCurrent.icon?.[0]),
        warnings: dataCurrent.warningMessage || [],
        lightning:
          dataCurrent.lightning?.data
            ?.filter((l) => l.occur === "true")
            .map((l) => l.place) || [],
        rainReminder: dataCurrent.rainstormReminder || "",
        radarUrl: `https://www.hko.gov.hk/wxinfo/radars/radar_064.jpg?t=${Date.now()}`,
        camUrl: `https://www.hko.gov.hk/wxinfo/aws/wmv3/pub/php/image_scaled.php?place=HKO&t=${Date.now()}`,
      });

      setForecast(
        (data9Day.weatherForecast || []).map((day) => ({
          ...day,
          icon: formatIcon(day.ForecastIcon),
        })),
      );
      setLocalForecast(dataLocal);
    } catch (err) {
      console.error("Uplink Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading)
    return <div className="weather-card loading">Syncing with HKO...</div>;

  if (error)
    return (
      <div className="weather-card error-state">
        <h3>⚠️ Uplink Failure</h3>
        <p style={{ fontSize: "11px" }}>{error}</p>
        <button onClick={fetchData} className="nav-btn active">
          Retry Connection
        </button>
      </div>
    );

  return (
    <div className="weather-card">
      {(current?.warnings.length > 0 ||
        current?.lightning.length > 0 ||
        current?.rainReminder) && (
        <div className="warning-banner">
          <div className="warning-text-scroll">
            {current.lightning.length > 0 && (
              <span className="warning-msg">
                ⚡ Lightning: {current.lightning.join(", ")} |{" "}
              </span>
            )}
            {current.rainReminder && (
              <span className="warning-msg">🌧️ {current.rainReminder} | </span>
            )}
            {current.warnings.map((msg, i) => (
              <span key={i} className="warning-msg">
                {msg} |{" "}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="weather-header">
        <br />
        <h3 className="weather-title">Hong Kong</h3>
        <br />
        <div className="view-controls">
          <br />
          <button
            className={`nav-btn ${view === "current" ? "active" : ""}`}
            onClick={() => setView("current")}
          >
            Live
          </button>
          <button
            className={`nav-btn ${view === "radar" ? "active" : ""}`}
            onClick={() => setView("radar")}
          >
            Radar
          </button>
          <button
            className={`nav-btn ${view === "9day" ? "active" : ""}`}
            onClick={() => setView("9day")}
          >
            9-Day
          </button>
          <button
            className={`nav-btn ${view === "cams" ? "active" : ""}`}
            onClick={() => setView("cams")}
          >
            Cams
          </button>
        </div>
      </div>

      {view === "cams" && (
        <div className="area_current">
          <img
            src={current.camUrl}
            alt="Live Cam"
            className="radar-image"
            referrerPolicy="no-referrer"
          />
          <div className="detail">
            <span className="hkoTemp">{current.hkoTemp}°C</span>
            <img
              src={`https://www.hko.gov.hk/images/HKOWeatherIconIndex/pic${current.icon}.png`}
              alt="Icon"
              className="dashboard-icon"
            />
          </div>
        </div>
      )}

      {view === "radar" && (
        <img
          src={current.radarUrl}
          alt="Radar"
          className="radar-image"
          referrerPolicy="no-referrer"
        />
      )}

      {view === "current" && (
        <div className="summary-container">
          <div className="main-obs-row">
            <div className="main-temp-val">
              {current.localTemps[2]?.value || current.hkoTemp}°C
            </div>
            <img
              src={`https://www.hko.gov.hk/images/HKOWeatherIconIndex/pic${current.icon}.png`}
              alt="Icon"
              className="weather-icon-img"
            />
          </div>
          <div className="temp-grid">
            {current.localTemps.map((item) => (
              <div key={item.place} className="weather-row">
                <span>{item.place}</span>
                <span>{item.value}°C</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "9day" && (
        <div className="forecast-scroll-container">
          {forecast.map((day, i) => (
            <div key={i} className="forecast-day-card">
              <div className="fd-date">
                {day.forecastDate.slice(6, 8)}/{day.forecastDate.slice(4, 6)}
              </div>
              <img
                src={`https://www.hko.gov.hk/images/HKOWeatherIconIndex/pic${day.icon}.png`}
                alt="icon"
                className="fd-icon"
              />
              <div className="fd-temp">
                {day.forecastMaxtemp.value}° / {day.forecastMintemp.value}°
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="weather-footer">Source: HKO • Proxy: Local Bridge</p>
    </div>
  );
};

export default HKWeather;
