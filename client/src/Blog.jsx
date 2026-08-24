import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import localforage from "localforage";
import { encryptData, decryptData } from "./utils/encryption";
import BlogAppearance from "./BlogAppearance";
import BlogCompose from "./BlogCompose";
import "./Blog.css";

localforage.config({ name: "JournalApp", storeName: "posts_storage" });

const Blog = ({ userName }) => {
  const navigate = useNavigate();
  const [displayUserName, setDisplayUserName] = useState(userName || "Guest");
  const [textColor, setTextColor] = useState("#1d1d1f");
  const [textSize, setTextSize] = useState(18);
  const [background, setBackground] = useState({
    type: "color",
    value: "#f0f2f5",
  });

  const [showAppearance, setShowAppearance] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState("private");
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    postColor: "#1d1d1f",
    postSize: 18,
    postImage: "",
    isShared: false,
    sharedWith: "",
  });

  // Temp states for Modal
  const [tempTextColor, setTempTextColor] = useState("#1d1d1f");
  const [tempBgColor, setTempBgColor] = useState("#f0f2f5");
  const [tempTextSize, setTempTextSize] = useState(18);
  const [tempImageBase64, setTempImageBase64] = useState("");

  const loadAndDecryptPosts = useCallback(
    async (currentAuthor) => {
      try {
        const encryptedPosts =
          (await localforage.getItem("encrypted_posts")) || [];
        const decryptedPosts = await Promise.all(
          encryptedPosts.map(async (p) => {
            try {
              const author = await decryptData(p.author);
              const targetUser = p.sharedWith
                ? await decryptData(p.sharedWith)
                : "";
              const isMine = author === currentAuthor;
              const isPublic = p.isShared === true;
              const isSharedToMe =
                targetUser.toLowerCase() === currentAuthor.toLowerCase();

              if (feedFilter === "private" && !isMine && !isSharedToMe)
                return null;
              if (feedFilter === "shared" && !isPublic) return null;

              return {
                id: p.id,
                title: await decryptData(p.title),
                content: await decryptData(p.content),
                author,
                postColor: p.postColor
                  ? await decryptData(p.postColor)
                  : "#1d1d1f",
                postSize: p.postSize
                  ? parseInt(await decryptData(p.postSize))
                  : 18,
                postImage: p.postImage ? await decryptData(p.postImage) : "",
                date: p.date,
                isMine,
                isPublic,
                isSharedToMe,
                sharedWith: targetUser,
              };
            } catch (err) {
              return null;
            }
          }),
        );
        setPosts(decryptedPosts.filter((p) => p !== null).reverse());
      } catch (err) {
        console.error(err);
      }
    },
    [feedFilter],
  );

  useEffect(() => {
    const initBlog = async () => {
      setLoading(true);
      let currentName = userName || "Guest";
      try {
        const savedNameEnc = await localforage.getItem("encrypted_user_name");
        if (savedNameEnc)
          currentName = (await decryptData(savedNameEnc)) || currentName;
        setDisplayUserName(currentName);

        const settingsKey = `blog_settings_${userName}`;
        const savedSettings = (await localforage.getItem(settingsKey)) || {};
        if (savedSettings.textColor) setTextColor(savedSettings.textColor);
        if (savedSettings.textSize) setTextSize(savedSettings.textSize);
        if (savedSettings.background) setBackground(savedSettings.background);

        await loadAndDecryptPosts(currentName);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initBlog();
  }, [userName, loadAndDecryptPosts]);

  // HANDLERS
  const closeCompose = () => {
    setShowCompose(false);
    setEditingPostId(null);
    setNewPost({
      title: "",
      content: "",
      postColor: "#1d1d1f",
      postSize: 18,
      postImage: "",
      isShared: false,
      sharedWith: "",
    });
  };

  // Inside your Blog component
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = () => {
      try {
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) {
          const parsedUsers = JSON.parse(storedUsers);
          // Ensure we only get the usernames
          setAllUsers(parsedUsers);
        }
      } catch (err) {
        console.error("Failed to load user list:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleEditInit = (post) => {
    setEditingPostId(post.id);
    setNewPost({ ...post });
    setShowCompose(true);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      const encryptedData = {
        title: await encryptData(newPost.title),
        content: await encryptData(newPost.content),
        author: await encryptData(displayUserName),
        postColor: await encryptData(newPost.postColor),
        postSize: await encryptData(String(newPost.postSize)),
        postImage: newPost.postImage
          ? await encryptData(newPost.postImage)
          : "",
        isShared: newPost.isShared,
        sharedWith: newPost.sharedWith
          ? await encryptData(newPost.sharedWith)
          : "",
      };

      const existingPosts =
        (await localforage.getItem("encrypted_posts")) || [];
      if (editingPostId) {
        const updated = existingPosts.map((p) =>
          p.id === editingPostId
            ? { ...encryptedData, id: p.id, date: p.date }
            : p,
        );
        await localforage.setItem("encrypted_posts", updated);
      } else {
        const newEntry = {
          ...encryptedData,
          id: Date.now(),
          date: new Date().toLocaleString(),
        };
        await localforage.setItem("encrypted_posts", [
          ...existingPosts,
          newEntry,
        ]);
      }
      await loadAndDecryptPosts(displayUserName);
      closeCompose();
    } catch (err) {
      alert("Save failed.");
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Permanently delete?")) {
      const existing = (await localforage.getItem("encrypted_posts")) || [];
      const filtered = existing.filter((p) => p.id !== id);
      await localforage.setItem("encrypted_posts", filtered);
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  const handleFinalSave = async () => {
    let finalBg;
    if (tempImageBase64) {
      finalBg = { type: "image", value: tempImageBase64 };
    } else {
      finalBg = { type: "color", value: tempBgColor };
    }

    setBackground(finalBg);
    setTextColor(tempTextColor);
    setTextSize(tempTextSize);

    await localforage.setItem(`blog_settings_${userName}`, {
      textColor: tempTextColor,
      textSize: tempTextSize,
      background: finalBg,
    });
    setShowAppearance(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setTempImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const containerStyle = {
    color: textColor,
    fontSize: `${textSize}px`,
    backgroundColor:
      background.type === "color" ? background.value : "transparent",
    backgroundImage:
      background.type === "image" ? `url(${background.value})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    transition: "background 0.3s ease",
  };

  return (
    <div className="lib-blog-container" style={containerStyle}>
      <aside className="lib-blog-sidebar">
        <div className="lib-blog-logo"> Journal</div>
        <button
          className="lib-nav-item btn-new-post"
          onClick={() => setShowCompose(true)}
        >
          ✍️ New Post
        </button>
        <nav className="lib-main-nav">
          <button
            className={`lib-nav-item ${feedFilter === "private" ? "active" : ""}`}
            onClick={() => setFeedFilter("private")}
          >
            🔒 Journal
          </button>
          <button
            className={`lib-nav-item ${feedFilter === "shared" ? "active" : ""}`}
            onClick={() => setFeedFilter("shared")}
          >
            🌍 Public
          </button>
          <button
            className="lib-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            🏠 Home
          </button>
          <button
            className="lib-nav-item"
            onClick={() => setShowAppearance(true)}
          >
            🎨 Style
          </button>
          <button
            className={`lib-nav-item ${deleteMode ? "active" : ""}`}
            onClick={() => setDeleteMode(!deleteMode)}
          >
            🗑️ Delete
          </button>
        </nav>
      </aside>

      <main className="lib-blog-content">
        <header className="lib-blog-header">
          <h1>
            {feedFilter === "private"
              ? `${displayUserName}'s Journal`
              : "Public Feed"}
          </h1>
        </header>
        <section className="blog-posts-feed">
          {posts.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No posts found.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="blog-card"
                style={{
                  color: post.postColor,
                  fontSize: `${post.postSize}px`,
                }}
              >
                <div className="blog-card-header">
                  <span className="blog-timestamp">{post.date}</span>
                  {post.isMine && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="btn-edit-post"
                        onClick={() => handleEditInit(post)}
                      >
                        ✏️
                      </button>
                      {deleteMode && (
                        <button
                          className="btn-confirm-delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {post.postImage && (
                  <img
                    src={post.postImage}
                    alt="Post"
                    className="blog-post-image"
                  />
                )}
                <h2>{post.title}</h2>
                <div className="blog-meta">By {post.author}</div>
                <div className="blog-text-content">{post.content}</div>
              </div>
            ))
          )}
        </section>
      </main>

      <BlogCompose
        show={showCompose}
        onClose={closeCompose}
        newPost={newPost}
        setNewPost={setNewPost}
        onPublish={handlePublish}
        isEditing={!!editingPostId}
      />

      <BlogAppearance
        show={showAppearance}
        onClose={() => setShowAppearance(false)}
        textColor={textColor}
        textSize={textSize}
        background={background}
        tempTextColor={tempTextColor}
        setTempTextColor={setTempTextColor}
        tempTextSize={tempTextSize}
        setTempTextSize={setTempTextSize}
        tempBgColor={tempBgColor}
        setTempBgColor={setTempBgColor}
        tempImageBase64={tempImageBase64}
        setTempImageBase64={setTempImageBase64}
        handleFileChange={handleFileChange}
        handleFinalSave={handleFinalSave}
      />
    </div>
  );
};

export default Blog;
