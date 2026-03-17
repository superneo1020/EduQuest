-- EduQuest Database Schema
-- This file creates all database tables and constraints

-- Drop existing tables if they exist (handled by spring.jpa.hibernate.ddl-auto=create-drop)
-- DROP TABLE IF EXISTS user_roles, refresh_tokens, users, roles CASCADE;

-- 1. roles table
CREATE TABLE IF NOT EXISTS roles (
     id BIGSERIAL PRIMARY KEY,
     name VARCHAR(20) UNIQUE NOT NULL
);
;;;

-- 2. users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0)
);
;;;

-- 3. Join table for users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
;;;

-- Create indexes for user roles performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 4. Difficulty with rewards
CREATE TABLE IF NOT EXISTS difficulty_rewards (
    difficulty VARCHAR(20) PRIMARY KEY,
    multiplier INT NOT NULL DEFAULT 1 CHECK (multiplier >= 1)
);
;;;

-- 5. Games
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENGLISH','MATH','MEMORY','SCIENCE')),
    name VARCHAR(50) UNIQUE NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (difficulty) REFERENCES difficulty_rewards(difficulty) ON UPDATE CASCADE
);
;;;

-- 6. User Game Scores
CREATE TABLE IF NOT EXISTS user_game_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    difficulty VARCHAR(20),
    scores INT NOT NULL DEFAULT 0 CHECK (scores >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
;;;

-- Index for leaderboard queries per game (fast ORDER BY)
CREATE INDEX IF NOT EXISTS idx_game_scores_game_scores ON user_game_scores (game_id, scores DESC);
;;;
-- Index to fetch recent updates per user
CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_created ON user_game_scores (user_id, created_at DESC);
;;;

-- 7. Missions
CREATE TABLE IF NOT EXISTS missions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENGLISH','MATH','MEMORY','SCIENCE')),
    name VARCHAR(100) UNIQUE NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    icon TEXT,
    description TEXT,
    scores INT NOT NULL DEFAULT 0 CHECK (scores >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (difficulty) REFERENCES difficulty_rewards(difficulty) ON UPDATE CASCADE
);
;;;

-- 8. User Missions
CREATE TABLE IF NOT EXISTS user_missions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, mission_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);
;;;

-- 9. Item
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    price INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
;;;

-- 10. User Item
CREATE TABLE IF NOT EXISTS user_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
;;;



-- add trigger for sync game scores
CREATE OR REPLACE FUNCTION fn_sync_game_points()
    RETURNS TRIGGER AS $$
DECLARE
    v_multiplier INT;
    v_points_change INT;
BEGIN
    -- get multiplier from game id
    SELECT dr.multiplier INTO v_multiplier
    FROM difficulty_rewards dr
             JOIN games g ON g.difficulty = dr.difficulty
    WHERE g.id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.game_id
        ELSE NEW.game_id
    END;

    -- make sure multiplier is at least 1
    v_multiplier := COALESCE(v_multiplier, 1);

    -- calculate scores for points based on operation
    IF (TG_OP = 'INSERT') THEN
        v_points_change := NEW.scores * v_multiplier;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_points_change := (NEW.scores - OLD.scores) * v_multiplier;
    ELSIF (TG_OP = 'DELETE') THEN
        v_points_change := -(OLD.scores * v_multiplier);
    END IF;

    -- update points in user table
    IF v_points_change <> 0 THEN
        UPDATE users
        SET points = GREATEST(0, points + v_points_change)
        WHERE id = CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.user_id
            ELSE NEW.user_id
        END;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
;;;

DROP TRIGGER IF EXISTS trg_game_points ON user_game_scores;
;;;
CREATE TRIGGER trg_game_points
    AFTER INSERT OR UPDATE OR DELETE ON user_game_scores
    FOR EACH ROW EXECUTE FUNCTION fn_sync_game_points();
;;;



-- add trigger for sync mission scores
CREATE OR REPLACE FUNCTION fn_sync_mission_points()
    RETURNS TRIGGER AS $$
DECLARE
    v_multiplier INT;
    v_base_score INT;
    v_total_points INT;
BEGIN
    -- get multiplier from mission id
    SELECT m.scores, dr.multiplier INTO v_base_score, v_multiplier
    FROM missions m
             JOIN difficulty_rewards dr ON m.difficulty = dr.difficulty
    WHERE m.id = CASE
         WHEN TG_OP = 'DELETE' THEN OLD.mission_id
         ELSE NEW.mission_id
    END;

    -- calculate points where multiplier is at least 1 and score is at least 0
    v_total_points := COALESCE(v_base_score, 0) * COALESCE(v_multiplier, 1);

    -- update points in user table based on operation and completeness
    IF (TG_OP = 'INSERT' AND NEW.completed) THEN
        UPDATE users SET points = points + v_total_points WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NOT OLD.completed AND NEW.completed) THEN
            UPDATE users SET points = points + v_total_points WHERE id = NEW.user_id;
        ELSIF (OLD.completed AND NOT NEW.completed) THEN
            UPDATE users SET points = GREATEST(0, points - v_total_points) WHERE id = NEW.user_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.completed) THEN
        UPDATE users SET points = GREATEST(0, points - v_total_points) WHERE id = OLD.user_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
;;;

DROP TRIGGER IF EXISTS trg_mission_points ON user_missions;
;;;
CREATE TRIGGER trg_mission_points
    AFTER INSERT OR UPDATE OR DELETE ON user_missions
    FOR EACH ROW EXECUTE FUNCTION fn_sync_mission_points();
;;;


CREATE OR REPLACE FUNCTION fn_sync_user_item_purchase()
    RETURNS TRIGGER AS $$
DECLARE
    v_price INT;
BEGIN
    -- buy items: reduce points
    IF (TG_OP = 'INSERT') THEN
        SELECT price INTO v_price FROM items WHERE id = NEW.item_id;
        UPDATE users SET points = points - v_price WHERE id = NEW.user_id;
    -- delete record (like refund): add points
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT price INTO v_price FROM items WHERE id = OLD.item_id;
        UPDATE users SET points = points + v_price WHERE id = OLD.user_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
;;;

DROP TRIGGER IF EXISTS trg_user_item_purchase ON user_items;
;;;
CREATE TRIGGER trg_user_item_purchase
    AFTER INSERT OR DELETE ON user_items
    FOR EACH ROW EXECUTE FUNCTION fn_sync_user_item_purchase();
;;;