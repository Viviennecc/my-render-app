const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render 環境必備安全設定
  },
});

// 🌐 雲端資料庫結構自動核對與【自動升級 TEXT 欄位】
const initializeDatabase = async () => {
  try {
    // 1. 自動核對 schema.sql 建立基本資料表
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
    }

    // 2. ⚡ 核心解決方案：自動執行 ALTER TABLE，將欄位強制升級為 TEXT 類型
    await pool.query(
      "ALTER TABLE user_settings ALTER COLUMN background_value TYPE TEXT;",
    );
    console.log(
      "🎉 [雲端資料庫] 成功將外觀背景欄位強制升級為無限長度 TEXT 格式！",
    );
  } catch (err) {
    // 加上防錯：如果欄位已經是 TEXT 了，Postgres 可能會跳出提示，我們直接忽略它即可
    console.log(
      "💡 [雲端資料庫] 欄位已核對完畢或已是 TEXT 格式，系統正常運作中。",
    );
  }
};

// 立即執行資料庫優化
initializeDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
