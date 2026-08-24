-- 1. 使用者主要資料表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login_name VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    has_changed_username BOOLEAN DEFAULT FALSE,
    security_2fa_code VARCHAR(10),
    security_2fa_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 使用者儀表板外觀與偏好設定
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    background_type VARCHAR(20) DEFAULT 'color',
    background_value TEXT DEFAULT '#F0F2F2',
    text_color VARCHAR(20) DEFAULT '#1d1d1f',
    text_size INT DEFAULT 16,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 圖書管理系統資料表
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    published_year INT,
    description TEXT,
    isbn VARCHAR(50),
    total_pages INT,
    status VARCHAR(20) DEFAULT 'Available',
    borrowed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 網誌系統資料表
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 高強度端到端安全加密訊息資料表
CREATE TABLE IF NOT EXISTS secure_messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INT REFERENCES users(id) ON DELETE CASCADE,
    ciphertext TEXT NOT NULL,
    encrypted_aes_key TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
