import React, { useEffect } from "react";

const BlogAppearance = ({
  show,
  onClose,
  textColor,
  textSize,
  background,
  tempTextColor,
  setTempTextColor,
  tempTextSize,
  setTempTextSize,
  tempBgColor,
  setTempBgColor,
  tempImageBase64,
  setTempImageBase64,
  handleFileChange,
  handleFinalSave,
}) => {
  useEffect(() => {
    if (show) {
      setTempTextColor(textColor);
      setTempTextSize(textSize);
      // Sync the color picker with active background if it's a color
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
    // Clearing the image selection ensures color takes priority on save
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
    group: { marginBottom: "15px" },
    label: {
      display: "block",
      fontSize: "12px",
      fontWeight: "600",
      color: "#666",
      marginBottom: "5px",
    },
    input: {
      width: "100%",
      height: "40px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      cursor: "pointer",
    },
    applyBtn: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#007AFF",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "10px",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Style Settings</h3>

        <div style={styles.group}>
          <label style={styles.label}>Background Color</label>
          <input
            type="color"
            style={styles.input}
            value={tempBgColor}
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
          <label style={styles.label}>Text Size: {tempTextSize}px</label>
          <input
            type="range"
            min="14"
            max="30"
            value={tempTextSize}
            onChange={(e) => setTempTextSize(parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Upload Wallpaper</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {tempImageBase64 && (
            <p style={{ fontSize: "10px", color: "#007AFF" }}>
              ✓ New image ready
            </p>
          )}
        </div>

        <button style={styles.applyBtn} onClick={handleFinalSave}>
          Apply Changes
        </button>
      </div>
    </div>
  );
};

export default BlogAppearance;
