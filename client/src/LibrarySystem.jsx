import React, { useState, useMemo, useEffect } from "react";
//import { decryptData } from "./utils/encryption";
import BC from "./components/BC";
import SearchBar from "./components/SearchBar";
import LibAppearance from "./LibAppearance";
import BookDetailsModal from "./components/BookDetailsModal";
//import initialData from "./data/books.json";
import { useNavigate } from "react-router-dom";
import "./LibrarySystem.css";
//import { Link } from "react-router-dom";
import { api } from "./api"; // 引入雲端後端大網關 API

// Image compression helper to stay under 5MB LocalStorage limit (完全保留)
const compressImage = (base64Str, maxWidth = 1000) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
  });
};

const LibrarySystem = ({ userName: propUserName = "Guest" }) => {
  const navigate = useNavigate();

  const [displayUserName, setDisplayUserName] = useState(propUserName);
  const [isLoading, setIsLoading] = useState(true);

  // --- Core States (全面對接雲端，移除初始 localStorage.getItem 的同步綁定) ---
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentView, setCurrentView] = useState("catalog");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  // Appearance State (完全保留)
  const [textColor, setTextColor] = useState("#1d1d1f");
  const [textSize, setTextSize] = useState(16);
  const [bgStyle, setBgStyle] = useState({ type: "color", value: "#f0f4f8" });

  // Modal Temp States (完全保留)
  const [tempTextColor, setTempTextColor] = useState("#1d1d1f");
  const [tempTextSize, setTempTextSize] = useState(16);
  const [tempBgColor, setTempBgColor] = useState("#f0f4f8");
  const [tempImageBase64, setTempImageBase64] = useState("");

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: "",
    publishedYear: "",
    description: "",
    isbn: "",
    totalPages: "",
  });

  // --- 1. Initialization (無縫升級為異步拉取 Render Postgres 雲端設定與書單) ---
  useEffect(() => {
    const initLibrary = async () => {
      setIsLoading(true);
      try {
        // 先同步設定登入者名稱
        const cachedUser = localStorage.getItem("currentUser");
        const activeUser = cachedUser || propUserName;
        setDisplayUserName(activeUser);

        // A. 異步獲取 Render 雲端外觀偏好設定
        const savedSettings = await api.getSettings();
        if (
          savedSettings &&
          !savedSettings.error &&
          savedSettings.background_type
        ) {
          const cloudBg = {
            type: savedSettings.background_type,
            value: savedSettings.background_value,
          };
          setBgStyle(cloudBg);
          if (savedSettings.text_color) setTextColor(savedSettings.text_color);
          if (savedSettings.text_size) setTextSize(savedSettings.text_size);

          // 同步初始化暫存 Modal
          setTempTextColor(savedSettings.text_color);
          setTempTextSize(savedSettings.text_size);
          setTempBgColor(
            savedSettings.background_type === "color"
              ? savedSettings.background_value
              : "#f0f4f8",
          );
        }

        // B. 異步獲取 Render 雲端 Postgres 永久書籍資料清單
        const cloudBooks = await api.getBooks();
        if (cloudBooks && !cloudBooks.error) {
          setBooks(cloudBooks);
        }
      } catch (err) {
        console.error("Init Cloud Library Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initLibrary();
  }, [propUserName]);

  // --- Handlers (完全保留原圖檔壓縮行為，改為持久化儲存至 Postgres) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setTempImageBase64(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSave = async () => {
    const finalImage = tempImageBase64 ? `url(${tempImageBase64})` : null;
    const newBg = finalImage
      ? { type: "image", value: finalImage }
      : { type: "color", value: tempBgColor };

    try {
      // 1. 先更新前端 state 保持極速響應
      setTextColor(tempTextColor);
      setTextSize(tempTextSize);
      setBgStyle(newBg);

      // 2. 一鍵推送寫入 Render 後端
      await api.saveSettings({
        background_type: newBg.type,
        background_value: newBg.value,
        text_color: tempTextColor,
        text_size: tempTextSize,
      });

      setShowAppearance(false);
      setTempImageBase64("");
    } catch (e) {
      console.error("Cloud appearance save failure", e);
    }
  };

  // 串接雲端 Postgres 資料庫添加書籍端點
  const handleSaveBook = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.addBook({
        title: newBook.title,
        author: newBook.author,
        genre: newBook.genre,
        publishedYear: parseInt(newBook.publishedYear) || null,
        description: newBook.description,
        isbn: newBook.isbn,
        totalPages: parseInt(newBook.totalPages) || null,
      });

      if (res.error) {
        alert(res.error);
      } else {
        // 重置輸入格
        setNewBook({
          title: "",
          author: "",
          genre: "",
          publishedYear: "",
          description: "",
          isbn: "",
          totalPages: "",
        });
        setShowAddModal(false);
        // 重新自雲端刷新載入新書單
        const updatedBooks = await api.getBooks();
        if (updatedBooks && !updatedBooks.error) setBooks(updatedBooks);
      }
    } catch (err) {
      alert("Failed to write new asset into PostgreSQL library table.");
    }
  };

  // 串接雲端 Postgres 借還狀態互鎖邏輯
  const handleToggleBorrow = async (bookId) => {
    try {
      const res = await api.toggleBorrow(bookId);
      if (res.error) {
        alert(res.error);
      } else {
        // 借還成功直接拉取資料庫最新狀態同步更新 UI
        const updatedBooks = await api.getBooks();
        if (updatedBooks && !updatedBooks.error) setBooks(updatedBooks);
      }
    } catch (err) {
      console.error("Borrow update failure", err);
    }
  };

  // 串接雲端 Postgres 物理刪除端點
  const handleRemoveBook = async (bookId) => {
    if (
      window.confirm("Remove book permanently from Cloud PostgreSQL database?")
    ) {
      try {
        const res = await api.deleteBook(bookId);
        if (res.error) {
          alert(res.error);
        } else {
          setBooks((prev) => prev.filter((b) => b.id !== bookId));
        }
      } catch (err) {
        alert("Failed to delete book log from cloud server.");
      }
    }
  };

  // --- FILTER LOGIC (完全保留您原本手寫的高效數據過濾邏輯與狀態變更) ---
  const displayBooks = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    // 1. Handle Search filtering
    let filtered = books.filter(
      (b) =>
        b.title.toLowerCase().includes(lowerSearch) ||
        b.author.toLowerCase().includes(lowerSearch),
    );

    // 2. Filter based on current view
    if (currentView === "catalog") {
      // Catalog: ONLY show available books
      filtered = filtered.filter((b) => b.status === "Available");
    } else if (currentView === "mybooks") {
      // My Books: ONLY show books borrowed by the current user
      // 對應後端返回的欄位名稱 borrowed_by_name (即借閱者的 username)
      filtered = filtered.filter(
        (b) =>
          b.status === "Borrowed" &&
          (b.borrowed_by_name === displayUserName ||
            b.borrowedBy === displayUserName),
      );
    }

    return filtered;
  }, [search, books, currentView, displayUserName]);

  const containerStyle = {
    background: bgStyle.value,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    color: textColor,
    fontSize: `${textSize}px`,
  };

  if (isLoading) return null;

  return (
    <div className="lib-container" style={containerStyle}>
      <div
        className="lib-sidebar-wrapper"
        onMouseEnter={() => setIsSidebarVisible(true)}
        onMouseLeave={() => setIsSidebarVisible(false)}
      >
        <aside
          className={`lib-sidebar ${isSidebarVisible ? "lib-expanded" : "lib-collapsed"}`}
        >
          <div className="lib-brand">Library System</div>
          <div
            className="lib-user-tag"
            style={{ padding: "0 20px", fontSize: "12px", opacity: 0.7 }}
          >
            User: <strong>{displayUserName}</strong>
          </div>

          <nav className="lib-nav-menu">
            <br />
            <div className="lib-nav-item">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search books..."
              />
            </div>
            <br />
            <button
              className={`lib-nav-item ${currentView === "catalog" ? "lib-active" : ""}`}
              onClick={() => {
                setCurrentView("catalog");
                setIsRemoveMode(false);
              }}
            >
              📚 Catalog
            </button>
            <button
              className={`lib-nav-item ${currentView === "mybooks" ? "lib-active" : ""}`}
              onClick={() => {
                setCurrentView("mybooks");
                setIsRemoveMode(false);
              }}
            >
              📖 My Books
            </button>
            <button
              className="lib-nav-item lib-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Add New
            </button>
            <button
              className={`lib-nav-item lib-remove-btn ${isRemoveMode ? "lib-active-remove" : ""}`}
              onClick={() => setIsRemoveMode(!isRemoveMode)}
            >
              {isRemoveMode ? "✅ Finish" : "🗑️ Remove"}
            </button>
            <button
              className="lib-nav-item"
              onClick={() => setShowAppearance(true)}
            >
              🎨 Appearance
            </button>
            <button
              className="lib-nav-item"
              onClick={() => navigate("/dashboard")}
            >
              🏠 Dashboard
            </button>
          </nav>
        </aside>
      </div>

      <div
        className="lib-grid"
        style={{
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {displayBooks.map((book) => (
          <div
            key={book.id}
            className="lib-book-card"
            onClick={() => !isRemoveMode && setSelectedBook(book)}
            style={{
              position: "relative",
              border: "1px solid rgba(0,0,0,0.1)",
              padding: "15px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.8)",
              cursor: isRemoveMode ? "default" : "pointer",
            }}
          >
            {book.title}
            <p style={{ fontSize: "12px", opacity: 0.8 }}>By {book.author}</p>
            {isRemoveMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBook(book.id);
                }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "red",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ✕ Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div
          className="lib-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <form
            className="lib-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveBook}
          >
            ➕ Add New Book
            {[
              ["title", "Title"],
              ["genre", "Genre"],
              ["publishedYear", "Published Year"],
              ["author", "Author"],
              ["isbn", "ISBN"],
              ["totalPages", "Total Pages"],
            ].map(([field, placeholder]) => (
              <input
                key={field}
                required={
                  field === "title" ||
                  field === "genre" ||
                  field === "publishedYear" ||
                  field === "author"
                }
                type={
                  field === "publishedYear" || field === "totalPages"
                    ? "number"
                    : "text"
                }
                className="lib-mac-input"
                placeholder={placeholder}
                value={newBook[field]}
                onChange={(e) =>
                  setNewBook({ ...newBook, [field]: e.target.value })
                }
              />
            ))}
            <textarea
              className="lib-mac-input lib-textarea"
              placeholder="Description"
              value={newBook.description}
              onChange={(e) =>
                setNewBook({ ...newBook, description: e.target.value })
              }
            />
            <button
              type="button"
              className="lib-btn-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="lib-btn-primary">
              Save
            </button>
          </form>
        </div>
      )}
      <LibAppearance
        show={showAppearance}
        onClose={() => setShowAppearance(false)}
        tempTextColor={tempTextColor}
        setTempTextColor={setTempTextColor}
        tempTextSize={tempTextSize}
        setTempTextSize={setTempTextSize}
        tempBgColor={tempBgColor}
        setTempBgColor={setTempBgColor}
        handleFileChange={handleFileChange}
        handleFinalSave={handleFinalSave}
        tempImageBase64={tempImageBase64}
      />
      {selectedBook && (
        <BookDetailsModal
          selectedBook={selectedBook}
          onClose={() => setSelectedBook(null)}
          onToggleBorrow={handleToggleBorrow}
          displayUserName={displayUserName}
        />
      )}
    </div>
  );
};

export default LibrarySystem;
