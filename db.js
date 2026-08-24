const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render PostgreSQL 必備安全連線設定
  },
});

// 🌐 自動偵測並初始化雲端資料表結構
const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
      console.log("🎉 雲端 PostgreSQL 資料表初始化/核對成功！");
    } else {
      console.log("⚠️ 找不到 schema.sql 檔案，請跳過自動初始化。");
    }
  } catch (err) {
    console.error("❌ 資料庫結構自動寫入失敗:", err);
  }
};

// 立即執行初始化
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
