-- EduQuest Database Schema
-- This file creates all database tables and constraints

-- Drop existing tables if they exist (handled by spring.jpa.hibernate.ddl-auto=create-drop)
-- DROP TABLE IF EXISTS user_roles, refresh_tokens, users, roles CASCADE;


CREATE TABLE IF NOT EXISTS schools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
;;;

CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    suffix VARCHAR(10) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, grade, suffix, academic_year),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
;;;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    school_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);
;;;

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
;;;

CREATE TABLE IF NOT EXISTS class_members (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_in_class VARCHAR(20) DEFAULT 'student' CHECK (role_in_class IN ('student', 'teacher', 'assistant')),
    UNIQUE (class_id, user_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON class_members(class_id);
;;;
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON class_members(user_id);
;;;

CREATE TABLE IF NOT EXISTS roles (
     id BIGSERIAL PRIMARY KEY,
     name VARCHAR(20) UNIQUE NOT NULL
);
;;;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
;;;
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
;;;

CREATE TABLE IF NOT EXISTS user_profiles (
     id BIGSERIAL PRIMARY KEY,
     user_id BIGINT UNIQUE NOT NULL,
     nickname VARCHAR(50),
     equipped_items JSONB DEFAULT '{"AVATAR": null, "BADGE": null, "BACKGROUND": null}',
     preferences JSONB DEFAULT '{"theme": "DARK", "sound": true, "notifications": false}',
     privacy_settings JSONB DEFAULT '{"show_email": true, "show_school": true, "show_class": true}',
     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
;;;

CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL CHECK (start_date >= CURRENT_DATE),
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0),
    icon TEXT,
    description TEXT,
    UNIQUE (creator_id, name),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_activities_creator_id ON activities(creator_id);
;;;

CREATE TABLE IF NOT EXISTS user_activities (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_in_group VARCHAR(50) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);
;;;
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
;;;

-- Difficulty with rewards
CREATE TABLE IF NOT EXISTS difficulty_rewards (
    difficulty VARCHAR(20) PRIMARY KEY,
    multiplier INT NOT NULL DEFAULT 1 CHECK (multiplier >= 1)
);
;;;

CREATE INDEX IF NOT EXISTS idx_difficulty_rewards_difficulty ON difficulty_rewards(difficulty);
;;;

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
CREATE INDEX IF NOT EXISTS idx_user_game_scores_leaderboard
ON user_game_scores (game_id, user_id, scores DESC, created_at)
INCLUDE (id);
;;;
-- Index to fetch recent updates per user
CREATE INDEX IF NOT EXISTS idx_user_game_scores_user_created ON user_game_scores (user_id, created_at DESC);
;;;

CREATE TABLE IF NOT EXISTS missions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENGLISH','MATH','MEMORY','SCIENCE')),
    name VARCHAR(100) UNIQUE NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    icon TEXT,
    description TEXT,
    scores INT NOT NULL DEFAULT 0 CHECK (scores >= 0),
    requirements JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (difficulty) REFERENCES difficulty_rewards(difficulty) ON UPDATE CASCADE
);
;;;

CREATE TABLE IF NOT EXISTS user_missions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    progress JSONB NOT NULL DEFAULT '{}',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, mission_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
;;;
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);
;;;

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

CREATE TABLE IF NOT EXISTS user_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
;;;

CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
;;;
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);
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
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_game_points();
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
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_mission_points();
;;;




-- Add trigger for sync activity scores
CREATE OR REPLACE FUNCTION fn_sync_activity_points()
    RETURNS TRIGGER AS $$
DECLARE
    v_activity_score INT;
BEGIN
    -- get score from activity id
    SELECT a.score INTO v_activity_score
    FROM activities a
    WHERE a.id = CASE
        WHEN TG_OP = 'DELETE' THEN OLD.activity_id
        ELSE NEW.activity_id
    END;

    -- make sure score is at least 0
    v_activity_score := COALESCE(v_activity_score, 0);

    -- update points in user table based on operation and completeness
    IF (TG_OP = 'INSERT' AND NEW.completed) THEN
        UPDATE users SET points = points + v_activity_score WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NOT OLD.completed AND NEW.completed) THEN
            UPDATE users SET points = points + v_activity_score WHERE id = NEW.user_id;
        ELSIF (OLD.completed AND NOT NEW.completed) THEN
            UPDATE users SET points = GREATEST(0, points - v_activity_score) WHERE id = NEW.user_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.completed) THEN
        UPDATE users SET points = GREATEST(0, points - v_activity_score) WHERE id = OLD.user_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
;;;

DROP TRIGGER IF EXISTS trg_activity_points ON user_activities;
;;;
CREATE TRIGGER trg_activity_points
    AFTER INSERT OR UPDATE OR DELETE ON user_activities
    FOR EACH ROW EXECUTE FUNCTION fn_sync_activity_points();
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
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_user_item_purchase();
;;;





CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
BEGIN
    -- check if any column has changed
    IF (OLD IS DISTINCT FROM NEW) THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
;;;

DROP TRIGGER IF EXISTS  trg_users_updated_at ON users;
;;;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
;;;

DROP TRIGGER IF EXISTS  trg_user_profiles_updated_at ON user_profiles;
;;;
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
;;;

DROP TRIGGER IF EXISTS  trg_user_missions_updated_at ON user_missions;
;;;
CREATE TRIGGER trg_user_missions_updated_at
    BEFORE UPDATE ON user_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
;;;

DROP TRIGGER IF EXISTS  trg_user_activities_updated_at ON user_activities;
;;;
CREATE TRIGGER trg_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
;;;