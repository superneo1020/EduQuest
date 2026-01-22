-- EduQuest Database Schema
-- This file creates all database tables and constraints

-- Drop existing tables if they exist (handled by spring.jpa.hibernate.ddl-auto=create-drop)
-- DROP TABLE IF EXISTS user_roles, refresh_tokens, users, roles CASCADE;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
     id BIGSERIAL PRIMARY KEY,
     name VARCHAR(20) UNIQUE NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Join table for users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);


-- 4. 遊戲清單表 (Games)
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon TEXT, -- 存儲圖片網址或 Base64
    description TEXT
);

-- 5. 遊戲分數表 (User Game Scores)
CREATE TABLE IF NOT EXISTS user_game_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    scores INT DEFAULT 0 CHECK (scores >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 6. 任務定義表 (Missions)
CREATE TABLE IF NOT EXISTS missions (
    id BIGSERIAL PRIMARY KEY,
    mission VARCHAR(100) UNIQUE NOT NULL,
    mission_icon TEXT,
    description TEXT,
    exp_reward INT DEFAULT 0, -- 完成後可獲得的 EXP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 用戶任務進度表 (User Missions)
CREATE TABLE IF NOT EXISTS user_missions (
    user_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, mission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

-- 8. 經驗值紀錄表 (Exp - 存儲不同行為的 EXP 價值)
CREATE TABLE IF NOT EXISTS exp (
    id SERIAL PRIMARY KEY,
    value INT NOT NULL, -- 例如: 10, 50, 100
    description VARCHAR(50), -- 例如: 'Daily Login', 'Game Clear'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. 用戶經驗值關聯表 (User Exp - 紀錄學生獲得的每一筆 EXP)
CREATE TABLE IF NOT EXISTS user_exp (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    exp_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exp_id) REFERENCES exp(id) ON DELETE CASCADE
);

-- 10. 性能優化索引 (Indexes)
CREATE INDEX IF NOT EXISTS idx_user_scores_val ON user_game_scores(scores DESC);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON user_missions(completed);


