import React from "react";

const LibAppearance = ({
  show,
  onClose,
  tempTextColor,
  setTempTextColor,
  tempTextSize,
  setTempTextSize,
  tempBgColor,
  setTempBgColor,
  handleFileChange,
  handleFinalSave,
  tempImageBase64,
}) => {
  if (!show) return null;

  return (
    <div className="lib-modal-overlay" onClick={onClose}>
      <div
        className="lib-modal appearance-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lib-modal-header">🎨 Customize Appearance</div>

        <div className="lib-modal-body">
          <div className="appearance-section">
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Text Color
            </label>
            <input
              type="color"
              value={tempTextColor}
              onChange={(e) => setTempTextColor(e.target.value)}
              className="lib-color-input"
              style={{
                width: "100%",
                height: "40px",
                cursor: "pointer",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>

          <div className="appearance-section" style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Font Size ({tempTextSize}px)
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={tempTextSize}
              onChange={(e) => setTempTextSize(parseInt(e.target.value))}
              className="lib-range-input"
              style={{ width: "100%" }}
            />
          </div>

          <div className="appearance-section" style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Background Color
            </label>
            <input
              type="color"
              value={tempBgColor}
              onChange={(e) => setTempBgColor(e.target.value)}
              className="lib-color-input"
              style={{
                width: "100%",
                height: "40px",
                cursor: "pointer",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>

          <div className="appearance-section" style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="lib-file-input"
            />
            {tempImageBase64 && (
              <div
                className="preview-thumbnail"
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#34c759",
                  fontWeight: "bold",
                }}
              >
                ✅ New image selected
              </div>
            )}
          </div>
        </div>

        <div className="lib-modal-footer">
          <button className="lib-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="lib-btn-primary" onClick={handleFinalSave}>
            Apply & Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default LibAppearance;
