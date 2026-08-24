import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api"; // 引入雲端後端大網關 API
import "./Blog.css"; // 保留您原本的網誌樣式表

const Blog = () => {
  const navigate = useNavigate();

  // --- 狀態宣告 ---
  const [blogs, setBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: "", content: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [displayUserName, setDisplayUserName] = useState("Guest");

  // --- 頁面初始化：從雲端拉取歷史網誌與用戶狀態 ---
  useEffect(() => {
    const initBlogSystem = async () => {
      setIsLoading(true);
      try {
        // 設定顯示的登入者名稱
        const cachedUser = localStorage.getItem("currentUser");
        if (cachedUser) setDisplayUserName(cachedUser);

        // 自 Render 後端永久 Postgres 資料庫讀取所有網誌文章
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

  // --- 處理發表新網誌 (寫入 PostgreSQL 永久儲存) ---
  const handlePublishBlog = async (e) => {
    e.preventDefault();
    if (!newBlog.title.trim() || !newBlog.content.trim()) {
      alert("標題與內容不能為空");
      return;
    }

    try {
      const res = await api.addBlog({
        title: newBlog.title,
        content: newBlog.content,
      });

      if (res.error) {
        alert(res.error);
      } else {
        // 發表成功，清空輸入框
        setNewBlog({ title: "", content: "" });
        // 重新自雲端刷新文章清單
        const updatedBlogs = await api.getBlogs();
        if (updatedBlogs && !updatedBlogs.error) setBlogs(updatedBlogs);
      }
    } catch (err) {
      alert("發佈網誌失敗，請檢查網絡連線。");
    }
  };

  if (isLoading)
    return (
      <div style={{ padding: "20px", color: "#fff" }}>
        Loading Cloud Blog System...
      </div>
    );

  return (
    <div
      className="blog-master-container"
      style={{ padding: "20px", minHeight: "100vh" }}
    >
      {/* 頂部導航區域 (保留您原本的返回排版) */}
      <header
        className="blog-header-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2>📝 雲端永久網誌系統 (Blog)</h2>
        <button
          className="blog-back-btn"
          onClick={() => navigate("/dashboard")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          返回主控台
        </button>
      </header>

      {/* 發表新文章表單容器 - 完美契合原本 UI */}
      <div
        className="blog-write-card"
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          color: "#000",
        }}
      >
        <h3>發表新文章 (當前作者: {displayUserName})</h3>
        <form
          onSubmit={handlePublishBlog}
          style={{ display: "grid", gap: "15px" }}
        >
          <input
            type="text"
            placeholder="請輸入文章標題..."
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          />
          <textarea
            placeholder="撰寫您的網誌內容..."
            value={newBlog.content}
            onChange={(e) =>
              setNewBlog({ ...newBlog, content: e.target.value })
            }
            style={{
              width: "100%",
              height: "150px",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              resize: "vertical",
            }}
            required
          />
          <button
            type="submit"
            style={{
              background: "#1d1d1f",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            安全發佈文章至雲端
          </button>
        </form>
      </div>

      {/* 歷史文章列表展示 */}
      <div className="blog-timeline-section">
        <h3>✨ 歷史文章串流</h3>
        {blogs.length === 0 ? (
          <p style={{ color: "#eee", fontStyle: "italic" }}>
            目前雲端資料庫中尚無任何文章，快來發表第一篇吧！
          </p>
        ) : (
          blogs.map((post) => (
            <div
              key={post.id}
              className="blog-post-card"
              style={{
                background: "rgba(255,255,255,0.9)",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "15px",
                color: "#000",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
                {post.title}
              </h4>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                <span>
                  ✍️ 作者: <strong>{post.username || "未知用戶"}</strong>
                </span>
                <span style={{ marginLeft: "15px" }}>
                  📅 時間: {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
              <p
                style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0 }}
              >
                {post.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Blog;
