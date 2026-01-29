-- EduQuest Database Schema
-- This file creates all database tables and constraints

-- Drop existing tables if they exist (handled by spring.jpa.hibernate.ddl-auto=create-drop)
-- DROP TABLE IF EXISTS user_roles, refresh_tokens, users, roles CASCADE;

-- 1. roles table
CREATE TABLE IF NOT EXISTS roles (
     id BIGSERIAL PRIMARY KEY,
     name VARCHAR(20) UNIQUE NOT NULL
);

-- 2. users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0)
);

-- 3. Join table for users and roles
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

-- 4. Games
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENGLISH','MATH','MEMORY','SCIENCE')),
    name VARCHAR(50) UNIQUE NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    icon TEXT,
    description TEXT
);

-- 5. User Game Scores
CREATE TABLE IF NOT EXISTS user_game_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    scores INT NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Index for leaderboard queries per game (fast ORDER BY)
CREATE INDEX IF NOT EXISTS idx_game_scores_game_scores ON user_game_scores (game_id, scores DESC);
-- Index to fetch recent updates per user
CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_created ON user_game_scores (user_id, created_at DESC);

-- 6. Missions
CREATE TABLE IF NOT EXISTS missions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Missions
CREATE TABLE IF NOT EXISTS user_missions (
    user_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, mission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);