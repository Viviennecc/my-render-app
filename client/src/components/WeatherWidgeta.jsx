import React, { useState, useEffect } from "react";

const HKWeathera = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map your desired names to the EXACT API station names
  const stationMapping = [
    { display: "Tsim Sha Tsui", apiName: "King's Park" }, // HKO uses King's Park for TST area
    { display: "Tai Po", apiName: "Tai Po" },
  ];

  useEffect(() => {
    const fetchWeather = async () => {
      const url =
        "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();

        // Find the specific stations from the API response
        const filtered = stationMapping
          .map((target) => {
            const record = data.temperature.data.find(
              (item) => item.place === target.apiName,
            );
            return record ? { ...record, displayPlace: target.display } : null;
          })
          .filter(Boolean); // Remove nulls if a station is temporarily offline

        setWeatherData(filtered);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading HK weather...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div
      style={{
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        maxWidth: "300px",
        minHeight: "400px",
        margin: "10px auto",
        textAlign: "left",
        fontFamily: "sans-serif",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", textAlign: "center", fontSize: "16px" }}
      >
        HK Local Temperature
      </h3>

      {weatherData.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom:
              index === weatherData.length - 1 ? "none" : "1px solid #eee",
          }}
        >
          <span style={{ color: "#333", fontSize: "14px" }}>
            {item.displayPlace}
          </span>
          <span style={{ color: "#007AFF", fontWeight: "bold" }}>
            {item.value}°{item.unit}
          </span>
        </div>
      ))}
    </div>
  );
};

export default HKWeathera;
