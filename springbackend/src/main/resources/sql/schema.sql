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
    password VARCHAR(120) NOT NULL
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