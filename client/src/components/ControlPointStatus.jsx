import React, { useState, useEffect } from "react";

const ControlPointStatus = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    // 1. Correct ImmD JSON URL
    const targetUrl =
      "https://secure1.info.gov.hk/immd/mobileapps/2bb9ae17/data/CPQueueTimeV.json";

    // 2. Correct AllOrigins Proxy structure
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&cb=${Date.now()}`;

    try {
      setLoading(true);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Proxy connection failed");

      const data = await response.json();

      // 3. AllOrigins returns data inside a 'contents' string which must be parsed
      const rawData = JSON.parse(data.contents);

      // 4. Extract the array from the ImmD specific key
      if (rawData && rawData.estimated_waiting_time) {
        setStatuses(rawData.estimated_waiting_time);
        setError(null);
      } else {
        throw new Error("Data format mismatch");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to fetch boundary data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 900000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("normal")) return "#28a745";
    if (s.includes("very busy")) return "#dc3545";
    if (s.includes("busy")) return "#ffc107";
    return "#6c757d";
  };

  if (loading && statuses.length === 0)
    return <div style={styles.center}>Loading Boundary Data...</div>;

  return (
    <div style={styles.container}>
      <h3 style={{ textAlign: "center", marginBottom: "5px" }}>
        Land Boundary Status
      </h3>
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#888",
          marginBottom: "20px",
        }}
      >
        Arrival (Visitors)
      </p>

      {error ? (
        <div style={styles.center}>
          <p style={{ color: "red", fontSize: "14px" }}>{error}</p>
          <button onClick={fetchStatus} style={styles.button}>
            Retry
          </button>
        </div>
      ) : (
        statuses.map((item, index) => (
          <div key={index} style={styles.row}>
            <span style={styles.name}>{item.control_point_name}</span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: getStatusColor(item.waiting_situation),
              }}
            >
              {item.waiting_situation || "N/A"}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#fff",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  name: { fontSize: "14px", fontWeight: "600", color: "#333" },
  badge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold",
    minWidth: "90px",
    textAlign: "center",
    color: "#fff",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  center: { textAlign: "center", padding: "50px" },
};

export default ControlPointStatus;
