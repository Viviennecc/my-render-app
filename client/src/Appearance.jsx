import React, { useEffect } from "react";

const Appearance = ({
  show,
  onClose,
  textColor,
  textSize,
  background,
  tempTextColor,
  setTempTextColor,
  tempTextSize,
  setTempTextSize,
  handleFileChange,
  handleFinalSave,
  tempImageBase64,
  setTempImageBase64,
  tempBgColor,
  setTempBgColor,
}) => {
  useEffect(() => {
    if (show) {
      setTempTextColor(textColor);
      setTempTextSize(textSize);
      if (background?.type === "color") {
        setTempBgColor(background.value);
      }
      setTempImageBase64("");
    }
  }, [
    show,
    textColor,
    textSize,
    background,
    setTempTextColor,
    setTempTextSize,
    setTempBgColor,
    setTempImageBase64,
  ]);

  if (!show) return null;

  const handleColorPick = (color) => {
    setTempBgColor(color);
    setTempImageBase64("");
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(10px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 4000,
    },
    modal: {
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "24px",
      width: "350px",
      boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
      fontFamily: "-apple-system, system-ui, sans-serif",
    },
    group: { marginBottom: "20px" },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: "700",
      color: "#86868b",
      marginBottom: "8px",
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      height: "45px",
      borderRadius: "12px",
      border: "1px solid #ddd",
      cursor: "pointer",
    },
    btnPrimary: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#007AFF",
      color: "white",
      border: "none",
      borderRadius: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Appearance</h3>

        <div style={styles.group}>
          <label style={styles.label}>Background Color</label>
          <input
            type="color"
            style={styles.input}
            value={tempBgColor || "#ffffff"}
            onChange={(e) => handleColorPick(e.target.value)}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Text Color</label>
          <input
            type="color"
            style={styles.input}
            value={tempTextColor}
            onChange={(e) => setTempTextColor(e.target.value)}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Font Size: {tempTextSize}px</label>
          <input
            type="range"
            min="14"
            max="32"
            value={tempTextSize}
            onChange={(e) => setTempTextSize(parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Wallpaper Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ fontSize: "12px" }}
          />
          {tempImageBase64 && (
            <p style={{ fontSize: "10px", color: "#007AFF", marginTop: "5px" }}>
              ✓ New image ready
            </p>
          )}
        </div>

        <button style={styles.btnPrimary} onClick={handleFinalSave}>
          Apply Changes
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: "#666",
            marginTop: "12px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Appearance;
