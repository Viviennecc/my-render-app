import React, { useState, useMemo, useEffect } from "react";
import { decryptData } from "./utils/encryption";
import BC from "./components/BC";
import SearchBar from "./components/SearchBar";
import LibAppearance from "./LibAppearance";
import BookDetailsModal from "./components/BookDetailsModal";
import initialData from "./data/books.json";
import { useNavigate } from "react-router-dom";
import "./LibrarySystem.css";
//import { Link } from "react-router-dom";

// Image compression helper to stay under 5MB LocalStorage limit
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

  // --- Helpers ---
  const encrypt = (data) => btoa(JSON.stringify(data));
  const decrypt = (cipher) => {
    try {
      return JSON.parse(atob(cipher));
    } catch (e) {
      return null;
    }
  };

  // --- Core States ---
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem(`lib_system_master_encrypted`);
    return saved ? decrypt(saved) : initialData;
  });

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

  // --- 1. Initialization ---
  useEffect(() => {
    const initLibrary = async () => {
      setIsLoading(true);
      try {
        let activeUser = propUserName;
        const savedNameEnc = localStorage.getItem("encrypted_user_name");
        if (savedNameEnc) {
          const decryptedName = await decryptData(savedNameEnc);
          if (decryptedName) {
            setDisplayUserName(decryptedName);
            activeUser = decryptedName;
          }
        }

        const savedApp = localStorage.getItem(`lib_appearance_${activeUser}`);
        if (savedApp) {
          const settings = JSON.parse(savedApp);
          setTextColor(settings.textColor || "#1d1d1f");
          setTextSize(settings.textSize || 16);
          setBgStyle(settings.bgStyle || { type: "color", value: "#f0f4f8" });
          setTempTextColor(settings.textColor || "#1d1d1f");
          setTempTextSize(settings.textSize || 16);
          setTempBgColor(
            settings.bgStyle?.type === "color"
              ? settings.bgStyle.value
              : "#f0f4f8",
          );
        }
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initLibrary();
  }, [propUserName]);

  // --- 2. Persistence ---
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`lib_system_master_encrypted`, encrypt(books));
    }
  }, [books, isLoading]);

  // --- Handlers ---
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

    const settings = {
      textColor: tempTextColor,
      textSize: tempTextSize,
      bgStyle: newBg,
    };

    try {
      setTextColor(tempTextColor);
      setTextSize(tempTextSize);
      setBgStyle(newBg);
      localStorage.setItem(
        `lib_appearance_${displayUserName}`,
        JSON.stringify(settings),
      );
      setShowAppearance(false);
      setTempImageBase64("");
    } catch (e) {
      if (e.name === "QuotaExceededError")
        alert("Image too large! Try a smaller one.");
    }
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    const bookToAdd = {
      ...newBook,
      id: Date.now(),
      status: "Available",
      borrowedBy: null,
      cover: "https://placeholder.com",
    };

    setBooks((prev) => [bookToAdd, ...prev]);
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
  };

  const handleToggleBorrow = (bookId) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id === bookId) {
          const isAvailable = book.status === "Available";
          if (isAvailable)
            return { ...book, status: "Borrowed", borrowedBy: displayUserName };
          if (book.borrowedBy === displayUserName)
            return { ...book, status: "Available", borrowedBy: null };
        }
        return book;
      }),
    );
  };

  const handleRemoveBook = (bookId) => {
    if (window.confirm("Remove book?")) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    }
  };

  // --- FILTER LOGIC ---
  const displayBooks = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    // 1. First, handle Search filtering
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
      filtered = filtered.filter(
        (b) => b.status === "Borrowed" && b.borrowedBy === displayUserName,
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
              Dashboard
            </button>
          </nav>
        </aside>
      </div>

      <main className="lib-main-content">
        <header className="lib-header">
          <div className="lib-header-text">
            <h1 style={{ color: "inherit" }}>
              {currentView === "catalog" ? "Catalog" : "My Books"}
            </h1>
          </div>
        </header>

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
              >
                Save Book
              </button>
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
        <BookDetailsModal
          selectedBook={selectedBook}
          onClose={() => setSelectedBook(null)}
          onToggleBorrow={handleToggleBorrow}
          displayUserName={displayUserName}
        />
      </main>
    </div>
  );
};

export default LibrarySystem;
