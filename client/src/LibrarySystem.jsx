import { useState, useMemo, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import LibAppearance from "./LibAppearance";
import BookDetailsModal from "./components/BookDetailsModal";
import { useNavigate } from "react-router-dom";
import "./LibrarySystem.css";
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

  // --- Core States ---
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentView, setCurrentView] = useState("catalog");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  // Appearance State
  const [textColor, setTextColor] = useState("#1d1d1f");
  const [textSize, setTextSize] = useState(16);
  const [bgStyle, setBgStyle] = useState({ type: "color", value: "#f0f4f8" });

  // Modal Temp States
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

  // --- 1. Initialization (精準修復雲端圖片路徑解析) ---
  useEffect(() => {
    const initLibrary = async () => {
      setIsLoading(true);
      try {
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
          let displayBgValue = savedSettings.background_value;
          // ⚠️ 核心修復：如果雲端存的是純 Base64 圖片，載入時前端自動幫它補上 url() 包裹以利 CSS 渲染
          if (
            savedSettings.background_type === "image" &&
            !displayBgValue.startsWith("url(")
          ) {
            displayBgValue = `url(${displayBgValue})`;
          }

          const cloudBg = {
            type: savedSettings.background_type,
            value: displayBgValue,
          };

          setBgStyle(cloudBg);
          if (savedSettings.text_color) setTextColor(savedSettings.text_color);
          if (savedSettings.text_size) setTextSize(savedSettings.text_size);

          // 同步初始化暫存 Modal 的預設色彩
          setTempTextColor(savedSettings.text_color);
          setTempTextSize(savedSettings.text_size);
          if (savedSettings.background_type === "color") {
            setTempBgColor(savedSettings.background_value);
          }
        }

        // B. 異步獲取雲端書單
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

  // --- Handlers (精準修復雲端儲存純淨資料流) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // 修正多選指標為單選[0]
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setTempImageBase64(compressed); // 這裡存的是純淨的 data:image/jpeg;base64...
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSave = async () => {
    let cloudBgValue;
    let localBgValue;

    if (tempImageBase64) {
      // ⚠️ 核心修復：發給雲端資料庫「純淨的 Base64 數據」，但本地渲染加上 url()
      cloudBgValue = tempImageBase64;
      localBgValue = `url(${tempImageBase64})`;
    } else {
      cloudBgValue = tempBgColor;
      localBgValue = tempBgColor;
    }

    const newBgStyle = {
      type: tempImageBase64 ? "image" : "color",
      value: localBgValue,
    };

    try {
      // 1. 先更新前端本地狀態，畫面立刻變化
      setTextColor(tempTextColor);
      setTextSize(tempTextSize);
      setBgStyle(newBgStyle);

      // 2. 一鍵推送寫入 Render 後端資料庫，徹底對齊格式
      const res = await api.saveSettings({
        background_type: newBgStyle.type,
        background_value: cloudBgValue, // 存入純淨數據
        text_color: tempTextColor,
        text_size: parseInt(tempTextSize) || 16,
      });

      if (res && res.error) {
        alert("雲端儲存未成功: " + res.error);
        return;
      }

      setShowAppearance(false);
      setTempImageBase64("");
    } catch (e) {
      console.error("Cloud appearance save failure", e);
      alert("儲存失敗，請檢查網路連線");
    }
  };

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
        const updatedBooks = await api.getBooks();
        if (updatedBooks && !updatedBooks.error) setBooks(updatedBooks);
      }
    } catch (err) {
      alert("Failed to write new asset into PostgreSQL library table.");
    }
  };

  const handleToggleBorrow = async (bookId) => {
    try {
      const res = await api.toggleBorrow(bookId);
      if (res.error) {
        alert(res.error);
      } else {
        const updatedBooks = await api.getBooks();
        if (updatedBooks && !updatedBooks.error) setBooks(updatedBooks);
      }
    } catch (err) {
      console.error("Borrow update failure", err);
    }
  };

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

  // --- FILTER LOGIC (完全保留) ---
  const displayBooks = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    let filtered = books.filter(
      (b) =>
        b.title.toLowerCase().includes(lowerSearch) ||
        b.author.toLowerCase().includes(lowerSearch),
    );

    if (currentView === "catalog") {
      filtered = filtered.filter((b) => b.status === "Available");
    } else if (currentView === "mybooks") {
      filtered = filtered.filter(
        (b) =>
          b.status === "Borrowed" &&
          (b.borrowed_by_name === displayUserName ||
            b.borrowedBy === displayUserName),
      );
    }
    return filtered;
  }, [search, books, currentView, displayUserName]);

  // CSS 動態綁定
  const containerStyle = {
    background: bgStyle.value.startsWith("url(") ? bgStyle.value : "none",
    backgroundColor: bgStyle.type === "color" ? bgStyle.value : "transparent",
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
                <p style={{ fontSize: "12px", opacity: 0.8 }}>
                  By {book.author}
                </p>
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
              <div className="lib-modal" onClick={(e) => e.stopPropagation()}>
                ➕ Add New Book
                <input
                  required
                  className="lib-mac-input"
                  placeholder="Title"
                  value={newBook.title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, title: e.target.value })
                  }
                />
                <input
                  required
                  className="lib-mac-input"
                  placeholder="Genre"
                  value={newBook.genre}
                  onChange={(e) =>
                    setNewBook({ ...newBook, genre: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  className="lib-mac-input"
                  placeholder="Published Year"
                  value={newBook.publishedYear}
                  onChange={(e) =>
                    setNewBook({ ...newBook, publishedYear: e.target.value })
                  }
                />
                <input
                  required
                  className="lib-mac-input"
                  placeholder="Author"
                  value={newBook.author}
                  onChange={(e) =>
                    setNewBook({ ...newBook, author: e.target.value })
                  }
                />
                <input
                  className="lib-mac-input"
                  placeholder="ISBN"
                  value={newBook.isbn}
                  onChange={(e) =>
                    setNewBook({ ...newBook, isbn: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="lib-mac-input"
                  placeholder="Total Pages"
                  value={newBook.totalPages}
                  onChange={(e) =>
                    setNewBook({ ...newBook, totalPages: e.target.value })
                  }
                />
                <textarea
                  className="lib-mac-input lib-textarea"
                  placeholder="Description"
                  value={newBook.description}
                  onChange={(e) =>
                    setNewBook({ ...newBook, description: e.target.value })
                  }
                />
                <div style={{ marginTop: "15px" }}>
                  <button
                    type="button"
                    className="lib-btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="lib-btn-primary"
                    onClick={handleSaveBook}
                    style={{ marginLeft: "10px" }}
                  >
                    Save Book
                  </button>
                </div>
              </div>
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
        </aside>
      </div>
    </div>
  );
};

export default LibrarySystem;
