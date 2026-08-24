import React from "react";

const FlightAwareWidget = () => {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "16px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <iframe
        src="https://embed.flightaware.com/commercial/integrated/web/delay_map_fullpage.rvt"
        width="100%"
        height="300"
        frameBorder="0"
        title="FlightAware Tracker"
      />
      <div
        style={{ fontSize: "x-small", textAlign: "center", marginTop: "10px" }}
      >
        <a href="https://www.flightaware.com/">
          Flight Tracker courtesy of FlightAware.com
        </a>
      </div>
    </div>
  );
};

export default FlightAwareWidget;
