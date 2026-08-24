const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "fallback-super-secret-key";

// Volatile memory storage for captchas (Cleared dynamically upon validation)
const captchaStore = new Map();

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.user = user;
    next();
  });
};

// ==========================================
// 🔓 SECURITY GATEWAY (CAPTCHA & 2FA RESET)
// ==========================================

// 1. Generate Mathematical Verification Challenge
app.get("/api/auth/captcha", (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  const captchaId = Math.random().toString(36).substring(2, 15);

  captchaStore.set(captchaId, { answer, expires: Date.now() + 300000 }); // Valid for 5 mins

  res.json({
    captchaId,
    question: `Human Validation: What is ${num1} + ${num2}?`,
  });
});

// 2. Persistent User Registration (FIXED DATA MAPS)
app.post("/api/auth/register", async (req, res) => {
  const { loginName, username, email, password, dateOfBirth } = req.body;
  try {
    const existing = await db.query(
      "SELECT id FROM users WHERE login_name = $1",
      [loginName.trim().toLowerCase()],
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Login name already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      `INSERT INTO users (login_name, username, email, password_hash, date_of_birth) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        loginName.trim().toLowerCase(),
        username,
        email,
        passwordHash,
        dateOfBirth,
      ],
    );

    // Extraction variable maps directly to structural array row profile indices
    const createdUserId = newUser.rows[0].id;

    // Seed empty customizable dashboard style rules mapped to user's identity
    await db.query("INSERT INTO user_settings (user_id) VALUES ($1)", [
      createdUserId,
    ]);
    res.json({ success: true, message: "Registration complete!" });
  } catch (err) {
    console.error("REGISTRATION_FAILURE_STACK:", err); // Outputs debug properties to terminal panel
    res
      .status(500)
      .json({ error: "Internal system fault during registration." });
  }
});

// 3. User Authentication Gateway
app.post("/api/auth/login", async (req, res) => {
  const { loginName, password, captchaId, captchaAnswer } = req.body;

  const cached = captchaStore.get(captchaId);
  if (!cached || Date.now() > cached.expires) {
    return res
      .status(400)
      .json({ error: "Captcha expired. Please refresh challenge." });
  }
  if (parseInt(captchaAnswer) !== cached.answer) {
    return res
      .status(400)
      .json({ error: "Incorrect human verification solution." });
  }
  captchaStore.delete(captchaId); // Prevent re-submission replay attacks

  try {
    const result = await db.query("SELECT * FROM users WHERE login_name = $1", [
      loginName.trim().toLowerCase(),
    ]);
    if (result.rows.length === 0)
      return res
        .status(404)
        .json({ error: "User credential profiles not found." });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Invalid security credentials." });

    const token = jwt.sign(
      { id: user.id, loginName: user.login_name },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.json({ token, username: user.username, loginName: user.login_name });
  } catch (err) {
    res.status(500).json({ error: "System processing failure at sign in." });
  }
});

// 4. 2FA Recovery Phase 1: Security Attribute Match & Generation
app.post("/api/auth/forgot-verify", async (req, res) => {
  const { loginName, dateOfBirth, email } = req.body;
  try {
    const result = await db.query(
      "SELECT id, email FROM users WHERE login_name = $1 AND date_of_birth = $2 AND email = $3",
      [loginName.trim().toLowerCase(), dateOfBirth, email],
    );
    if (result.rows.length === 0)
      return res
        .status(400)
        .json({ error: "Verification failed. Attributes do not match." });

    const user = result.rows[0];
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 Minute validation threshold

    await db.query(
      "UPDATE users SET security_2fa_code = $1, security_2fa_expiry = $2 WHERE id = $3",
      [securityCode, expiry, user.id],
    );

    res.json({
      success: true,
      message: "Two-factor secure payload produced.",
      debug_code: securityCode,
    });
  } catch (err) {
    res.status(500).json({ error: "System database handling failure." });
  }
});

// 5. 2FA Recovery Phase 2: Double Validation Code Execution & Password Write
app.post("/api/auth/reset-password", async (req, res) => {
  const { loginName, securityCode, newPassword } = req.body;
  try {
    const result = await db.query(
      "SELECT id, security_2fa_code, security_2fa_expiry FROM users WHERE login_name = $1",
      [loginName.trim().toLowerCase()],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Account identifier mismatch." });

    const user = result.rows[0];
    if (!user.security_2fa_code || user.security_2fa_code !== securityCode) {
      return res
        .status(400)
        .json({ error: "Invalid 2FA authorization token." });
    }
    if (new Date() > new Date(user.security_2fa_expiry)) {
      return res.status(400).json({
        error: "The 2FA token expiration threshold window has closed.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password_hash = $1, security_2fa_code = NULL, security_2fa_expiry = NULL WHERE id = $2",
      [newHash, user.id],
    );
    res.json({
      success: true,
      message: "Account securely updated with new structural hash key.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed modification pipeline execution." });
  }
});

// ==========================================
// 🎨 APPEARANCE COMPONENT CLOUD STATE
// ==========================================
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const settings = await db.query(
      "SELECT * FROM user_settings WHERE user_id = $1",
      [req.user.id],
    );
    res.json(settings.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: "Failed preference configuration parsing." });
  }
});

app.post("/api/settings", authenticateToken, async (req, res) => {
  const { background_type, background_value, text_color, text_size } = req.body;
  try {
    await db.query(
      `INSERT INTO user_settings (user_id, background_type, background_value, text_color, text_size)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE 
       SET background_type = $2, background_value = $3, text_color = $4, text_size = $5`,
      [req.user.id, background_type, background_value, text_color, text_size],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Persistent storage execution failure." });
  }
});

// ==========================================
// 📚 CATALOG MANAGED ENGINE
// ==========================================
app.get("/api/books", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, u.username as borrowed_by_name 
       FROM books b LEFT JOIN users u ON b.borrowed_by_user_id = u.id ORDER BY b.id DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Parsing storage matrix failed for book logs." });
  }
});

app.post("/api/books", authenticateToken, async (req, res) => {
  const { title, author, genre, publishedYear, description, isbn, totalPages } =
    req.body;
  try {
    await db.query(
      `INSERT INTO books (title, author, genre, published_year, description, isbn, total_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        title,
        author,
        genre,
        publishedYear || null,
        description,
        isbn,
        totalPages || null,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database catalog writing failure." });
  }
});

app.post("/api/books/:id/borrow", authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  try {
    const bookCheck = await db.query("SELECT * FROM books WHERE id = $1", [
      bookId,
    ]);
    if (bookCheck.rows.length === 0)
      return res.status(404).json({ error: "Book asset signature missing." });

    const book = bookCheck.rows[0];
    if (book.status === "Available") {
      await db.query(
        "UPDATE books SET status = $1, borrowed_by_user_id = $2 WHERE id = $3",
        ["Borrowed", req.user.id, bookId],
      );
    } else {
      if (book.borrowed_by_user_id !== req.user.id)
        return res
          .status(403)
          .json({ error: "Access token does not own current reservation." });
      await db.query(
        "UPDATE books SET status = $1, borrowed_by_user_id = NULL WHERE id = $2",
        ["Available", bookId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Relational logic write malfunction." });
  }
});

app.delete("/api/books/:id", authenticateToken, async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Data purges failed." });
  }
});

// ==========================================
// 📝 CORE SYNDICATION LOGS (BLOG)
// ==========================================
app.get("/api/blogs", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT b.*, u.username FROM blogs b JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed retrieval." });
  }
});

