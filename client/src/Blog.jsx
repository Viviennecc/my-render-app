import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import BlogAppearance from "./BlogAppearance";
import BlogCompose from "./BlogCompose";

const Blog = () => {
  const navigate = useNavigate();

  // --- 狀態宣告 ---
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayUserName, setDisplayUserName] = useState("Guest");

  // 外觀設定狀態 (BlogAppearance)
  const [showAppearance, setShowAppearance] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(16);
  const [background, setBackground] = useState({
    type: "color",
    value: "transparent",
  });

  // 暫存外觀設定
  const [tempTextColor, setTempTextColor] = useState("#000000");
  const [tempTextSize, setTempTextSize] = useState(16);
  const [tempBgColor, setTempBgColor] = useState("#ffffff");
  const [tempImageBase64, setTempImageBase64] = useState("");

  // 撰寫/編輯文章彈窗狀態 (BlogCompose)
  const [showCompose, setShowCompose] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    postColor: "#000000",
    postSize: 16,
    postImage: "",
    isShared: true,
    sharedWith: "",
  });

  // 刪除模式狀態
  const [deleteMode, setDeleteMode] = useState(false);

  // --- 初始化載入 ---
  useEffect(() => {
    const initBlogSystem = async () => {
      setIsLoading(true);
      try {
        const cachedUser = localStorage.getItem("currentUser");
        if (cachedUser) setDisplayUserName(cachedUser);

        const cloudBlogs = await api.getBlogs();
        if (cloudBlogs && !cloudBlogs.error) {
          setBlogs(cloudBlogs);
        }
      } catch (err) {
        console.error("無法載入雲端網誌:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initBlogSystem();
  }, []);

  // --- 處理檔案選擇 (背景桌布) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10485760) {
        alert("圖片檔案過大，請選擇 10MB 以下的圖片。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 套用外觀設定 ---
  const handleFinalSave = () => {
    setTextColor(tempTextColor);
    setTextSize(tempTextSize);
    if (tempImageBase64) {
      setBackground({ type: "image", value: tempImageBase64 });
    } else {
      setBackground({ type: "color", value: tempBgColor });
    }
    setShowAppearance(false);
  };

  // --- 發表或更新文章 ---
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("標題與內容不能為空");
      return;
    }

    try {
      if (isEditing && editingPostId) {
        // 假設有編輯 API，若無則依實際後端調整
        const res = (await api.updateBlog)
          ? await api.updateBlog(editingPostId, newPost)
          : await api.addBlog(newPost);
        if (res && res.error) {
          alert(res.error);
        }
      } else {
        const res = await api.addBlog({
          title: newPost.title,
          content: newPost.content,
          postColor: newPost.postColor,
          postSize: newPost.postSize,
          postImage: newPost.postImage,
          isShared: newPost.isShared,
          sharedWith: newPost.sharedWith,
        });
        if (res && res.error) {
          alert(res.error);
        }
      }

      // 重置並重新載入文章
      setShowCompose(false);
      setIsEditing(false);
      setEditingPostId(null);
      setNewPost({
        title: "",
        content: "",
        postColor: "#000000",
        postSize: 16,
        postImage: "",
        isShared: true,
        sharedWith: "",
      });

      const updatedBlogs = await api.getBlogs();
      if (updatedBlogs && !updatedBlogs.error) setBlogs(updatedBlogs);
    } catch (err) {
      alert("發佈或更新網誌失敗，請檢查網絡連線。");
    }
  };

  // --- 刪除文章 ---
  const handleDeletePost = async (id) => {
    if (!window.confirm("確定要刪除這篇文章嗎？")) return;
    try {
      if (api.deleteBlog) {
        await api.deleteBlog(id);
      }
      const updatedBlogs = await api.getBlogs();
      if (updatedBlogs && !updatedBlogs.error) setBlogs(updatedBlogs);
    } catch (err) {
      alert("刪除失敗");
    }
  };

  // --- 開啟編輯視窗 ---
  const handleEditClick = (post) => {
    setIsEditing(true);
    setEditingPostId(post.id);
    setNewPost({
      title: post.title || "",
      content: post.content || "",
      postColor: post.postColor || "#000000",
      postSize: post.postSize || 16,
      postImage: post.postImage || "",
      isShared: post.isShared ?? true,
      sharedWith: post.sharedWith || "",
    });
    setShowCompose(true);
  };

  // 計算動態背景樣式
  const getContainerBackgroundStyle = () => {
    if (background.type === "image") {
      return {
        backgroundImage: `url(${background.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {
      backgroundColor:
        background.value !== "transparent" ? background.value : "#f5f5f7",
    };
  };

  if (isLoading)
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#333" }}>
        Loading Cloud Blog System...
      </div>
    );

  return (
    <div className="lib-blog-container" style={getContainerBackgroundStyle()}>
      {/* 側邊欄 (Sidebar) */}
      <aside className="lib-blog-sidebar">
        <div className="lib-blog-logo">📝 雲端網誌</div>

        <button
          className="lib-nav-item btn-new-post"
          onClick={() => {
            setIsEditing(false);
            setNewPost({
              title: "",
              content: "",
              postColor: "#000000",
              postSize: 16,
              postImage: "",
              isShared: true,
              sharedWith: "",
            });
            setShowCompose(true);
          }}
        >
          <span>＋</span> 發表新文章
        </button>

        <button
          className="lib-nav-item"
          onClick={() => setShowAppearance(true)}
        >
          🎨 風格設定
        </button>

        <button
          className={`lib-nav-item btn-delete-mode ${deleteMode ? "active" : ""}`}
          onClick={() => setDeleteMode(!deleteMode)}
        >
          {deleteMode ? "完成刪除模式" : "🗑️ 刪除文章"}
        </button>

        <button className="lib-nav-item" onClick={() => navigate("/dashboard")}>
          🏠 返回主控台
        </button>

        <div className="lib-sidebar-footer">
          用戶: <strong>{displayUserName}</strong>
        </div>
      </aside>

      {/* 主內容區域 (Main Content Area) */}
      <main className="lib-blog-content">
        <header className="lib-blog-header">
          <h1>雲端永久網誌系統</h1>
          <p>歡迎回來，探索與記錄您的精彩時刻。</p>
        </header>

        {/* 歷史文章串流 */}
        <div className="lib-blog-timeline">
          {blogs.length === 0 ? (
            <p className="blog-empty-text">
              目前雲端資料庫中尚無任何文章，快來點擊左側「發表新文章」吧！
            </p>
          ) : (
            blogs.map((post) => (
              <div key={post.id || post._id} className="blog-card">
                <div className="blog-timestamp">
                  {new Date(post.created_at || Date.now()).toLocaleString()}
                </div>

                <h2 style={{ color: textColor, fontSize: `${textSize + 4}px` }}>
                  {post.title}
                </h2>

                <div className="blog-meta">
                  <span>
                    ✍️ 作者: <strong>{post.username || displayUserName}</strong>
                  </span>
                </div>

                {post.postImage && (
                  <img
                    src={post.postImage}
                    alt="Post media"
                    className="blog-post-image"
                  />
                )}

                <p
                  className="blog-text-content"
                  style={{
                    color: post.postColor || textColor,
                    fontSize: `${post.postSize || textSize}px`,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {post.content}
                </p>

                <div
                  className="blog-card-actions"
                  style={{ marginTop: "15px" }}
                >
                  <button
                    className="btn-edit-post"
                    onClick={() => handleEditClick(post)}
                    title="編輯文章"
                  >
                    ✏️
                  </button>

                  {deleteMode && (
                    <button
                      className="btn-confirm-delete"
                      onClick={() => handleDeletePost(post.id || post._id)}
                    >
                      確認刪除
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 外觀設定彈窗組件 */}
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

      {/* 撰寫/編輯文章彈窗組件 */}
      <BlogCompose
        show={showCompose}
        onClose={() => setShowCompose(false)}
        newPost={newPost}
        setNewPost={setNewPost}
        onPublish={handlePublish}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Blog;
