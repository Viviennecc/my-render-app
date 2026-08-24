import React, { useRef } from "react";

const BlogCompose = ({
  show,
  onClose,
  newPost,
  setNewPost,
  onPublish,
  isEditing,
}) => {
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10485760) {
        alert("File is too large. Please select an image under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost({ ...newPost, postImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="compose-overlay" onClick={onClose}>
      <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
        <header className="compose-header">
          <h3>{isEditing ? "Edit Story" : "Create New Story"}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            &times;
          </button>
        </header>

        <form onSubmit={onPublish}>
          <div className="editor-toolbar">
            <div className="toolbar-group">
              <label>Color</label>
              <input
                type="color"
                value={newPost.postColor}
                onChange={(e) =>
                  setNewPost({ ...newPost, postColor: e.target.value })
                }
              />
            </div>

            <div className="toolbar-group">
              <label>Size</label>
              <select
                value={newPost.postSize}
                onChange={(e) =>
                  setNewPost({ ...newPost, postSize: parseInt(e.target.value) })
                }
              >
                {[14, 16, 18, 20, 24, 28, 32].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-group">
              <button
                type="button"
                className="btn-toolbar-icon"
                onClick={() => fileInputRef.current.click()}
              >
                🖼️ Media
              </button>
            </div>

            <div className="toolbar-group" style={{ marginLeft: "auto" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newPost.isShared}
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      isShared: e.target.checked,
                      sharedWith: "",
                    })
                  }
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#007aff",
                  }}
                >
                  🌍 Public
                </span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Specific User Sharing Box */}
          {!newPost.isShared && (
            <div
              style={{
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#8e8e93",
                }}
              >
                Direct Share:
              </span>
              <input
                type="text"
                placeholder="Enter username (Optional)"
                value={newPost.sharedWith || ""}
                onChange={(e) =>
                  setNewPost({ ...newPost, sharedWith: e.target.value })
                }
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                  fontSize: "13px",
                }}
              />
            </div>
          )}

          {newPost.postImage && (
            <div
              className="preview-container"
              style={{ position: "relative", marginBottom: "15px" }}
            >
              <img
                src={newPost.postImage}
                alt="Preview"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                className="btn-remove-img"
                onClick={() => setNewPost({ ...newPost, postImage: "" })}
              >
                &times;
              </button>
            </div>
          )}

          <input
            className="editor-input-field title-field"
            placeholder="Story Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            required
          />

          <textarea
            className="editor-input-field editor-textarea-field"
            placeholder="Write your story..."
            style={{
              color: newPost.postColor,
              fontSize: `${newPost.postSize}px`,
              minHeight: "250px",
            }}
            value={newPost.content}
            onChange={(e) =>
              setNewPost({ ...newPost, content: e.target.value })
            }
            required
          />

          <div className="compose-footer">
            <button
              type="button"
              className="btn-cancel-compose"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-publish-blog">
              {newPost.isShared
                ? "🌍 Publish Public"
                : newPost.sharedWith
                  ? `📧 Share with ${newPost.sharedWith}`
                  : "🔒 Save Private"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCompose;