app.post("/api/blogs", authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    await db.query(
      "INSERT INTO blogs (user_id, title, content) VALUES ($1, $2, $3)",
      [req.user.id, title, content],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Post operation terminated unexpectedly." });
  }
});

// ==========================================
// 🔒 HIGH-LEVEL CRYPTO CIPHER ARCHIVE
// ==========================================
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, u1.username AS sender_name, u2.username AS recipient_name FROM
       secure_messages m JOIN users u1 ON m.sender_id = u1.id JOIN users u2 ON
       m.recipient_id = u2.id WHERE m.sender_id = $1 OR m.recipient_id = $1 ORDER BY
       m.created_at ASC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Message extraction failed." });
  }
});

app.post("/api/messages", authenticateToken, async (req, res) => {
  const { recipientLoginName, ciphertext, encryptedAesKey, iv } = req.body;
  try {
    const target = await db.query(
      "SELECT id FROM users WHERE login_name = $1",
      [recipientLoginName.trim().toLowerCase()],
    );
    if (target.rows.length === 0)
      return res
        .status(404)
        .json({ error: "Recipient address identity cannot be mapped." });

    await db.query(
      `INSERT INTO secure_messages (sender_id, recipient_id, ciphertext,
       encrypted_aes_key, iv) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, target.rows[0].id, ciphertext, encryptedAesKey, iv],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Message insertion pipeline failure." });
  }
});

// ==========================================
// 🌐 前後端無縫融合體（靜態網頁持久化派發）
// ==========================================

// 1. 讓伺服器可以讀取 React 編譯產出的 client/dist 靜態資源資料夾
app.use(express.static(path.join(__dirname, "client", "dist")));

// 2. 萬能攔截器：當使用者重新整理網頁或點選任何路由，一律回傳前端 React 入口網頁
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// ⚠️ 這是你原本就有的伺服器啟動行，請保持在最底部
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Production Server executing on operational port: ${PORT}`),
);
