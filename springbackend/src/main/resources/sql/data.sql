-- EduQuest Initial Data
-- This file populates the database with essential initial data

-- Insert sample users
INSERT INTO users (username, email, password) VALUES
    ('john_doe', 'john.doe@example.com', '$2a$10$rQ9sJ8cL7m5n4b3v2c1d0e'),
    ('jane_smith', 'jane.smith@example.com', '$2a$10$sR9tK8uL6m5n4b3v2c1d0f'),
    ('mike_wilson', 'mike.wilson@example.com', '$2a$10$tS9uL8vM6n5o4b3w2c1d0g'),
    ('sarah_jones', 'sarah.jones@example.com', '$2a$10$uT9vM8wN6o5p4b3w2c1d0h'),
    ('admin_user', 'admin@example.com', '$2a$10$vU9wN8xO6p5q4b3w2c1d0i')
ON CONFLICT (username) DO NOTHING;